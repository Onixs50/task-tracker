-- Run after migration_003_repair.sql. Safe to re-run.

-- ── profiles: banner speed + re-assert RLS ──────────────
alter table public.profiles add column if not exists banner_speed int not null default 3;

alter table public.profiles enable row level security;
drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own" on public.profiles for select using (auth.uid() = id);
drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own" on public.profiles for update using (auth.uid() = id);
drop policy if exists "profiles: insert own" on public.profiles;
create policy "profiles: insert own" on public.profiles for insert with check (auth.uid() = id);

-- ── user-managed motivational quotes (no more hardcoded defaults) ──
create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

alter table public.quotes enable row level security;
drop policy if exists "quotes: crud own" on public.quotes;
create policy "quotes: crud own" on public.quotes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists quotes_user_idx on public.quotes (user_id);

-- ── airdrops: numeric value so amounts can be summed/animated ──
alter table public.airdrops add column if not exists value_usd numeric;

notify pgrst, 'reload schema';
