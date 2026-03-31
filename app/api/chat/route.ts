/**
 * app/api/chat/route.ts
 * POST /api/chat — core RAG + LLM endpoint.
 *
 * Pipeline:
 *  1. Parse + validate the request body.
 *  2. Search the Supabase vector store for relevant knowledge chunks.
 *  3. Build a RAG-enriched system prompt.
 *  4. Call Claude (Anthropic) for a chat completion.
 *  5. Detect lead-capture intent in the visitor's message.
 *  6. If a lead payload is present, persist it to Supabase.
 *  7. Return { reply, savedLead, shouldCaptureLead }.
 */

import { NextRequest, NextResponse } from "next/server";
import anthropic from "@/lib/anthropicClient";
import { supabaseServer } from "@/lib/supabaseClient";
import type { ChatRequest, ChatResponse, ApiError, Lead } from "@/lib/types";
import { validateChatRequest, validateLeadPayload, sanitizeMessage } from "@/lib/utils/validation";
import { searchKnowledgeChunks } from "@/lib/utils/vectorSearch";
import { buildSystemPrompt, detectLeadIntent } from "@/lib/utils/promptBuilder";

const CHAT_MODEL = "claude-haiku-4-5-20251001";

/** Branding metadata included in every API response. */
const BRANDING = {
  theme_color: "#4dfe03",
  logo_url: "https://drive.google.com/file/d/14q9TxCTWJO_qjKbihc2U5N_MdBwg0xFw/view?usp=drive_link",
  avatar_url: "https://drive.google.com/file/d/1lYkAA_z51dsKBchBR31rLo90QB87ZDZR/view?usp=drive_link",
  font_family: "Inter",
};

// ── Modular helpers ────────────────────────────────────────────────────────────

/**
 * Calls Claude with a RAG-enriched system prompt.
 * Throws on API error — the route handler catches and converts to 500.
 */
async function getAIReply(
  userMessage: string,
  systemPrompt: string
): Promise<string> {
  const message = await anthropic.messages.create({
    model: CHAT_MODEL,
    max_tokens: 512,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const block = message.content[0];
  if (!block || block.type !== "text") {
    throw new Error("Claude returned an empty response.");
  }
  return block.text.trim();
}

/**
 * Inserts a lead record into the Supabase `leads` table using the
 * service-role client (bypasses RLS). Returns true on success.
 */
async function persistLead(
  lead: Omit<Lead, "id" | "created_at">
): Promise<boolean> {
  const { error } = await supabaseServer.from("leads").insert(lead);
  if (error) {
    console.error("[persistLead] Supabase error:", error.message);
    return false;
  }
  return true;
}

// ── Route handlers ─────────────────────────────────────────────────────────────

/** POST /api/chat */
export async function POST(
  req: NextRequest
): Promise<NextResponse<ChatResponse | ApiError>> {
  // 1. Parse body
  let body: ChatRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON.", status: 400 },
      { status: 400 }
    );
  }

  // 2. Validate chat fields
  const chatError = validateChatRequest(body);
  if (chatError) {
    return NextResponse.json({ error: chatError, status: 400 }, { status: 400 });
  }

  // 3. Validate optional lead payload
  const leadError = validateLeadPayload(body.lead);
  if (leadError) {
    return NextResponse.json({ error: leadError, status: 400 }, { status: 400 });
  }

  const { sessionId, lead } = body;
  const userMessage = sanitizeMessage(body.message);

  try {
    // 4. Retrieve semantically relevant knowledge chunks (RAG)
    const chunks = await searchKnowledgeChunks(userMessage);

    // 5. Build system prompt (RAG context + static fallback)
    const systemPrompt = buildSystemPrompt(chunks);

    // 6. Detect lead-capture intent before calling the LLM (no extra latency)
    const shouldCaptureLead = detectLeadIntent(userMessage);

    // 7. Run AI completion and optional lead save concurrently
    const leadPayload: Omit<Lead, "id" | "created_at"> | null = lead
      ? { ...lead, session_id: lead.session_id ?? sessionId }
      : null;

    const [reply, savedLead] = await Promise.all([
      getAIReply(userMessage, systemPrompt),
      leadPayload ? persistLead(leadPayload) : Promise.resolve(false),
    ]);

    return NextResponse.json(
      { message: reply, reply, savedLead, shouldCaptureLead, branding: BRANDING },
      { status: 200 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[POST /api/chat]", message);
    return NextResponse.json(
      { error: "Internal server error.", status: 500 },
      { status: 500 }
    );
  }
}

/** Reject all non-POST methods. */
export async function GET(): Promise<NextResponse<ApiError>> {
  return NextResponse.json(
    { error: "Method not allowed.", status: 405 },
    { status: 405 }
  );
}
