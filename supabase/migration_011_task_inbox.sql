-- Run this once in Supabase → SQL Editor. Safe to re-run.
--
-- Adds:
--   1) a sender display name on shared_bundles, so a recipient can see
--      who sent them a bundle of tasks (e.g. "sara sent you 4 tasks").
--   2) received_tasks: a per-user "inbox" of tasks someone else sent
--      that haven't been accepted into the recipient's own list yet.
--      The recipient can accept them one at a time or all at once,
--      or discard them, from a dedicated page.

-- ── shared_bundles: remember who sent it ──
alter table public.shared_bundles
  add column if not exists from_username text;

-- ── received_tasks: parked tasks waiting for the recipient to decide ──
create table if not exists public.received_tasks (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references auth.users (id) on delete cascade,
  from_username text,
  bundle_id uuid references public.shared_bundles (id) on delete set null,
  title text not null,
  description text,
  link_url text,
  extra_links text[] not null default '{}',
  category text not null default 'custom',
  emoji text not null default '✅',
  recurrence_type text not null default 'daily',
  recurrence_days int[],
  custom_dates text[],
  priority text not null default 'medium',
  created_at timestamptz not null default now()
);

alter table public.received_tasks enable row level security;

drop policy if exists "received_tasks: select own" on public.received_tasks;
create policy "received_tasks: select own" on public.received_tasks
  for select using (auth.uid() = recipient_id);

drop policy if exists "received_tasks: insert own" on public.received_tasks;
create policy "received_tasks: insert own" on public.received_tasks
  for insert with check (auth.uid() = recipient_id);

drop policy if exists "received_tasks: delete own" on public.received_tasks;
create policy "received_tasks: delete own" on public.received_tasks
  for delete using (auth.uid() = recipient_id);

create index if not exists received_tasks_recipient_idx on public.received_tasks (recipient_id, created_at desc);

notify pgrst, 'reload schema';
