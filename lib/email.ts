/**
 * lib/email.ts
 * Thin Nodemailer wrapper used by all server-side email senders.
 * Server-only — never import in client components.
 */

import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

/**
 * Sends an HTML email. Throws on delivery failure — callers should handle errors
 * according to their criticality (best-effort vs. required).
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  await transporter.sendMail({
    from: `"Technocure Assistant" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  });
}
