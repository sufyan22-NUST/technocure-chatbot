-- supabase/schema.sql
-- Full database schema for the Technocure chatbot.
-- Run this once against your Supabase project (SQL Editor → New query → Run).
-- Safe to re-run: all statements use IF NOT EXISTS / OR REPLACE guards.

-- ── Extensions ────────────────────────────────────────────────────────────────

create extension if not exists "pgcrypto";  -- gen_random_uuid()
create extension if not exists "vector";    -- pgvector (enable in Supabase dashboard first)

-- ── Leads table ───────────────────────────────────────────────────────────────

create table if not exists leads (
  id           uuid        primary key default gen_random_uuid(),
  name         text        not null,
  email        text        not null,
  company      text,
  message      text        not null,
  session_id   text,
  created_at   timestamptz not null default now()
);

create index if not exists leads_created_at_idx on leads (created_at desc);

-- ── Knowledge chunks table (RAG vector store) ─────────────────────────────────

-- Each row holds one chunk of Technocure content and its embedding vector.
-- Embedding model: text-embedding-3-small (1536 dimensions).
create table if not exists knowledge_chunks (
  id          uuid        primary key default gen_random_uuid(),
  content     text        not null,           -- raw text chunk
  embedding   vector(1536),                   -- OpenAI text-embedding-3-small
  metadata    jsonb,                          -- e.g. { "section": "services" }
  created_at  timestamptz not null default now()
);

-- HNSW index for fast approximate nearest-neighbour search (cosine distance).
-- Build this AFTER seeding the table (CREATE INDEX is faster on populated data).
create index if not exists knowledge_chunks_embedding_idx
  on knowledge_chunks
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- ── Similarity search RPC ─────────────────────────────────────────────────────

-- Called from lib/utils/vectorSearch.ts via supabase.rpc("match_knowledge_chunks").
create or replace function match_knowledge_chunks(
  query_embedding vector(1536),
  match_threshold float,
  match_count     int
)
returns table (
  id         uuid,
  content    text,
  metadata   jsonb,
  similarity float
)
language sql stable
as $$
  select
    id,
    content,
    metadata,
    1 - (embedding <=> query_embedding) as similarity
  from knowledge_chunks
  where 1 - (embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
$$;

-- ── Visitor emails table ──────────────────────────────────────────────────────

-- Stores email addresses captured by the pre-chat form.
create table if not exists visitor_emails (
  id           uuid        primary key default gen_random_uuid(),
  email        text        not null,
  session_id   text,
  chat_snippet text,
  created_at   timestamptz not null default now()
);

create index if not exists visitor_emails_created_at_idx on visitor_emails (created_at desc);

-- ── Admin table ───────────────────────────────────────────────────────────────

create table if not exists admin (
  id            uuid primary key default gen_random_uuid(),
  email         text unique not null,
  password_hash text        not null,   -- hash externally before inserting
  created_at    timestamptz not null default now()
);

-- ── Row Level Security (all public access blocked — service role only) ─────────

alter table leads            enable row level security;
alter table knowledge_chunks enable row level security;
alter table admin            enable row level security;
alter table visitor_emails   enable row level security;

-- Drop and re-create policies so this script is idempotent
do $$
begin
  -- leads
  if not exists (
    select 1 from pg_policies where tablename = 'leads' and policyname = 'No public access to leads'
  ) then
    create policy "No public access to leads"
      on leads for all using (false);
  end if;

  -- knowledge_chunks
  if not exists (
    select 1 from pg_policies where tablename = 'knowledge_chunks' and policyname = 'No public access to knowledge_chunks'
  ) then
    create policy "No public access to knowledge_chunks"
      on knowledge_chunks for all using (false);
  end if;

  -- admin
  if not exists (
    select 1 from pg_policies where tablename = 'admin' and policyname = 'No public access to admin'
  ) then
    create policy "No public access to admin"
      on admin for all using (false);
  end if;

  -- visitor_emails
  if not exists (
    select 1 from pg_policies where tablename = 'visitor_emails' and policyname = 'No public access to visitor_emails'
  ) then
    create policy "No public access to visitor_emails"
      on visitor_emails for all using (false);
  end if;
end $$;
