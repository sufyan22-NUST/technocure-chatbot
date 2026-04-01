/**
 * app/api/send-summary/route.ts
 * POST /api/send-summary
 *
 * Called by the chat widget after 10 minutes of visitor inactivity.
 * Pipeline:
 *  1. Validate request body (messages array required, email optional).
 *  2. Summarize conversation via Claude.
 *  3. Persist summary to Supabase chat_summaries table.
 *  4. Email summary to business owner.
 *  5. Email summary to visitor (if email captured and not "skipped").
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { summarizeConversation, type MessageTurn } from "@/lib/summarize";
import { sendEmail } from "@/lib/email";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const OWNER_EMAIL = process.env.OWNER_EMAIL ?? process.env.GMAIL_USER ?? "";

function ownerHtml(email: string | null, summary: string): string {
  return `
    <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;
                padding:28px;border:1px solid #e5e7eb;border-radius:12px;background:#ffffff;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
        <div style="width:36px;height:36px;border-radius:50%;background:#4dfe03;
                    display:flex;align-items:center;justify-content:center;
                    font-weight:700;font-size:12px;color:#111827;">TC</div>
        <span style="font-size:16px;font-weight:600;color:#111827;">New Chat Lead — Conversation Summary</span>
      </div>
      ${
        email
          ? `<p style="font-size:14px;color:#374151;margin-bottom:16px;">
               <strong>Visitor email:</strong>
               <a href="mailto:${email}" style="color:#2563eb;">${email}</a>
             </p>`
          : `<p style="font-size:14px;color:#6b7280;margin-bottom:16px;">Visitor did not provide an email.</p>`
      }
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;
                  padding:16px;font-size:14px;color:#374151;white-space:pre-wrap;line-height:1.7;">
${summary}
      </div>
      <p style="font-size:11px;color:#9ca3af;margin-top:20px;">
        Sent automatically by the Technocure chatbot
      </p>
    </div>
  `;
}

function visitorHtml(summary: string): string {
  return `
    <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;
                padding:28px;border:1px solid #e5e7eb;border-radius:12px;background:#ffffff;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
        <div style="width:36px;height:36px;border-radius:50%;background:#4dfe03;
                    display:flex;align-items:center;justify-content:center;
                    font-weight:700;font-size:12px;color:#111827;">TC</div>
        <span style="font-size:16px;font-weight:600;color:#111827;">Your Technocure Conversation Summary</span>
      </div>
      <p style="font-size:14px;color:#374151;margin-bottom:16px;">
        Thank you for chatting with us. Here is a summary of your conversation:
      </p>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;
                  padding:16px;font-size:14px;color:#374151;white-space:pre-wrap;line-height:1.7;">
${summary}
      </div>
      <p style="font-size:14px;color:#374151;margin-top:20px;">
        If you have further questions, reach us at
        <a href="mailto:hello@technocure.co.za" style="color:#2563eb;">hello@technocure.co.za</a>.
      </p>
      <p style="font-size:11px;color:#9ca3af;margin-top:16px;">
        Technocure Solutions — clarity-first digital transformation
      </p>
    </div>
  `;
}

export async function POST(req: NextRequest) {
  let body: { email?: string; messages: MessageTurn[] };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { email, messages } = body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: "messages array is required and must not be empty." },
      { status: 400 }
    );
  }

  // Filter to only real exchanges (exclude the static welcome message if echoed)
  const turns: MessageTurn[] = messages.filter(
    (m) =>
      m &&
      typeof m.role === "string" &&
      typeof m.content === "string" &&
      m.content.trim().length > 0
  );

  if (turns.length < 2) {
    // Not enough content to summarise meaningfully
    return NextResponse.json({ success: true, skipped: true });
  }

  try {
    const summary = await summarizeConversation(turns);

    // Persist to Supabase (best-effort — log but don't fail)
    const { error: dbError } = await supabase
      .from("chat_summaries")
      .insert({ email: email ?? null, summary });

    if (dbError) {
      console.error("[send-summary] Supabase insert error:", dbError.message);
    }

    // Email owner (required)
    if (OWNER_EMAIL) {
      await sendEmail(
        OWNER_EMAIL,
        `New Technocure Chat Lead${email ? ` — ${email}` : ""}`,
        ownerHtml(email ?? null, summary)
      );
    }

    // Email visitor (best-effort — only if a real email was captured)
    if (email && email !== "skipped") {
      await sendEmail(
        email,
        "Your Technocure Conversation Summary",
        visitorHtml(summary)
      ).catch((err) =>
        console.error("[send-summary] Visitor email error:", err)
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[send-summary] Error:", message);
    return NextResponse.json(
      { error: "Failed to generate or send summary." },
      { status: 500 }
    );
  }
}
