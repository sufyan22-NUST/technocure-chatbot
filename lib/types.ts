/**
 * lib/types.ts
 * Central type registry for the Technocure chatbot.
 * All API contracts, database shapes, and UI state types live here.
 */

// ── Database shapes ────────────────────────────────────────────────────────────

/** Row shape for the `leads` table. */
export interface Lead {
  id: string;
  name: string;
  email: string;
  company: string | null;
  message: string;
  session_id: string | null;
  created_at: string;
}

/** Row shape for the `knowledge_chunks` table (pgvector). */
export interface KnowledgeChunk {
  id: string;
  content: string;
  metadata: Record<string, string> | null;
  similarity?: number; // populated by the RPC match function
}

// ── API contracts ──────────────────────────────────────────────────────────────

/** A single turn of conversation history sent to the API. */
export interface ConversationTurn {
  role: "user" | "assistant";
  content: string;
}

/**
 * Body sent by the chat widget to POST /api/chat.
 * `history` carries prior turns so the AI maintains context across messages.
 * `lead` is included only when the visitor has submitted the lead form.
 */
export interface ChatRequest {
  message: string;
  sessionId: string;
  history?: ConversationTurn[];
  lead?: Omit<Lead, "id" | "created_at">;
}

/** Branding metadata returned with every chat response. */
export interface BrandingMeta {
  theme_color: string;
  logo_url: string;
  avatar_url: string;
  font_family: string;
}

/**
 * Successful response from POST /api/chat.
 * `shouldCaptureLead` signals the UI to show the lead-capture form.
 * `branding` provides metadata for the front-end to render the widget.
 */
export interface ChatResponse {
  message: string;
  reply: string;
  savedLead: boolean;
  shouldCaptureLead: boolean;
  branding: BrandingMeta;
}

/** Shape returned on any API error. */
export interface ApiError {
  error: string;
  status: number;
}

// ── Chat UI state ──────────────────────────────────────────────────────────────

/** A single turn in the conversation displayed in the widget. */
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

/** All fields a visitor can submit in the lead-capture form. */
export interface LeadFormValues {
  name: string;
  email: string;
  company: string;
}

/** Row shape for the `visitor_emails` table. */
export interface VisitorEmail {
  id: string;
  email: string;
  session_id: string | null;
  chat_snippet: string | null;
  created_at: string;
}