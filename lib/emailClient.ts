/**
 * lib/emailClient.ts
 * Nodemailer transporter using Gmail SMTP.
 * Server-only — never import this in client components.
 *
 * Required env vars:
 *   GMAIL_USER         — sender Gmail address (e.g. sufyan.nust21@gmail.com)
 *   GMAIL_APP_PASSWORD — Gmail App Password (not your regular password)
 *
 * Setup:
 *   1. Enable 2-Step Verification on your Google account.
 *   2. Go to myaccount.google.com → Security → App Passwords.
 *   3. Create a new App Password named "Technocure Bot".
 *   4. Copy the 16-character password into GMAIL_APP_PASSWORD.
 */

import nodemailer from "nodemailer";

const CEO_EMAIL = "sufyan.nust21@gmail.com";

/** Returns a configured transporter, or null if credentials are missing. */
function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    console.warn(
      "[emailClient] GMAIL_USER or GMAIL_APP_PASSWORD not configured — " +
        "visitor notifications will be skipped."
    );
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

/**
 * Sends a visitor-email notification to the CEO.
 * Fails silently if credentials are not configured so the main
 * capture flow is never blocked by an email error.
 */
export async function sendVisitorNotification(
  visitorEmail: string,
  chatSnippet?: string
): Promise<void> {
  const transporter = getTransporter();
  if (!transporter) return;

  const timestamp = new Date().toLocaleString("en-ZA", {
    timeZone: "Africa/Johannesburg",
    dateStyle: "medium",
    timeStyle: "short",
  });

  await transporter.sendMail({
    from: `"Technocure Bot" <${process.env.GMAIL_USER}>`,
    to: CEO_EMAIL,
    subject: `New chat visitor — ${visitorEmail}`,
    html: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;
                  padding:28px;border:1px solid #e5e7eb;border-radius:12px;
                  background:#ffffff;">

        <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
          <div style="width:36px;height:36px;border-radius:50%;background:#4dfe03;
                      display:flex;align-items:center;justify-content:center;
                      font-weight:700;font-size:12px;color:#111827;">TC</div>
          <span style="font-size:16px;font-weight:600;color:#111827;">
            New Visitor on Technocure Chat
          </span>
        </div>

        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr>
            <td style="padding:10px 0;color:#6b7280;border-bottom:1px solid #f3f4f6;width:130px;">
              Visitor Email
            </td>
            <td style="padding:10px 0;color:#111827;font-weight:600;border-bottom:1px solid #f3f4f6;">
              <a href="mailto:${visitorEmail}" style="color:#2563eb;text-decoration:none;">
                ${visitorEmail}
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 0;color:#6b7280;border-bottom:1px solid #f3f4f6;">
              Time (SAST)
            </td>
            <td style="padding:10px 0;color:#111827;border-bottom:1px solid #f3f4f6;">
              ${timestamp}
            </td>
          </tr>
          ${
            chatSnippet
              ? `<tr>
                  <td style="padding:10px 0;color:#6b7280;vertical-align:top;">
                    First Message
                  </td>
                  <td style="padding:10px 0;color:#374151;font-style:italic;">
                    "${chatSnippet}"
                  </td>
                </tr>`
              : ""
          }
        </table>

        <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb;
                    font-size:11px;color:#9ca3af;">
          Sent automatically by the Technocure chatbot
        </div>
      </div>
    `,
  });
}
