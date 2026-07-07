-- Run this once in Supabase → SQL Editor. Safe to re-run.
--
-- Adds:
--   1) site-wide announcements, manageable only by the super-admin
--      account (sadeghss500@gmail.com), shown to every user until
--      they've seen/dismissed each one a couple of times.
--   2) shareable task bundles, so a user can send one or more of
--      their own tasks to someone else via a link (Gmail/Telegram/
--      Twitter/etc.), which the recipient can add to their own list.

-- ── profiles: per-user "how many times have I seen this announcement" ──
alter table public.profiles
  add column if not exists announcement_views jsonb not null default '{}'::jsonb;

-- ── announcements ────────────────────────────────────────
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text,
  message text not null,
  active boolean not null default true,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.announcements enable row level security;

-- everyone signed in can read announcements (needed to show the banner)
drop policy if exists "announcements: read all" on public.announcements;
create policy "announcements: read all" on public.announcements
  for select using (true);

-- only the fixed super-admin email can create/edit/delete announcements
drop policy if exists "announcements: admin write" on public.announcements;
create policy "announcements: admin write" on public.announcements
  for all
  using ((auth.jwt() ->> 'email') = 'sadeghss500@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'sadeghss500@gmail.com');

create index if not exists announcements_active_idx on public.announcements (active, created_at desc);

-- ── shared_bundles: link-based task sharing between users ──
create table if not exists public.shared_bundles (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users (id) on delete cascade,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.shared_bundles enable row level security;

-- anyone (including a not-yet-signed-in recipient) can open a share link and preview it
drop policy if exists "shared_bundles: read all" on public.shared_bundles;
create policy "shared_bundles: read all" on public.shared_bundles
  for select using (true);

-- only the owner can create/delete their own share links
drop policy if exists "shared_bundles: insert own" on public.shared_bundles;
create policy "shared_bundles: insert own" on public.shared_bundles
  for insert with check (auth.uid() = created_by);

drop policy if exists "shared_bundles: delete own" on public.shared_bundles;
create policy "shared_bundles: delete own" on public.shared_bundles
  for delete using (auth.uid() = created_by);

create index if not exists shared_bundles_created_by_idx on public.shared_bundles (created_by);

notify pgrst, 'reload schema';
