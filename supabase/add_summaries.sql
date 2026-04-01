-- supabase/add_summaries.sql
-- Run in Supabase SQL Editor to add the chat_summaries table.
-- Safe to re-run: uses IF NOT EXISTS guard.

create table if not exists chat_summaries (
  id         uuid        primary key default gen_random_uuid(),
  email      text,
  summary    text        not null,
  created_at timestamptz not null default now()
);

create index if not exists chat_summaries_created_at_idx
  on chat_summaries (created_at desc);

-- Block all direct client access; only service-role key can write/read
alter table chat_summaries enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'chat_summaries'
      and policyname = 'No public access to chat_summaries'
  ) then
    create policy "No public access to chat_summaries"
      on chat_summaries for all using (false);
  end if;
end $$;
