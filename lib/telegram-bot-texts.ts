import type { InlineKeyboard, BotCommand } from "@/lib/telegram";

export type BotLang = "fa" | "en";

export function detectLang(languageCode?: string | null): BotLang {
  return languageCode?.toLowerCase().startsWith("fa") ? "fa" : "en";
}

type Project = { id: string; name: string; icon: string | null };

const DEFAULT_INTRO_FA =
  "سلام {name} 👋\n\nاز اینجا می‌تونی پروژه بسازی، براش تسک ثبت کنی، یا لینک اشتراکی که یکی برات فرستاده رو بدی بره توی کابینتت.\n\n💡 اینجا فقط یه امکان اضافه برای ثبت تسکه — برای دیدن و انجام تسک‌های روزانه‌ت هنوز باید بری توی خود سایت.";
const DEFAULT_INTRO_EN =
  "Hey {name} 👋\n\nFrom here you can create projects, add tasks to them, or hand over a share link someone sent you so it lands in your Cabinet.\n\n💡 This is just an extra way to add tasks — you'll still head to the website itself to see and check off your daily tasks.";

const T = {
  fa: {
    needsCode:
      "سلام! برای اتصال حساب، از صفحه‌ی تنظیمات دفتر روزانه یه کد بگیر و با /start همراهش بفرست، یا روی همون دکمه‌ی اتصال کلیک کن.",
    unknownCode: "این کد معتبر نیست یا منقضی شده. از تنظیمات سایت یه کد جدید بگیر.",
    linked: "متصل شدی! از این به بعد یادآوری تسک‌هات از همینجا برات میاد. برای قطع اتصال هر وقت خواستی /stop رو بفرست.",
    unlinked: "اتصال قطع شد. هر وقت خواستی دوباره از تنظیمات سایت وصل شو.",
    notLinked: "این چت به هیچ حسابی وصل نیست.",
    mustLink: "اول باید حسابت رو وصل کنی. از صفحه‌ی تنظیمات سایت یه کد بگیر و با /start بفرست.",
    introTemplate: (name: string) => DEFAULT_INTRO_FA.replace("{name}", name),
    btnProjects: "📁 پروژه‌های من",
    btnFeedback: "📮 انتقاد و پیشنهاد",
    btnImportLink: "📥 افزودن از لینک اشتراکی",
    btnLangToEn: "🌐 زبان: English",
    btnLangToFa: "🌐 زبان: فارسی",
    btnBroadcast: "📢 ارسال پیام به همه",
    btnEditIntro: "✏️ ویرایش متن منو",
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
    taskSummary: (task: { title: string; description?: string | null; link?: string | null; project: string }) =>
      `این تسک ثبت بشه؟\n\n📁 پروژه: ${task.project}\n📝 عنوان: ${task.title}` +
      (task.description ? `\n💬 توضیحات: ${task.description}` : "") +
      (task.link ? `\n🔗 لینک: ${task.link}` : ""),
    btnConfirm: "✅ ثبت تسک",
    taskCreated:
      "تسک ثبت شد ✅\n\nحالا برو توی سایت، بخش «امروز»، تا ببینیش و انجامش بدی. یادت نره — انجام تسک فقط از توی سایته 🙂",
    cancelled: "لغو شد.",
    feedbackAsk: "خب، گوش می‌دیم 👂 هر انتقاد، پیشنهاد یا مشکلی داری همینجا بنویس. پیامت مستقیم برای مدیر فرستاده می‌شه.",
    feedbackSent: "ممنون! پیامت برای مدیر ارسال شد. اگه جواب بده، همینجا برات میاد 🙏",
    feedbackForwardHeader: (username: string) => `📮 پیام جدید از @${username}`,
    feedbackForwardHeaderNoUsername: (chatId: string) => `📮 پیام جدید از کاربر (چت ${chatId})`,
    feedbackForwardFooter: "برای پاسخ، فقط روی همین پیام ریپلای بزن.",
    feedbackReplyRelayed: "پاسخت برای کاربر ارسال شد ✅ (این گفتگو از چتت پاک شد)",
    feedbackReplyFromAdmin: "📬 پاسخ مدیر:",
    unknownInput: "متوجه نشدم 🤔 از منو یکی از گزینه‌ها رو انتخاب کن.",
    langChanged: "زبان به فارسی تغییر کرد 🇮🇷",
    askImportLink: "لینک اشتراکی رو (همونی که یکی از دوستات برات فرستاده) همینجا بفرست:",
    importInvalidLink: "این یه لینک اشتراک‌گذاری معتبر از سایت نبود. یه بار دیگه امتحان کن یا لغو کن.",
    importNotFound: "این لینک دیگه معتبر نیست یا پیدا نشد.",
    importEmpty: "این بسته خالیه، چیزی برای افزودن نبود.",
    importSuccess: (count: number, from?: string | null) =>
      `${count} تسک${from ? ` از طرف ${from}` : ""} به کابینتت اضافه شد 📥\n\nهر وقت خواستی از توی سایت، بخش «کابینت»، انتخاب کن کدوم بره توی لیست تسک‌های خودت.`,
    // ── admin-only ──
    notAdmin: "این دستور فقط برای مدیرهاست.",
    askBroadcast: "متنی که می‌خوای برای همه‌ی کاربرهای وصل‌شده فرستاده بشه رو بنویس:",
    broadcastPreview: (text: string, count: number) => `این پیام برای ${count} نفر فرستاده بشه؟\n\n—\n${text}\n—`,
    btnBroadcastConfirm: "📢 بله، برای همه بفرست",
    broadcastSent: (count: number) => `فرستاده شد ✅ (برای ${count} نفر)`,
    resetMeDone: "بات برای خودت ریست شد؛ منوی اصلی رو دوباره باز کن.",
    askResetUsername: "یوزرنیم تلگرام کاربر مورد نظر رو بفرست (بدون @):",
    resetUserNotFound: "کاربری با این یوزرنیم پیدا نشد یا هنوز تلگرامش رو وصل نکرده.",
    resetUserDone: (name: string) => `بات برای @${name} ریست شد ✅`,
    resetAllConfirmAsk: "⚠️ مطمئنی می‌خوای بات رو برای همه‌ی کاربرها ریست کنی؟",
    btnResetAllConfirm: "⚠️ بله، برای همه ریست کن",
    resetAllDone: (count: number) => `بات برای ${count} کاربر ریست شد ✅`,
    askEditIntro: "متن جدید منوی اصلی (فارسی) رو بفرست. جای اسم کاربر رو با {name} بذار.",
    editIntroSaved: "متن منو به‌روز شد ✅",
    editIntroReset: "متن منو به حالت پیش‌فرض برگشت.",
    btnResetIntro: "↩️ برگردوندن به پیش‌فرض",
  },
  en: {
    needsCode:
      "Hi! To link your account, grab a code from Daily Ledger's settings page and send it with /start, or just tap the connect button there.",
    unknownCode: "That code isn't valid or has expired. Get a fresh one from the site's settings page.",
    linked: "You're linked! Task reminders will now show up here. Send /stop anytime to disconnect.",
    unlinked: "Disconnected. Reconnect anytime from the site's settings page.",
    notLinked: "This chat isn't linked to any account.",
    mustLink: "Link your account first — grab a code from the site's settings page and send it with /start.",
    introTemplate: (name: string) => DEFAULT_INTRO_EN.replace("{name}", name),
    btnProjects: "📁 My projects",
    btnFeedback: "📮 Feedback & suggestions",
    btnImportLink: "📥 Add from a share link",
    btnLangToEn: "🌐 Language: English",
    btnLangToFa: "🌐 زبان: فارسی",
    btnBroadcast: "📢 Message everyone",
    btnEditIntro: "✏️ Edit menu text",
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
    taskSummary: (task: { title: string; description?: string | null; link?: string | null; project: string }) =>
      `Add this task?\n\n📁 Project: ${task.project}\n📝 Title: ${task.title}` +
      (task.description ? `\n💬 Description: ${task.description}` : "") +
      (task.link ? `\n🔗 Link: ${task.link}` : ""),
    btnConfirm: "✅ Add task",
    taskCreated:
      "Task added ✅\n\nHead to the website's Today page to see it and check it off. Remember — doing tasks only happens on the site 🙂",
    cancelled: "Cancelled.",
    feedbackAsk: "We're listening 👂 Write any feedback, suggestion, or issue here. It'll go straight to the admin.",
    feedbackSent: "Thanks! Your message was sent to the admin. If they reply, it'll show up here 🙏",
    feedbackForwardHeader: (username: string) => `📮 New message from @${username}`,
    feedbackForwardHeaderNoUsername: (chatId: string) => `📮 New message from a user (chat ${chatId})`,
    feedbackForwardFooter: "To reply, just reply to this message.",
    feedbackReplyRelayed: "Your reply was sent to the user ✅ (this thread was cleared from your chat)",
    feedbackReplyFromAdmin: "📬 Admin reply:",
    unknownInput: "I didn't catch that 🤔 Please pick an option from the menu.",
    langChanged: "Language switched to English 🇬🇧",
    askImportLink: "Send the share link a friend sent you:",
    importInvalidLink: "That wasn't a valid share link from the site. Try again or cancel.",
    importNotFound: "That link isn't valid anymore, or wasn't found.",
    importEmpty: "That bundle was empty — nothing to add.",
    importSuccess: (count: number, from?: string | null) =>
      `${count} task(s)${from ? ` from ${from}` : ""} added to your Cabinet 📥\n\nHead to the site's Cabinet page whenever you like to move them into your own list.`,
    // ── admin-only ──
    notAdmin: "This command is for admins only.",
    askBroadcast: "Write the message to send to every linked user:",
    broadcastPreview: (text: string, count: number) => `Send this to ${count} people?\n\n—\n${text}\n—`,
    btnBroadcastConfirm: "📢 Yes, send to everyone",
    broadcastSent: (count: number) => `Sent ✅ (to ${count} people)`,
    resetMeDone: "The bot was reset for you — open the main menu again.",
    askResetUsername: "Send the Telegram username of the user (without @):",
    resetUserNotFound: "No user found with that username, or they haven't linked Telegram yet.",
    resetUserDone: (name: string) => `Bot reset for @${name} ✅`,
    resetAllConfirmAsk: "⚠️ Are you sure you want to reset the bot for every user?",
    btnResetAllConfirm: "⚠️ Yes, reset for everyone",
    resetAllDone: (count: number) => `Bot reset for ${count} users ✅`,
    askEditIntro: "Send the new main-menu text (English). Use {name} where the user's name should go.",
    editIntroSaved: "Menu text updated ✅",
    editIntroReset: "Menu text reset to the default.",
    btnResetIntro: "↩️ Reset to default",
  },
} as const;

export function t(lang: BotLang) {
  return T[lang];
}

export function defaultIntro(lang: BotLang, name: string) {
  return t(lang).introTemplate(name);
}

export function mainMenuKeyboard(lang: BotLang, isAdmin: boolean): InlineKeyboard {
  const s = t(lang);
  const rows: InlineKeyboard = [
    [{ text: s.btnProjects, callback_data: "menu:projects" }],
    [{ text: s.btnImportLink, callback_data: "import:new" }],
    [{ text: s.btnFeedback, callback_data: "fb:new" }],
    [{ text: lang === "fa" ? s.btnLangToEn : s.btnLangToFa, callback_data: lang === "fa" ? "lang:en" : "lang:fa" }],
  ];
  if (isAdmin) {
    rows.push([{ text: s.btnBroadcast, callback_data: "admin:broadcast" }]);
    rows.push([{ text: s.btnEditIntro, callback_data: "admin:edit_intro" }]);
  }
  return rows;
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

export function cancelOnlyKeyboard(lang: BotLang, cancelData = "menu:main"): InlineKeyboard {
  return [[{ text: t(lang).btnCancel, callback_data: cancelData }]];
}

export function backToMainKeyboard(lang: BotLang): InlineKeyboard {
  const s = t(lang);
  return [[{ text: s.btnBack, callback_data: "menu:main" }]];
}

export function broadcastConfirmKeyboard(lang: BotLang): InlineKeyboard {
  const s = t(lang);
  return [
    [{ text: s.btnBroadcastConfirm, callback_data: "admin:broadcast:confirm" }],
    [{ text: s.btnCancel, callback_data: "menu:main" }],
  ];
}

export function resetAllConfirmKeyboard(lang: BotLang): InlineKeyboard {
  const s = t(lang);
  return [
    [{ text: s.btnResetAllConfirm, callback_data: "admin:reset_all:confirm" }],
    [{ text: s.btnCancel, callback_data: "menu:main" }],
  ];
}

export function editIntroKeyboard(lang: BotLang): InlineKeyboard {
  const s = t(lang);
  return [
    [{ text: s.btnResetIntro, callback_data: "admin:edit_intro:reset" }],
    [{ text: s.btnCancel, callback_data: "menu:main" }],
  ];
}

export const USER_COMMANDS: Record<BotLang, BotCommand[]> = {
  fa: [
    { command: "start", description: "شروع / اتصال حساب" },
    { command: "menu", description: "نمایش منوی اصلی" },
    { command: "feedback", description: "ارسال انتقاد یا پیشنهاد" },
    { command: "cancel", description: "لغو مرحله‌ی فعلی" },
    { command: "stop", description: "قطع اتصال حساب" },
  ],
  en: [
    { command: "start", description: "Start / link your account" },
    { command: "menu", description: "Show the main menu" },
    { command: "feedback", description: "Send feedback or a suggestion" },
    { command: "cancel", description: "Cancel the current step" },
    { command: "stop", description: "Disconnect your account" },
  ],
};

export const ADMIN_EXTRA_COMMANDS: Record<BotLang, BotCommand[]> = {
  fa: [
    { command: "broadcast", description: "ارسال پیام به همه‌ی کاربرها" },
    { command: "reset_me", description: "ریست بات برای خودم" },
    { command: "reset_user", description: "ریست بات برای یک کاربر خاص" },
    { command: "reset_all", description: "ریست بات برای همه‌ی کاربرها" },
  ],
  en: [
    { command: "broadcast", description: "Message every user" },
    { command: "reset_me", description: "Reset the bot for myself" },
    { command: "reset_user", description: "Reset the bot for one user" },
    { command: "reset_all", description: "Reset the bot for everyone" },
  ],
};
