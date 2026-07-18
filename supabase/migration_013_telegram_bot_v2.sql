-- Run this once in Supabase → SQL Editor. Safe to re-run.
--
-- A tiny singleton settings table for the Telegram bot — right now it just
-- holds the admin-editable "what is this bot for" blurb shown in the main
-- menu (fa + en), so an admin can tweak the wording from inside Telegram
-- without a redeploy. More bot-wide settings can be added as columns later.

create table if not exists public.telegram_bot_settings (
  id text primary key default 'main' check (id = 'main'),
  intro_text_fa text,
  intro_text_en text,
  updated_at timestamptz not null default now()
);

insert into public.telegram_bot_settings (id) values ('main')
  on conflict (id) do nothing;

alter table public.telegram_bot_settings enable row level security;

notify pgrst, 'reload schema';
