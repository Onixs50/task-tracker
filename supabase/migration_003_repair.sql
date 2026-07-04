-- Repairs a partial install where the original schema.sql rolled back
-- part-way through. Safe to run even if some of these already exist.

create extension if not exists "pgcrypto";

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

drop policy if exists "projects: crud own" on public.projects;
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
  recurrence_days int[],
  custom_dates date[],
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

drop policy if exists "task_templates: crud own" on public.task_templates;
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

drop policy if exists "task_logs: crud own" on public.task_logs;
create policy "task_logs: crud own" on public.task_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists task_logs_user_date_idx on public.task_logs (user_id, log_date);

-- ── make sure the signup trigger actually exists ────────
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

notify pgrst, 'reload schema';
