# Technocure AI Chatbot

AI-powered website chatbot for [Technocure.co.za](https://technocure.co.za) — built with Next.js 14, OpenAI, Supabase (pgvector RAG), and deployed on Netlify.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| LLM | OpenAI `gpt-4o-mini` |
| Embeddings | OpenAI `text-embedding-3-small` |
| Database + Vector store | Supabase (PostgreSQL + pgvector) |
| Deployment | Netlify + `@netlify/plugin-nextjs` |

---

## Project Structure

```
app/
  api/chat/route.ts        ← RAG + OpenAI endpoint
  dashboard/page.tsx       ← Admin leads table
  page.tsx                 ← Homepage
components/
  chat/                    ← ChatWidget, ChatBubble, ChatInput, LeadCaptureForm
  ui/                      ← Spinner, ErrorBanner
lib/
  openaiClient.ts          ← Singleton OpenAI client
  supabaseClient.ts        ← Browser + server-role Supabase clients
  types.ts                 ← Shared TypeScript interfaces
  utils/
    promptBuilder.ts       ← RAG context + system-prompt assembly
    validation.ts          ← Input sanitisation
    vectorSearch.ts        ← Supabase pgvector similarity search
scripts/
  seed-knowledge.ts        ← One-time knowledge-base seeder
supabase/
  schema.sql               ← Full DB schema (run once)
```

---

## Local Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd technocure-chat
npm install
```

### 2. Environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same page |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page (keep secret — server only) |
| `OPENAI_API_KEY` | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| `ADMIN_SECRET` | Any long random string |

### 3. Prepare Supabase

1. Enable the **pgvector** extension in your Supabase project:
   - Dashboard → Database → Extensions → search "vector" → Enable
2. Run the schema in the SQL Editor:
   ```sql
   -- paste the full contents of supabase/schema.sql
   ```

### 4. Seed the knowledge base

This embeds the Technocure knowledge chunks and stores them in the vector table:

```bash
npm run seed
```

Run this once. Re-run only if you update the knowledge base content in `scripts/seed-knowledge.ts`.

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The chat bubble appears bottom-right.

---

## Admin Dashboard

Access the leads dashboard at `/dashboard` by passing the `x-admin-secret` header:

```bash
curl http://localhost:3000/dashboard \
  -H "x-admin-secret: your-admin-secret"
```

> **Note:** Replace the header-based guard with Supabase Auth or NextAuth before going to production.

---

## Deployment (Netlify)

1. Push the repo to GitHub.
2. Connect the repo in [app.netlify.com](https://app.netlify.com).
3. Install the Netlify plugin:
   ```bash
   npm install -D @netlify/plugin-nextjs
   ```
4. Set all environment variables in **Site settings → Environment variables**.
5. Deploy — Netlify reads `netlify.toml` and handles SSR + API routes automatically.

---

## How RAG Works

1. Visitor message arrives at `POST /api/chat`.
2. An embedding is generated (`text-embedding-3-small`).
3. Supabase `match_knowledge_chunks` RPC returns the top-4 most similar chunks (cosine similarity > 0.5).
4. Chunks are injected into the OpenAI system prompt as grounded context.
5. `gpt-4o-mini` replies, constrained to that context only.
6. If contact/pricing intent is detected, `shouldCaptureLead: true` is returned and the widget shows the lead form.

---

## Lead Capture Flow

| Step | What happens |
|---|---|
| Visitor asks about pricing / contact | API returns `shouldCaptureLead: true` |
| Widget shows inline lead form | Name, email, company fields |
| Visitor submits form | Re-posts to `/api/chat` with `lead` payload |
| API persists lead to Supabase | Returns `savedLead: true` |
| Dashboard shows new row | Visible at `/dashboard` |
