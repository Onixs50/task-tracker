import type { InlineKeyboard } from "@/lib/telegram";

export type BotLang = "fa" | "en";

export function detectLang(languageCode?: string | null): BotLang {
  return languageCode?.toLowerCase().startsWith("fa") ? "fa" : "en";
}

type Project = { id: string; name: string; icon: string | null };

const T = {
  fa: {
    needsCode:
      "سلام! برای اتصال حساب، از صفحه‌ی تنظیمات دفتر روزانه یه کد بگیر و با /start همراهش بفرست، یا روی همون دکمه‌ی اتصال کلیک کن.",
    unknownCode: "این کد معتبر نیست یا منقضی شده. از تنظیمات سایت یه کد جدید بگیر.",
    linked: "متصل شدی! 🎉 از اینجا می‌تونی پروژه بسازی و براش تسک ثبت کنی.",
    unlinked: "اتصال قطع شد. هر وقت خواستی دوباره از تنظیمات سایت وصل شو.",
    notLinked: "این چت به هیچ حسابی وصل نیست.",
    mustLink: "اول باید حسابت رو وصل کنی. از صفحه‌ی تنظیمات سایت یه کد بگیر و با /start بفرست.",
    mainMenuTitle: (name: string) =>
      `سلام ${name} 👋\n\nاز اینجا می‌تونی پروژه بسازی و براش تسک ثبت کنی، یا نظرت رو برای ما بفرستی.\n\n⚠️ برای <b>انجام دادن</b> تسک‌های روزانه‌ت، باز هم باید بری توی خود <b>سایت</b> — اینجا فقط جای <b>ثبت</b> تسک جدیده.`,
    btnProjects: "📁 پروژه‌های من",
    btnFeedback: "📮 انتقاد و پیشنهاد",
    btnLang: "🌐 زبان: فارسی",
    projectsTitle: "یکی از پروژه‌هات رو انتخاب کن یا یه پروژه‌ی جدید بساز:",
    noProjects: "هنوز هیچ پروژه‌ای نساختی. بزن بریم یکی بسازیم 🚀",
    btnNewProject: "➕ ساخت پروژه‌ی جدید",
    btnBack: "🔙 بازگشت",
    askProjectName: "اسم پروژه‌ی جدید رو بفرست:",
    projectCreated: (name: string) => `پروژه‌ی «${name}» ساخته شد ✅`,
    projectMenuTitle: (name: string) => `پروژه: <b>${name}</b>\n\nمی‌خوای چیکار کنی؟`,
    btnAddTask: "➕ افزودن تسک به این پروژه",
    btnProjectsBack: "🔙 پروژه‌ها",
    askTaskTitle: "اسم تسک رو بفرست:",
    askTaskDescription: "توضیحاتی برای این تسک داری؟ بفرستش، یا اگه نداری رد کن.",
    askTaskLink: "لینکی مربوط به این تسک هست؟ بفرستش، یا رد کن.",
    btnSkip: "⏭ رد کردن",
    btnCancel: "❌ لغو",
    taskSummary: (t: { title: string; description?: string | null; link?: string | null; project: string }) =>
      `این تسک ثبت بشه؟\n\n📁 پروژه: ${t.project}\n📝 عنوان: ${t.title}` +
      (t.description ? `\n💬 توضیحات: ${t.description}` : "") +
      (t.link ? `\n🔗 لینک: ${t.link}` : ""),
    btnConfirm: "✅ ثبت تسک",
    taskCreated:
      "تسک ثبت شد ✅\n\nحالا برو توی سایت، بخش «امروز»، تا ببینیش و انجامش بدی. یادت نره — انجام تسک فقط از توی سایته 🙂",
    cancelled: "لغو شد.",
    feedbackAsk:
      "خب، گوش می‌دیم 👂 هر انتقاد، پیشنهاد یا مشکلی داری همینجا بنویس. پیامت مستقیم برای مدیر فرستاده می‌شه.",
    feedbackSent: "ممنون! پیامت برای مدیر ارسال شد. اگه جواب بده، همینجا برات میاد 🙏",
    feedbackForwardHeader: (username: string) => `📮 پیام جدید از @${username}`,
    feedbackForwardHeaderNoUsername: (chatId: string) => `📮 پیام جدید از کاربر (چت ${chatId})`,
    feedbackForwardFooter: "برای پاسخ، فقط روی همین پیام ریپلای بزن.",
    feedbackReplyRelayed: "پاسخت برای کاربر ارسال شد ✅",
    feedbackReplyFromAdmin: "📬 پاسخ مدیر:",
    unknownInput: "متوجه نشدم 🤔 از منو یکی از گزینه‌ها رو انتخاب کن.",
    langChanged: "زبان به فارسی تغییر کرد 🇮🇷",
  },
  en: {
    needsCode:
      "Hi! To link your account, grab a code from Daily Ledger's settings page and send it with /start, or just tap the connect button there.",
    unknownCode: "That code isn't valid or has expired. Get a fresh one from the site's settings page.",
    linked: "You're linked! 🎉 From here you can create projects and add tasks to them.",
    unlinked: "Disconnected. Reconnect anytime from the site's settings page.",
    notLinked: "This chat isn't linked to any account.",
    mustLink: "Link your account first — grab a code from the site's settings page and send it with /start.",
    mainMenuTitle: (name: string) =>
      `Hey ${name} 👋\n\nFrom here you can create projects and add tasks to them, or send us feedback.\n\n⚠️ To <b>do</b> your daily tasks, you'll still need the <b>website</b> — this bot is only for <b>adding</b> new tasks.`,
    btnProjects: "📁 My projects",
    btnFeedback: "📮 Feedback & suggestions",
    btnLang: "🌐 Language: English",
    projectsTitle: "Pick one of your projects, or start a new one:",
    noProjects: "You don't have any projects yet. Let's make one 🚀",
    btnNewProject: "➕ New project",
    btnBack: "🔙 Back",
    askProjectName: "Send a name for the new project:",
    projectCreated: (name: string) => `Project "${name}" created ✅`,
    projectMenuTitle: (name: string) => `Project: <b>${name}</b>\n\nWhat would you like to do?`,
    btnAddTask: "➕ Add a task to this project",
    btnProjectsBack: "🔙 Projects",
    askTaskTitle: "Send a title for the task:",
    askTaskDescription: "Have a description for this task? Send it, or skip.",
    askTaskLink: "Any link for this task? Send it, or skip.",
    btnSkip: "⏭ Skip",
    btnCancel: "❌ Cancel",
    taskSummary: (t: { title: string; description?: string | null; link?: string | null; project: string }) =>
      `Add this task?\n\n📁 Project: ${t.project}\n📝 Title: ${t.title}` +
      (t.description ? `\n💬 Description: ${t.description}` : "") +
      (t.link ? `\n🔗 Link: ${t.link}` : ""),
    btnConfirm: "✅ Add task",
    taskCreated:
      "Task added ✅\n\nHead to the website's Today page to see it and check it off. Remember — doing tasks only happens on the site 🙂",
    cancelled: "Cancelled.",
    feedbackAsk:
      "We're listening 👂 Write any feedback, suggestion, or issue here. It'll go straight to the admin.",
    feedbackSent: "Thanks! Your message was sent to the admin. If they reply, it'll show up here 🙏",
    feedbackForwardHeader: (username: string) => `📮 New message from @${username}`,
    feedbackForwardHeaderNoUsername: (chatId: string) => `📮 New message from a user (chat ${chatId})`,
    feedbackForwardFooter: "To reply, just reply to this message.",
    feedbackReplyRelayed: "Your reply was sent to the user ✅",
    feedbackReplyFromAdmin: "📬 Admin reply:",
    unknownInput: "I didn't catch that 🤔 Please pick an option from the menu.",
    langChanged: "Language switched to English 🇬🇧",
  },
} as const;

export function t(lang: BotLang) {
  return T[lang];
}

export function mainMenuKeyboard(lang: BotLang): InlineKeyboard {
  const s = t(lang);
  return [
    [{ text: s.btnProjects, callback_data: "menu:projects" }],
    [{ text: s.btnFeedback, callback_data: "fb:new" }],
    [{ text: lang === "fa" ? "🌐 Language: English" : "🌐 زبان: فارسی", callback_data: lang === "fa" ? "lang:en" : "lang:fa" }],
  ];
}

export function projectsKeyboard(lang: BotLang, projects: Project[]): InlineKeyboard {
  const s = t(lang);
  const rows: InlineKeyboard = projects.map((p) => [
    { text: `${p.icon ?? "📁"} ${p.name}`, callback_data: `proj:open:${p.id}` },
  ]);
  rows.push([{ text: s.btnNewProject, callback_data: "proj:new" }]);
  rows.push([{ text: s.btnBack, callback_data: "menu:main" }]);
  return rows;
}

export function projectMenuKeyboard(lang: BotLang, projectId: string): InlineKeyboard {
  const s = t(lang);
  return [
    [{ text: s.btnAddTask, callback_data: `task:new:${projectId}` }],
    [{ text: s.btnProjectsBack, callback_data: "menu:projects" }],
  ];
}

export function skipCancelKeyboard(lang: BotLang, skipData: string): InlineKeyboard {
  const s = t(lang);
  return [
    [{ text: s.btnSkip, callback_data: skipData }],
    [{ text: s.btnCancel, callback_data: "task:cancel" }],
  ];
}

export function confirmCancelKeyboard(lang: BotLang): InlineKeyboard {
  const s = t(lang);
  return [
    [{ text: s.btnConfirm, callback_data: "task:confirm" }],
    [{ text: s.btnCancel, callback_data: "task:cancel" }],
  ];
}

export function backToMainKeyboard(lang: BotLang): InlineKeyboard {
  const s = t(lang);
  return [[{ text: s.btnBack, callback_data: "menu:main" }]];
}
