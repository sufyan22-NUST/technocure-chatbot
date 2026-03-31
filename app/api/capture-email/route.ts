/**
 * app/api/capture-email/route.ts
 * Stores a visitor's email in the `visitor_emails` Supabase table
 * and fires a CEO notification via Gmail SMTP.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendVisitorNotification } from "@/lib/emailClient";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, sessionId, chatSnippet } = body as {
      email: string;
      sessionId?: string;
      chatSnippet?: string;
    };

    if (!email || !EMAIL_REGEX.test(email.trim())) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Save to Supabase (best-effort — don't let a DB error block the chat)
    const { error: dbError } = await supabase.from("visitor_emails").insert({
      email: cleanEmail,
      session_id: sessionId ?? null,
      chat_snippet: chatSnippet ?? null,
    });

    if (dbError) {
      console.error("[capture-email] Supabase insert error:", dbError.message);
    }

    // Send CEO notification (also best-effort)
    await sendVisitorNotification(cleanEmail, chatSnippet).catch((err) =>
      console.error("[capture-email] Email notification error:", err)
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[capture-email] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
