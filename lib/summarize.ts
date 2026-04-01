/**
 * lib/summarize.ts
 * Uses Claude to generate a professional summary of a visitor conversation.
 * Server-only — never import in client components.
 */

import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export interface MessageTurn {
  role: "user" | "assistant";
  content: string;
}

/**
 * Summarizes a conversation into a structured business report.
 * Returns a plain-text summary suitable for email body or database storage.
 */
export async function summarizeConversation(
  messages: MessageTurn[]
): Promise<string> {
  const transcript = messages
    .map((m) => `${m.role === "user" ? "Visitor" : "Assistant"}: ${m.content}`)
    .join("\n");

  const res = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 600,
    messages: [
      {
        role: "user",
        content: `You are a business analyst. Summarize the following customer support conversation in a professional tone.

Structure your summary with these headings:
• Visitor Intent — what the visitor was looking for
• Key Questions — specific questions they asked
• Business Opportunity — services or products they showed interest in
• Urgency Level — Low / Medium / High (with one-line reasoning)
• Recommended Follow-up — what the team should do next

Be concise. No filler. Each section should be 1–3 sentences.

Conversation:
${transcript}`,
      },
    ],
  });

  const block = res.content[0];
  if (!block || block.type !== "text") {
    throw new Error("Claude returned an empty summary.");
  }
  return block.text.trim();
}
