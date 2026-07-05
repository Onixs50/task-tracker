-- Adds an optional URL/link field to tasks.
-- Run this once in Supabase → SQL Editor.

alter table public.task_templates
  add column if not exists link_url text;

notify pgrst, 'reload schema';
