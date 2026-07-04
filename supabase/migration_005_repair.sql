-- Run this once. Safe to re-run. Fixes the missing theme/timezone columns
-- (root cause of "settings won't save") and re-asserts every RLS policy.

alter table public.profiles add column if not exists theme text not null default 'dark';
alter table public.profiles add column if not exists timezone text not null default 'Asia/Tehran';
alter table public.profiles add column if not exists display_name text;

alter table public.profiles enable row level security;
drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own" on public.profiles for select using (auth.uid() = id);
drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own" on public.profiles for update using (auth.uid() = id);
drop policy if exists "profiles: insert own" on public.profiles;
create policy "profiles: insert own" on public.profiles for insert with check (auth.uid() = id);

alter table public.projects enable row level security;
drop policy if exists "projects: crud own" on public.projects;
create policy "projects: crud own" on public.projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.task_templates enable row level security;
drop policy if exists "task_templates: crud own" on public.task_templates;
create policy "task_templates: crud own" on public.task_templates
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.task_logs enable row level security;
drop policy if exists "task_logs: crud own" on public.task_logs;
create policy "task_logs: crud own" on public.task_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.airdrops enable row level security;
drop policy if exists "airdrops: crud own" on public.airdrops;
create policy "airdrops: crud own" on public.airdrops
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.quotes enable row level security;
drop policy if exists "quotes: crud own" on public.quotes;
create policy "quotes: crud own" on public.quotes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- make sure the signup trigger is intact
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

notify pgrst, 'reload schema';
