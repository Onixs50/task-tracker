-- Run this once in Supabase → SQL Editor. Safe to re-run.
--
-- Adds:
--   1) more display control over announcements (how many times shown,
--      accent color, whether the mascot is shown)
--   2) Telegram linking + reminder preference per user
--   3) a small log of admin broadcast messages sent via the bot

-- ── announcements: extra display settings ──
alter table public.announcements
  add column if not exists max_views int not null default 2,
  add column if not exists accent text not null default 'gold',
  add column if not exists show_mascot boolean not null default true;

alter table public.announcements
  drop constraint if exists announcements_accent_check;
alter table public.announcements
  add constraint announcements_accent_check check (accent in ('gold', 'teal', 'danger'));

-- ── profiles: Telegram linking ──
alter table public.profiles
  add column if not exists telegram_chat_id text,
  add column if not exists telegram_username text,
  add column if not exists telegram_link_code text,
  add column if not exists telegram_reminders_enabled boolean not null default true;

create unique index if not exists profiles_telegram_chat_id_idx
  on public.profiles (telegram_chat_id)
  where telegram_chat_id is not null;

create unique index if not exists profiles_telegram_link_code_idx
  on public.profiles (telegram_link_code)
  where telegram_link_code is not null;

-- ── telegram_broadcasts: history of admin messages sent to all linked users ──
create table if not exists public.telegram_broadcasts (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  sent_by uuid references auth.users (id) on delete set null,
  recipient_count int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.telegram_broadcasts enable row level security;

drop policy if exists "telegram_broadcasts: admin only" on public.telegram_broadcasts;
create policy "telegram_broadcasts: admin only" on public.telegram_broadcasts
  for all
  using ((auth.jwt() ->> 'email') = 'sadeghss500@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'sadeghss500@gmail.com');

notify pgrst, 'reload schema';
