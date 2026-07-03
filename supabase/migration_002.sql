-- Run this in Supabase → SQL Editor AFTER the original schema.sql.
-- Every statement is safe to re-run (IF NOT EXISTS / IF EXISTS guards).

-- ── profiles: username + preferences ────────────────────
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists week_start int not null default 6; -- 0=Sun .. 6=Sat
alter table public.profiles add column if not exists show_quotes boolean not null default true;
alter table public.profiles add column if not exists clock_size text not null default 'md';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_username_key'
  ) then
    alter table public.profiles add constraint profiles_username_key unique (username);
  end if;
end $$;

-- keep the auto-profile trigger in sync with username coming from signup metadata
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

-- ── task_templates: category + emoji + archive ──────────
alter table public.task_templates add column if not exists category text not null default 'custom';
alter table public.task_templates add column if not exists emoji text not null default '✅';
alter table public.task_templates add column if not exists archived boolean not null default false;

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

drop policy if exists "airdrops: crud own" on public.airdrops;
create policy "airdrops: crud own" on public.airdrops
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists airdrops_user_idx on public.airdrops (user_id);

-- force PostgREST to pick up the new columns/tables immediately
notify pgrst, 'reload schema';
