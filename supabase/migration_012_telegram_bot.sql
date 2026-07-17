-- Run this once in Supabase → SQL Editor. Safe to re-run.
--
-- Adds everything the Telegram bot's menu system needs:
--   1) telegram_sessions: remembers where each chat is in a multi-step
--      flow (e.g. "typing a task description") and its chosen bot language.
--   2) feedback_messages: a simple two-way inbox for "Feedback & Suggestions" —
--      a user's message is forwarded to whichever admins have linked their
--      Telegram, and an admin's reply (sent as a Telegram reply) is relayed
--      straight back to that user.
--
-- Both tables are only ever touched by the webhook route using the
-- service-role key, so RLS is enabled with no public policies (default deny).

create table if not exists public.telegram_sessions (
  chat_id text primary key,
  user_id uuid references auth.users (id) on delete cascade,
  lang text not null default 'fa',
  state text not null default 'idle',
  draft jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.telegram_sessions enable row level security;

create table if not exists public.feedback_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  chat_id text not null,
  username text,
  message text not null,
  admin_message_ids jsonb not null default '{}'::jsonb, -- { "<admin chat id>": <forwarded message_id> }
  admin_reply text,
  status text not null default 'open' check (status in ('open', 'answered')),
  created_at timestamptz not null default now(),
  replied_at timestamptz
);

alter table public.feedback_messages enable row level security;

create index if not exists feedback_messages_status_idx on public.feedback_messages (status, created_at desc);

notify pgrst, 'reload schema';
