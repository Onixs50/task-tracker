import { createServiceClient } from "@/lib/supabase/service";
import { getAdminTelegramChatIds } from "@/lib/admin";
import {
  sendTelegramMessage,
  editTelegramMessage,
  answerCallbackQuery,
  deleteTelegramMessage,
  setTelegramCommands,
  sendTelegramBroadcast,
  type InlineKeyboard,
} from "@/lib/telegram";
import {
  detectLang,
  t,
  defaultIntro,
  mainMenuKeyboard,
  projectsKeyboard,
  projectMenuKeyboard,
  skipCancelKeyboard,
  confirmCancelKeyboard,
  cancelOnlyKeyboard,
  backToMainKeyboard,
  broadcastConfirmKeyboard,
  resetAllConfirmKeyboard,
  editIntroKeyboard,
  USER_COMMANDS,
  ADMIN_EXTRA_COMMANDS,
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

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function extractBundleId(link: string): string | null {
  const match = link.trim().match(/shared\/([0-9a-fA-F-]{10,})/);
  return match ? match[1] : null;
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

async function getIntroText(service: ServiceClient, lang: BotLang, name: string): Promise<string> {
  const { data } = await service
    .from("telegram_bot_settings")
    .select("intro_text_fa, intro_text_en")
    .eq("id", "main")
    .maybeSingle();
  const custom = lang === "fa" ? data?.intro_text_fa : data?.intro_text_en;
  if (custom) return custom.replace("{name}", name);
  return defaultIntro(lang, name);
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

async function ensureCommandsRegistered(service: ServiceClient, chatId: string, lang: BotLang, isAdmin: boolean) {
  await setTelegramCommands(USER_COMMANDS[lang]); // default scope, shown to everyone
  if (isAdmin) {
    await setTelegramCommands([...USER_COMMANDS[lang], ...ADMIN_EXTRA_COMMANDS[lang]], chatId);
  }
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
    const relayed = await tryRelayAdminReply(
      service,
      chatId,
      message.reply_to_message.message_id,
      message.message_id,
      text
    );
    if (relayed) return;
  }

  const adminChatIds = await getAdminTelegramChatIds();
  const isAdmin = adminChatIds.includes(chatId);

  if (text.startsWith("/start")) {
    await handleStart(service, chatId, text, username, languageCode, firstName, isAdmin);
    return;
  }

  if (text.startsWith("/stop")) {
    await handleStop(service, chatId);
    return;
  }

  if (text.startsWith("/menu") || text.startsWith("/cancel")) {
    await resetToIdle(service, chatId);
    const session = await getOrCreateSession(service, chatId, languageCode);
    await ensureCommandsRegistered(service, chatId, session.lang, isAdmin);
    await sendMainMenu(service, chatId, firstName, isAdmin);
    return;
  }

  if (text.startsWith("/feedback")) {
    const profile = await getLinkedProfile(service, chatId);
    const session = await getOrCreateSession(service, chatId, languageCode);
    if (!profile) {
      await sendTelegramMessage(chatId, t(session.lang).mustLink);
      return;
    }
    await saveSession(service, chatId, { state: "awaiting_feedback", draft: {} });
    await sendTelegramMessage(chatId, t(session.lang).feedbackAsk, backToMainKeyboard(session.lang));
    return;
  }

  // ── admin-only slash commands ──
  if (text.startsWith("/broadcast") || text.startsWith("/reset_me") || text.startsWith("/reset_user") || text.startsWith("/reset_all")) {
    const session = await getOrCreateSession(service, chatId, languageCode);
    if (!isAdmin) {
      await sendTelegramMessage(chatId, t(session.lang).notAdmin);
      return;
    }
    await handleAdminCommand(service, chatId, session.lang, text);
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
    case "awaiting_bundle_link": {
      await handleBundleImport(service, chatId, lang, profile.id, text.trim());
      return;
    }
    case "awaiting_broadcast_text": {
      const draft = { text: text.trim() };
      const { count } = await countLinkedUsers(service);
      await saveSession(service, chatId, { state: "awaiting_broadcast_confirm", draft });
      await sendTelegramMessage(chatId, s.broadcastPreview(draft.text, count), broadcastConfirmKeyboard(lang));
      return;
    }
    case "awaiting_reset_username": {
      await resetSingleUser(service, chatId, lang, text.trim().replace(/^@/, ""));
      return;
    }
    case "awaiting_edit_intro": {
      const column = lang === "fa" ? "intro_text_fa" : "intro_text_en";
      await service.from("telegram_bot_settings").update({ [column]: text, updated_at: new Date().toISOString() }).eq("id", "main");
      await resetToIdle(service, chatId);
      await sendTelegramMessage(chatId, s.editIntroSaved);
      return;
    }
    default:
      await sendTelegramMessage(chatId, s.unknownInput);
      await sendMainMenu(service, chatId, firstName, isAdmin);
      return;
  }
}

async function handleStart(
  service: ServiceClient,
  chatId: string,
  text: string,
  username: string | undefined,
  languageCode: string | undefined,
  firstName: string,
  isAdmin: boolean
) {
  const code = text.replace("/start", "").trim().toUpperCase();

  if (!code) {
    const existing = await getLinkedProfile(service, chatId);
    if (existing) {
      const session = await getOrCreateSession(service, chatId, languageCode);
      await ensureCommandsRegistered(service, chatId, session.lang, isAdmin);
      await sendMainMenu(service, chatId, firstName, isAdmin);
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

  const session = await getOrCreateSession(service, chatId, languageCode); // ensures a session row exists
  await ensureCommandsRegistered(service, chatId, session.lang, isAdmin);
  await sendTelegramMessage(chatId, `${t("fa").linked}\n\n${t("en").linked}`);
  await sendMainMenu(service, chatId, firstName, isAdmin);
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

async function handleAdminCommand(service: ServiceClient, chatId: string, lang: BotLang, text: string) {
  const s = t(lang);

  if (text.startsWith("/broadcast")) {
    const arg = text.replace("/broadcast", "").trim();
    if (arg) {
      const { count } = await countLinkedUsers(service);
      await saveSession(service, chatId, { state: "awaiting_broadcast_confirm", draft: { text: arg } });
      await sendTelegramMessage(chatId, s.broadcastPreview(arg, count), broadcastConfirmKeyboard(lang));
      return;
    }
    await saveSession(service, chatId, { state: "awaiting_broadcast_text", draft: {} });
    await sendTelegramMessage(chatId, s.askBroadcast, cancelOnlyKeyboard(lang));
    return;
  }

  if (text.startsWith("/reset_me")) {
    await resetToIdle(service, chatId);
    await sendTelegramMessage(chatId, s.resetMeDone);
    return;
  }

  if (text.startsWith("/reset_user")) {
    const arg = text.replace("/reset_user", "").trim().replace(/^@/, "");
    if (arg) {
      await resetSingleUser(service, chatId, lang, arg);
      return;
    }
    await saveSession(service, chatId, { state: "awaiting_reset_username", draft: {} });
    await sendTelegramMessage(chatId, s.askResetUsername, cancelOnlyKeyboard(lang));
    return;
  }

  if (text.startsWith("/reset_all")) {
    await sendTelegramMessage(chatId, s.resetAllConfirmAsk, resetAllConfirmKeyboard(lang));
    return;
  }
}

async function resetSingleUser(service: ServiceClient, adminChatId: string, lang: BotLang, username: string) {
  const s = t(lang);
  const { data: profile } = await service
    .from("profiles")
    .select("telegram_chat_id")
    .eq("telegram_username", username)
    .maybeSingle();

  await resetToIdle(service, adminChatId);

  if (!profile?.telegram_chat_id) {
    await sendTelegramMessage(adminChatId, s.resetUserNotFound);
    return;
  }
  await resetToIdle(service, profile.telegram_chat_id);
  await sendTelegramMessage(adminChatId, s.resetUserDone(username));
}

async function countLinkedUsers(service: ServiceClient): Promise<{ count: number; chatIds: string[] }> {
  const { data } = await service.from("profiles").select("telegram_chat_id").not("telegram_chat_id", "is", null);
  const chatIds = (data ?? []).map((p) => p.telegram_chat_id!).filter(Boolean);
  return { count: chatIds.length, chatIds };
}

async function handleBundleImport(service: ServiceClient, chatId: string, lang: BotLang, userId: string, link: string) {
  const s = t(lang);
  const bundleId = extractBundleId(link);
  if (!bundleId) {
    await sendTelegramMessage(chatId, s.importInvalidLink, cancelOnlyKeyboard(lang));
    return;
  }

  const { data: bundle } = await service
    .from("shared_bundles")
    .select("id, payload, from_username")
    .eq("id", bundleId)
    .maybeSingle();

  if (!bundle) {
    await resetToIdle(service, chatId);
    await sendTelegramMessage(chatId, s.importNotFound);
    return;
  }

  const payload = (bundle.payload as any[]) ?? [];
  if (payload.length === 0) {
    await resetToIdle(service, chatId);
    await sendTelegramMessage(chatId, s.importEmpty);
    return;
  }

  const rows = payload.map((tpl) => ({
    recipient_id: userId,
    from_username: bundle.from_username ?? null,
    bundle_id: bundle.id,
    title: tpl.title,
    description: tpl.description ?? null,
    link_url: tpl.link_url ?? null,
    extra_links: tpl.extra_links ?? [],
    category: tpl.category ?? "custom",
    emoji: tpl.emoji ?? "✅",
    recurrence_type: tpl.recurrence_type ?? "daily",
    recurrence_days: tpl.recurrence_days ?? null,
    custom_dates: tpl.custom_dates ?? null,
    priority: tpl.priority ?? "medium",
  }));

  await service.from("received_tasks").insert(rows);
  await resetToIdle(service, chatId);
  await sendTelegramMessage(chatId, s.importSuccess(rows.length, bundle.from_username), backToMainKeyboard(lang));
}

async function handleCallback(service: ServiceClient, cq: any) {
  const chatId: string = cq.message?.chat?.id?.toString();
  const messageId: number | undefined = cq.message?.message_id;
  const data: string = cq.data ?? "";
  const firstName: string = cq.from?.first_name ?? "";
  if (!chatId) return;

  await answerCallbackQuery(cq.id);

  const adminChatIds = await getAdminTelegramChatIds();
  const isAdmin = adminChatIds.includes(chatId);
  const profile = await getLinkedProfile(service, chatId);
  const session = await getOrCreateSession(service, chatId, cq.from?.language_code);
  const lang = session.lang;
  const s = t(lang);

  if (data === "lang:fa" || data === "lang:en") {
    const newLang: BotLang = data === "lang:fa" ? "fa" : "en";
    await saveSession(service, chatId, { lang: newLang });
    const intro = await getIntroText(service, newLang, firstName || "");
    await render(chatId, messageId, intro, mainMenuKeyboard(newLang, isAdmin));
    return;
  }

  if (!profile) {
    await render(chatId, messageId, s.mustLink, backToMainKeyboard(lang));
    return;
  }

  if (data === "menu:main") {
    await resetToIdle(service, chatId);
    const intro = await getIntroText(service, lang, firstName || "");
    await render(chatId, messageId, intro, mainMenuKeyboard(lang, isAdmin));
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

  if (data === "import:new") {
    await saveSession(service, chatId, { state: "awaiting_bundle_link", draft: {} });
    await render(chatId, messageId, s.askImportLink, cancelOnlyKeyboard(lang));
    return;
  }

  // ── admin-only callbacks ──
  if (data.startsWith("admin:")) {
    if (!isAdmin) {
      await render(chatId, messageId, s.notAdmin, backToMainKeyboard(lang));
      return;
    }
    await handleAdminCallback(service, chatId, lang, data, messageId);
    return;
  }
}

async function handleAdminCallback(
  service: ServiceClient,
  chatId: string,
  lang: BotLang,
  data: string,
  messageId?: number
) {
  const s = t(lang);

  if (data === "admin:broadcast") {
    await saveSession(service, chatId, { state: "awaiting_broadcast_text", draft: {} });
    await render(chatId, messageId, s.askBroadcast, cancelOnlyKeyboard(lang));
    return;
  }

  if (data === "admin:broadcast:confirm") {
    const session = await getOrCreateSession(service, chatId);
    const text = session.draft?.text;
    if (!text) {
      await resetToIdle(service, chatId);
      await render(chatId, messageId, s.cancelled, backToMainKeyboard(lang));
      return;
    }
    const { chatIds } = await countLinkedUsers(service);
    const sent = await sendTelegramBroadcast(chatIds, text);
    await service.from("telegram_broadcasts").insert({ message: text, recipient_count: sent });
    await resetToIdle(service, chatId);
    await render(chatId, messageId, s.broadcastSent(sent), backToMainKeyboard(lang));
    return;
  }

  if (data === "admin:reset_all:confirm") {
    const { data: rows } = await service
      .from("telegram_sessions")
      .update({ state: "idle", draft: {}, updated_at: new Date().toISOString() })
      .neq("chat_id", "")
      .select("chat_id");
    await resetToIdle(service, chatId);
    await render(chatId, messageId, s.resetAllDone((rows ?? []).length), backToMainKeyboard(lang));
    return;
  }

  if (data === "admin:edit_intro") {
    await saveSession(service, chatId, { state: "awaiting_edit_intro", draft: {} });
    await render(chatId, messageId, s.askEditIntro, editIntroKeyboard(lang));
    return;
  }

  if (data === "admin:edit_intro:reset") {
    const column = lang === "fa" ? "intro_text_fa" : "intro_text_en";
    await service.from("telegram_bot_settings").update({ [column]: null, updated_at: new Date().toISOString() }).eq("id", "main");
    await resetToIdle(service, chatId);
    await render(chatId, messageId, s.editIntroReset, backToMainKeyboard(lang));
    return;
  }
}

async function sendMainMenu(service: ServiceClient, chatId: string, firstName: string, isAdmin: boolean) {
  const session = await getOrCreateSession(service, chatId);
  const intro = await getIntroText(service, session.lang, firstName || "");
  await sendTelegramMessage(chatId, intro, mainMenuKeyboard(session.lang, isAdmin));
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

/**
 * When an admin replies (Telegram "reply") to a forwarded feedback message:
 * relays the reply to the original user, marks the thread answered, and —
 * to keep the admin's chat tidy — deletes both the forwarded question (in
 * every admin's chat that received a copy) and the admin's own reply message.
 */
async function tryRelayAdminReply(
  service: ServiceClient,
  adminChatId: string,
  repliedToMessageId: number,
  replyMessageId: number,
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

  // Clean up: remove the forwarded question from every admin chat that got a copy,
  // and remove the replying admin's own reply text too.
  const copies = (match.admin_message_ids ?? {}) as Record<string, number>;
  await Promise.all(
    Object.entries(copies).map(([copyChatId, copyMessageId]) => deleteTelegramMessage(copyChatId, copyMessageId))
  );
  await deleteTelegramMessage(adminChatId, replyMessageId);

  const adminSession = await getOrCreateSession(service, adminChatId);
  const confirmMsg = await sendTelegramMessage(adminChatId, t(adminSession.lang).feedbackReplyRelayed);
  if (confirmMsg) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await deleteTelegramMessage(adminChatId, confirmMsg.message_id);
  }
  return true;
}
