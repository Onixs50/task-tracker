-- Run this once in Supabase → SQL Editor. Safe to re-run.
--
-- Three additions:
--   1. site_admins   — lets the owner (sadeghss500@gmail.com) grant extra
--                       people access to the /site-admin panel.
--   2. page_views     — lightweight visit log used by the new Stats tab
--                       (which page, when, by which user if signed in).
--   3. task_templates.extra_links — tasks can now carry more than one link.
--
-- Both new tables are only ever touched by the server (service-role key),
-- never directly by the browser — so RLS is enabled with no policies,
-- which blocks every request except the service role.

-- ── site_admins ──────────────────────────────────────────
create table if not exists public.site_admins (
  email text primary key,
  added_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.site_admins enable row level security;

-- ── page_views ───────────────────────────────────────────
create table if not exists public.page_views (
  id bigserial primary key,
  path text not null,
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists page_views_created_idx on public.page_views (created_at desc);
create index if not exists page_views_path_idx on public.page_views (path);

alter table public.page_views enable row level security;

-- ── task_templates: multiple links ──────────────────────
alter table public.task_templates
  add column if not exists extra_links text[] not null default '{}';

notify pgrst, 'reload schema';
