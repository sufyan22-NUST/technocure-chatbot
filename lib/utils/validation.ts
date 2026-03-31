/**
 * lib/utils/validation.ts
 * Pure input-validation and sanitisation helpers.
 * No side-effects; safe to import anywhere (server or client).
 */

import type { ChatRequest } from "@/lib/types";

/** Maximum character length accepted for a chat message. */
const MAX_MESSAGE_LENGTH = 1000;

/** Minimal email regex — sufficient for a chatbot lead form. */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── Chat request ───────────────────────────────────────────────────────────────

/**
 * Validates the incoming POST /api/chat body.
 * Returns a human-readable error string, or `null` if the body is valid.
 */
export function validateChatRequest(body: unknown): string | null {
  if (!body || typeof body !== "object") {
    return "Request body must be a JSON object.";
  }

  const { message, sessionId } = body as Record<string, unknown>;

  if (!message || typeof message !== "string" || !message.trim()) {
    return "Field 'message' is required and must be a non-empty string.";
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return `Field 'message' must not exceed ${MAX_MESSAGE_LENGTH} characters.`;
  }
  if (!sessionId || typeof sessionId !== "string" || !sessionId.trim()) {
    return "Field 'sessionId' is required and must be a non-empty string.";
  }

  return null;
}

/**
 * Sanitises a user message: trims whitespace and collapses repeated newlines.
 * Call after validation succeeds.
 */
export function sanitizeMessage(message: string): string {
  return message.trim().replace(/\n{3,}/g, "\n\n");
}

// ── Lead form ──────────────────────────────────────────────────────────────────

/**
 * Validates the optional lead payload inside a ChatRequest.
 * Returns a human-readable error string, or `null` if valid.
 */
export function validateLeadPayload(
  lead: ChatRequest["lead"]
): string | null {
  if (!lead) return null; // lead is optional

  if (!lead.name || !lead.name.trim()) {
    return "Lead 'name' is required.";
  }
  if (!lead.email || !EMAIL_REGEX.test(lead.email)) {
    return "Lead 'email' must be a valid email address.";
  }
  if (!lead.message || !lead.message.trim()) {
    return "Lead 'message' is required.";
  }

  return null;
}
