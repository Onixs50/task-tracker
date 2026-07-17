import { createServiceClient } from "@/lib/supabase/service";
import { getAdminTelegramChatIds } from "@/lib/admin";
import {
  sendTelegramMessage,
  editTelegramMessage,
  answerCallbackQuery,
  type InlineKeyboard,
} from "@/lib/telegram";
import {
  detectLang,
  t,
  mainMenuKeyboard,
  projectsKeyboard,
  projectMenuKeyboard,
  skipCancelKeyboard,
  confirmCancelKeyboard,
  backToMainKeyboard,
  type BotLang,
} from "@/lib/telegram-bot-texts";

type ServiceClient = ReturnType<typeof createServiceClient>;

interface Session {
  chat_id: string;
  user_id: string | null;
  lang: BotLang;
  state: string;
  draft: Record<string, any>;
}

const LINKED_TEXT_FA =
  "متصل شدی! از این به بعد یادآوری تسک‌هات از همینجا برات میاد. برای قطع اتصال هر وقت خواستی /stop رو بفرست.";
const LINKED_TEXT_EN =
  "You're linked! Task reminders will now show up here. Send /stop anytime to disconnect.";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

async function getOrCreateSession(
  service: ServiceClient,
  chatId: string,
  fallbackLangCode?: string | null
): Promise<Session> {
  const { data } = await service.from("telegram_sessions").select("*").eq("chat_id", chatId).maybeSingle();
  if (data) return { ...data, lang: (data.lang as BotLang) ?? "fa", draft: data.draft ?? {} };

  const lang = detectLang(fallbackLangCode);
  const fresh: Session = { chat_id: chatId, user_id: null, lang, state: "idle", draft: {} };
  await service.from("telegram_sessions").insert({ chat_id: chatId, lang, state: "idle", draft: {} });
  return fresh;
}

async function saveSession(service: ServiceClient, chatId: string, patch: Partial<Session>) {
  await service
    .from("telegram_sessions")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("chat_id", chatId);
}

async function resetToIdle(service: ServiceClient, chatId: string) {
  await saveSession(service, chatId, { state: "idle", draft: {} });
}

async function getLinkedProfile(service: ServiceClient, chatId: string) {
  const { data } = await service
    .from("profiles")
    .select("id, display_name, username")
    .eq("telegram_chat_id", chatId)
    .maybeSingle();
  return data;
}

/** Sends (or edits, if a messageId is given) a menu screen. Falls back to a new message if editing fails. */
async function render(
  chatId: string,
  messageId: number | null | undefined,
  text: string,
  keyboard: InlineKeyboard
) {
  if (messageId) {
    const ok = await editTelegramMessage(chatId, messageId, text, keyboard);
    if (ok) return;
  }
  await sendTelegramMessage(chatId, text, keyboard);
}

export async function handleTelegramUpdate(update: any) {
  const service = createServiceClient();

  if (update?.callback_query) {
    await handleCallback(service, update.callback_query);
    return;
  }

  const message = update?.message;
  if (!message?.chat?.id) return;
  await handleMessage(service, message);
}

async function handleMessage(service: ServiceClient, message: any) {
  const chatId: string = message.chat.id.toString();
  const text: string | undefined = message.text;
  const username: string | undefined = message.from?.username;
  const languageCode: string | undefined = message.from?.language_code;
  const firstName: string = message.from?.first_name ?? "";

  if (!text) return;

  // An admin replying (Telegram "reply") to a forwarded feedback message —
  // this works regardless of the admin's own menu state.
  if (message.reply_to_message?.message_id) {
    const relayed = await tryRelayAdminReply(service, chatId, message.reply_to_message.message_id, text);
    if (relayed) return;
  }

  if (text.startsWith("/start")) {
    await handleStart(service, chatId, text, username, languageCode, firstName);
    return;
  }

  if (text.startsWith("/stop")) {
    await handleStop(service, chatId);
    return;
  }

  if (text.startsWith("/menu") || text.startsWith("/cancel")) {
    await resetToIdle(service, chatId);
    await sendMainMenu(service, chatId, firstName);
    return;
  }

  const profile = await getLinkedProfile(service, chatId);
  const session = await getOrCreateSession(service, chatId, languageCode);
  const lang = session.lang;
  const s = t(lang);

  if (!profile) {
    await sendTelegramMessage(chatId, s.mustLink);
    return;
  }

  switch (session.state) {
    case "awaiting_project_name": {
      const name = text.trim().slice(0, 60);
      if (!name) return;
      const { data: project } = await service
        .from("projects")
        .insert({ user_id: profile.id, name })
        .select("id, name")
        .single();
      await resetToIdle(service, chatId);
      if (!project) return;
      await sendTelegramMessage(chatId, s.projectCreated(project.name));
      await sendProjectMenu(service, chatId, lang, project.id, null);
      return;
    }
    case "awaiting_task_title": {
      const title = text.trim().slice(0, 120);
      if (!title) return;
      await saveSession(service, chatId, { state: "awaiting_task_description", draft: { ...session.draft, title } });
      await sendTelegramMessage(chatId, s.askTaskDescription, skipCancelKeyboard(lang, "task:skip:desc"));
      return;
    }
    case "awaiting_task_description": {
      const description = text.trim().slice(0, 500);
      await saveSession(service, chatId, {
        state: "awaiting_task_link",
        draft: { ...session.draft, description },
      });
      await sendTelegramMessage(chatId, s.askTaskLink, skipCancelKeyboard(lang, "task:skip:link"));
      return;
    }
    case "awaiting_task_link": {
      const link = text.trim().slice(0, 300);
      await saveSession(service, chatId, { state: "awaiting_task_confirm", draft: { ...session.draft, link } });
      await sendTaskSummary(service, chatId, lang, { ...session.draft, link });
      return;
    }
    case "awaiting_feedback": {
      await createFeedback(service, chatId, username, profile.id, text.trim());
      await resetToIdle(service, chatId);
      await sendTelegramMessage(chatId, s.feedbackSent);
      return;
    }
    default:
      await sendTelegramMessage(chatId, s.unknownInput);
      await sendMainMenu(service, chatId, firstName, profile);
      return;
  }
}

async function handleStart(
  service: ServiceClient,
  chatId: string,
  text: string,
  username: string | undefined,
  languageCode: string | undefined,
  firstName: string
) {
  const code = text.replace("/start", "").trim().toUpperCase();

  if (!code) {
    const existing = await getLinkedProfile(service, chatId);
    if (existing) {
      await sendMainMenu(service, chatId, firstName, existing);
      return;
    }
    const lang = detectLang(languageCode);
    await sendTelegramMessage(chatId, t(lang).mustLink);
    return;
  }

  const { data: profile } = await service.from("profiles").select("id").eq("telegram_link_code", code).maybeSingle();

  if (!profile) {
    const lang = detectLang(languageCode);
    await sendTelegramMessage(chatId, t(lang).unknownCode);
    return;
  }

  await service
    .from("profiles")
    .update({ telegram_chat_id: chatId, telegram_username: username ?? null, telegram_link_code: null })
    .eq("id", profile.id);

  await getOrCreateSession(service, chatId, languageCode); // ensures a session row exists
  await sendTelegramMessage(chatId, `${LINKED_TEXT_FA}\n\n${LINKED_TEXT_EN}`);
  await sendMainMenu(service, chatId, firstName);
}

async function handleStop(service: ServiceClient, chatId: string) {
  const profile = await getLinkedProfile(service, chatId);
  const lang = (await getOrCreateSession(service, chatId)).lang;
  if (!profile) {
    await sendTelegramMessage(chatId, t(lang).notLinked);
    return;
  }
  await service.from("profiles").update({ telegram_chat_id: null }).eq("id", profile.id);
  await resetToIdle(service, chatId);
  await sendTelegramMessage(chatId, t(lang).unlinked);
}

async function handleCallback(service: ServiceClient, cq: any) {
  const chatId: string = cq.message?.chat?.id?.toString();
  const messageId: number | undefined = cq.message?.message_id;
  const data: string = cq.data ?? "";
  const firstName: string = cq.from?.first_name ?? "";
  if (!chatId) return;

  await answerCallbackQuery(cq.id);

  const profile = await getLinkedProfile(service, chatId);
  const session = await getOrCreateSession(service, chatId, cq.from?.language_code);
  const lang = session.lang;
  const s = t(lang);

  if (data === "lang:fa" || data === "lang:en") {
    const newLang: BotLang = data === "lang:fa" ? "fa" : "en";
    await saveSession(service, chatId, { lang: newLang });
    await render(chatId, messageId, t(newLang).mainMenuTitle(firstName), mainMenuKeyboard(newLang));
    return;
  }

  if (!profile) {
    await render(chatId, messageId, s.mustLink, backToMainKeyboard(lang));
    return;
  }

  if (data === "menu:main") {
    await resetToIdle(service, chatId);
    await render(chatId, messageId, s.mainMenuTitle(firstName), mainMenuKeyboard(lang));
    return;
  }

  if (data === "menu:projects") {
    await resetToIdle(service, chatId);
    await sendProjectsList(service, chatId, lang, profile.id, messageId);
    return;
  }

  if (data === "proj:new") {
    await saveSession(service, chatId, { state: "awaiting_project_name", draft: {} });
    await render(chatId, messageId, s.askProjectName, backToMainKeyboard(lang));
    return;
  }

  if (data.startsWith("proj:open:")) {
    const projectId = data.slice("proj:open:".length);
    await resetToIdle(service, chatId);
    await sendProjectMenu(service, chatId, lang, projectId, messageId);
    return;
  }

  if (data.startsWith("task:new:")) {
    const projectId = data.slice("task:new:".length);
    await saveSession(service, chatId, { state: "awaiting_task_title", draft: { project_id: projectId } });
    await render(chatId, messageId, s.askTaskTitle, backToMainKeyboard(lang));
    return;
  }

  if (data === "task:skip:desc") {
    await saveSession(service, chatId, {
      state: "awaiting_task_link",
      draft: { ...session.draft, description: null },
    });
    await render(chatId, messageId, s.askTaskLink, skipCancelKeyboard(lang, "task:skip:link"));
    return;
  }

  if (data === "task:skip:link") {
    const draft = { ...session.draft, link: null };
    await saveSession(service, chatId, { state: "awaiting_task_confirm", draft });
    await sendTaskSummary(service, chatId, lang, draft, messageId);
    return;
  }

  if (data === "task:cancel") {
    await resetToIdle(service, chatId);
    await render(chatId, messageId, s.cancelled, backToMainKeyboard(lang));
    return;
  }

  if (data === "task:confirm") {
    await finalizeTask(service, chatId, lang, profile.id, session.draft, messageId);
    return;
  }

  if (data === "fb:new") {
    await saveSession(service, chatId, { state: "awaiting_feedback", draft: {} });
    await render(chatId, messageId, s.feedbackAsk, backToMainKeyboard(lang));
    return;
  }
}

async function sendMainMenu(
  service: ServiceClient,
  chatId: string,
  firstName: string,
  profileArg?: { id: string } | null
) {
  const session = await getOrCreateSession(service, chatId);
  const s = t(session.lang);
  await sendTelegramMessage(chatId, s.mainMenuTitle(firstName || ""), mainMenuKeyboard(session.lang));
}

async function sendProjectsList(
  service: ServiceClient,
  chatId: string,
  lang: BotLang,
  userId: string,
  messageId?: number
) {
  const s = t(lang);
  const { data: projects } = await service
    .from("projects")
    .select("id, name, icon")
    .eq("user_id", userId)
    .order("created_at");
  const text = (projects ?? []).length > 0 ? s.projectsTitle : s.noProjects;
  await render(chatId, messageId, text, projectsKeyboard(lang, projects ?? []));
}

async function sendProjectMenu(
  service: ServiceClient,
  chatId: string,
  lang: BotLang,
  projectId: string,
  messageId?: number | null
) {
  const s = t(lang);
  const { data: project } = await service.from("projects").select("id, name").eq("id", projectId).maybeSingle();
  if (!project) {
    await sendProjectsList(service, chatId, lang, "", messageId ?? undefined);
    return;
  }
  await render(chatId, messageId ?? undefined, s.projectMenuTitle(project.name), projectMenuKeyboard(lang, project.id));
}

async function sendTaskSummary(
  service: ServiceClient,
  chatId: string,
  lang: BotLang,
  draft: Record<string, any>,
  messageId?: number
) {
  const s = t(lang);
  const { data: project } = await service
    .from("projects")
    .select("name")
    .eq("id", draft.project_id)
    .maybeSingle();
  const text = s.taskSummary({
    title: draft.title,
    description: draft.description,
    link: draft.link,
    project: project?.name ?? "",
  });
  await render(chatId, messageId, text, confirmCancelKeyboard(lang));
}

async function finalizeTask(
  service: ServiceClient,
  chatId: string,
  lang: BotLang,
  userId: string,
  draft: Record<string, any>,
  messageId?: number
) {
  const s = t(lang);
  if (!draft?.project_id || !draft?.title) {
    await resetToIdle(service, chatId);
    await render(chatId, messageId, s.cancelled, backToMainKeyboard(lang));
    return;
  }

  await service.from("task_templates").insert({
    user_id: userId,
    project_id: draft.project_id,
    title: draft.title,
    description: draft.description || null,
    link_url: draft.link || null,
    category: "telegram_push",
    emoji: "📨",
    recurrence_type: "daily",
    priority: "medium",
    start_date: todayISO(),
    active: true,
    archived: false,
  });

  await resetToIdle(service, chatId);
  await render(chatId, messageId, s.taskCreated, backToMainKeyboard(lang));
}

async function createFeedback(
  service: ServiceClient,
  chatId: string,
  username: string | undefined,
  userId: string,
  message: string
) {
  const { data: feedback } = await service
    .from("feedback_messages")
    .insert({ user_id: userId, chat_id: chatId, username: username ?? null, message })
    .select("id")
    .single();
  if (!feedback) return;

  const adminChatIds = await getAdminTelegramChatIds();
  const session = await getOrCreateSession(service, chatId);
  const s = t(session.lang);
  const header = username ? s.feedbackForwardHeader(username) : s.feedbackForwardHeaderNoUsername(chatId);
  const forwardText = `${header}\n\n${message}\n\n<i>${s.feedbackForwardFooter}</i>`;

  const messageIds: Record<string, number> = {};
  for (const adminChatId of adminChatIds) {
    if (adminChatId === chatId) continue; // don't forward a user's own feedback to themselves if they're also an admin
    const sent = await sendTelegramMessage(adminChatId, forwardText);
    if (sent) messageIds[adminChatId] = sent.message_id;
  }

  if (Object.keys(messageIds).length > 0) {
    await service.from("feedback_messages").update({ admin_message_ids: messageIds }).eq("id", feedback.id);
  }
}

async function tryRelayAdminReply(
  service: ServiceClient,
  adminChatId: string,
  repliedToMessageId: number,
  replyText: string
): Promise<boolean> {
  const { data: candidates } = await service
    .from("feedback_messages")
    .select("id, chat_id, admin_message_ids")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(200);

  const match = (candidates ?? []).find((row) => row.admin_message_ids?.[adminChatId] === repliedToMessageId);
  if (!match) return false;

  const userSession = await getOrCreateSession(service, match.chat_id);
  const s = t(userSession.lang);
  await sendTelegramMessage(match.chat_id, `${s.feedbackReplyFromAdmin}\n\n${replyText}`);

  await service
    .from("feedback_messages")
    .update({ admin_reply: replyText, status: "answered", replied_at: new Date().toISOString() })
    .eq("id", match.id);

  const adminSession = await getOrCreateSession(service, adminChatId);
  await sendTelegramMessage(adminChatId, t(adminSession.lang).feedbackReplyRelayed);
  return true;
}
