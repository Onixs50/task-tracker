# راه‌اندازی بات تلگرام

این یه راهنمای فنیه، جدا از README (که فقط معرفی سایته). فقط یه‌بار لازمه انجامش بدی.

## مرحله ۱ — اجرای migration دیتابیس

توی Supabase → SQL Editor، محتوای `supabase/migration_008_telegram_announcement_settings.sql` رو اجرا کن.

## مرحله ۲ — ساخت بات تو تلگرام

1. تو تلگرام برو سراغ [@BotFather](https://t.me/BotFather).
2. بفرست: `/newbot`
3. یه اسم و یه یوزرنیم (باید به `bot` ختم بشه، مثلاً `daily_ledger_bot`) بهش بده.
4. یه **توکن** بهت می‌ده، یه چیزی شبیه `123456789:AAExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` — اینو نگه دار.

## مرحله ۳ — گرفتن Service Role Key از Supabase

توی Supabase برو **Project Settings → API** و مقدار **service_role** رو بردار (نه anon key — این یکی خیلی حساسه، هیچ‌جا جز Environment Variables سرور نذارش).

## مرحله ۴ — متغیرهای محیطی روی Vercel

توی **Vercel → Project Settings → Environment Variables** این‌ها رو اضافه کن:

| متغیر | مقدار |
|---|---|
| `TELEGRAM_BOT_TOKEN` | همون توکنی که از BotFather گرفتی |
| `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` | یوزرنیم بات بدون `@` (مثلاً `daily_ledger_bot`) |
| `TELEGRAM_WEBHOOK_SECRET` | یه رشته‌ی تصادفی دلخواه بساز (مثلاً با `openssl rand -hex 20`) |
| `CRON_SECRET` | یه رشته‌ی تصادفی دیگه بساز |
| `SUPABASE_SERVICE_ROLE_KEY` | همون service_role که از Supabase برداشتی |

بعد از اضافه کردن، یه بار **Redeploy** بزن.

## مرحله ۵ — وصل کردن وبهوک بات به سایت

بعد از دیپلوی، این آدرس رو (با مقادیر خودت جایگزین‌شده) توی مرورگر باز کن یا با curl بزن:

```
https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=https://<YOUR_DOMAIN>/api/telegram/webhook&secret_token=<TELEGRAM_WEBHOOK_SECRET>
```

اگه جواب `{"ok":true,"result":true,...}` گرفتی یعنی وصل شد.

## همین! چطور کار می‌کنه

- هر کاربر از تنظیمات سایت یه دکمه‌ی «اتصال به تلگرام» می‌زنه، یه کد می‌گیره، وارد بات می‌شه و کدش رو می‌فرسته (یا مستقیم روی دکمه‌ی لینک کلیک می‌کنه) — همون لحظه حسابش وصل می‌شه.
- یه Cron Job (توی `vercel.json` تعریف شده، هر ساعت اجرا می‌شه) هر روز حوالی ساعت ۸ شب به وقت خود کاربر، اگه کاری براش مونده باشه، یه پیام یادآوری براش می‌فرسته.
- تو به‌عنوان مدیر کل سایت، از صفحه‌ی «مدیریت سایت» می‌تونی یه پیام بنویسی و به همه‌ی کسایی که تلگرامشون رو وصل کردن یهو بفرستی.

## تست کردن

بدون این تنظیمات هم کل بقیه‌ی سایت عادی کار می‌کنه — این بخش کاملاً اختیاریه و فقط وقتی متغیرهای بالا ست بشن فعال می‌شه.
