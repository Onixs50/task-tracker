-- Run this once in Supabase → SQL Editor. Safe to re-run.
--
-- Adds per-task, opt-in Telegram reminders that the user schedules
-- themselves (in N hours / daily at a time / every N hours). Nothing is
-- ever sent unless the user explicitly set it up on that specific task.

create table if not exists public.task_reminders (
  id uuid primary key default gen_random_uuid(),
  task_template_id uuid not null references public.task_templates (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  reminder_type text not null check (reminder_type in ('once', 'daily_at', 'interval')),
  time_of_day text,        -- 'HH:MM', used by 'daily_at'
  interval_hours int,      -- used by 'interval'
  next_send_at timestamptz not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- one reminder configuration per task — saving a new one replaces the old
create unique index if not exists task_reminders_one_per_task
  on public.task_reminders (task_template_id);

create index if not exists task_reminders_due_idx
  on public.task_reminders (next_send_at)
  where active;

alter table public.task_reminders enable row level security;

drop policy if exists "task_reminders: select own" on public.task_reminders;
create policy "task_reminders: select own" on public.task_reminders
  for select using (auth.uid() = user_id);

drop policy if exists "task_reminders: insert own" on public.task_reminders;
create policy "task_reminders: insert own" on public.task_reminders
  for insert with check (auth.uid() = user_id);

drop policy if exists "task_reminders: update own" on public.task_reminders;
create policy "task_reminders: update own" on public.task_reminders
  for update using (auth.uid() = user_id);

drop policy if exists "task_reminders: delete own" on public.task_reminders;
create policy "task_reminders: delete own" on public.task_reminders
  for delete using (auth.uid() = user_id);

notify pgrst, 'reload schema';
