-- Run this once in Supabase → SQL Editor.
-- Enables Row Level Security so every user only ever sees their own data.

create extension if not exists "pgcrypto";

-- ── profiles ─────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  username text unique,
  locale text not null default 'fa',
  theme text not null default 'dark',
  timezone text not null default 'Asia/Tehran',
  week_start int not null default 6,
  show_quotes boolean not null default true,
  clock_size text not null default 'md',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: read own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles: update own" on public.profiles
  for update using (auth.uid() = id);
create policy "profiles: insert own" on public.profiles
  for insert with check (auth.uid() = id);

-- auto-create a profile row the first time someone signs in
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'username'),
    new.raw_user_meta_data ->> 'username'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── projects ─────────────────────────────────────────────
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  color text not null default '#E8A33D',
  icon text,
  created_at timestamptz not null default now()
);

alter table public.projects enable row level security;

create policy "projects: crud own" on public.projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── task_templates ───────────────────────────────────────
create table if not exists public.task_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null,
  description text,
  recurrence_type text not null check (recurrence_type in ('daily','weekly','custom_dates','once')),
  recurrence_days int[],           -- 0=Sun..6=Sat, used when recurrence_type = 'weekly'
  custom_dates date[],             -- used when recurrence_type = 'custom_dates'
  start_date date not null default current_date,
  end_date date,
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  category text not null default 'custom',
  emoji text not null default '✅',
  active boolean not null default true,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.task_templates enable row level security;

create policy "task_templates: crud own" on public.task_templates
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists task_templates_user_idx on public.task_templates (user_id);
create index if not exists task_templates_project_idx on public.task_templates (project_id);

-- ── task_logs ────────────────────────────────────────────
create table if not exists public.task_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  task_template_id uuid not null references public.task_templates (id) on delete cascade,
  log_date date not null,
  status text not null default 'pending' check (status in ('done','missed','pending')),
  completed_at timestamptz,
  unique (task_template_id, log_date)
);

alter table public.task_logs enable row level security;

create policy "task_logs: crud own" on public.task_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists task_logs_user_date_idx on public.task_logs (user_id, log_date);

-- ── airdrops ─────────────────────────────────────────────
create table if not exists public.airdrops (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  project_name text not null,
  claim_date date not null default current_date,
  value_text text,
  status text not null default 'claimed' check (status in ('claimed', 'pending', 'missed')),
  notes text,
  created_at timestamptz not null default now()
);

alter table public.airdrops enable row level security;

create policy "airdrops: crud own" on public.airdrops
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists airdrops_user_idx on public.airdrops (user_id);

notify pgrst, 'reload schema';
