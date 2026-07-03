export const QUOTES: Record<"en" | "fa", string[]> = {
  en: [
    "Small steps, done daily, beat big plans done never.",
    "Discipline is choosing what you want most over what you want now.",
    "Consistency compounds — in markets and in habits.",
    "Every checked box today is capital for tomorrow.",
    "You don't rise to your goals, you fall to your systems.",
    "The chain doesn't care how you feel today — show up anyway.",
    "Missed a day? Don't miss two.",
    "Progress you can't see is still progress.",
    "Do the boring reps. That's the whole edge.",
    "Future you is built by today's checklist.",
  ],
  fa: [
    "قدم‌های کوچیک ولی روزانه، از برنامه‌های بزرگی که هیچ‌وقت اجرا نمی‌شن بهترن.",
    "نظم یعنی چیزی که واقعاً می‌خوای رو به چیزی که الان دلت می‌خواد ترجیح بدی.",
    "تداوم مثل سود مرکب می‌مونه — هم توی بازار، هم توی عادت‌ها.",
    "هر تیکی که امروز می‌زنی، سرمایه فرداته.",
    "به اهدافت نمی‌رسی، به سیستمی که ساختی سقوط می‌کنی — پس سیستمتو قوی بساز.",
    "زنجیره کارها اهمیتی نمی‌ده امروز حالت چطوره — بازم انجامش بده.",
    "یه روز رو از دست دادی؟ حواست باشه دو روزه نشه.",
    "پیشرفتی که نمی‌بینیش هم بازم پیشرفته.",
    "کارهای تکراری و به‌ظاهر کسل‌کننده رو انجام بده؛ کل مزیتت همینه.",
    "خود آینده‌ت رو با چک‌لیست امروز می‌سازی.",
  ],
};

export function randomQuote(locale: "en" | "fa"): string {
  const list = QUOTES[locale];
  return list[Math.floor(Math.random() * list.length)];
}
