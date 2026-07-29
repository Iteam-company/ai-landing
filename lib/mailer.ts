import "server-only";
import nodemailer from "nodemailer";

// Optional SMTP mailer for booking notifications. Configured via env (the CLI
// asks for it as an optional onboarding step). When SMTP_HOST is unset the whole
// feature is INERT — sendMail() is a no-op — so the site works fine without email.
//
//   SMTP_HOST, SMTP_PORT (default 587), SMTP_USER, SMTP_PASS,
//   SMTP_SECURE ("true" for port 465), EMAIL_FROM ("Brand <addr>")

const host = process.env.SMTP_HOST;

export function isMailEnabled(): boolean {
  return Boolean(host);
}

let cached: nodemailer.Transporter | null = null;

function transport(): nodemailer.Transporter | null {
  if (!host) return null;
  if (!cached) {
    cached = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  }
  return cached;
}

/** Best-effort send. Never throws — a mail failure must not break the request. */
export async function sendMail({ to, subject, html }: { to: string; subject: string; html: string }): Promise<boolean> {
  const t = transport();
  if (!t || !to) return false;
  try {
    await t.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
    });
    return true;
  } catch (err) {
    console.error("[mail] send failed:", err instanceof Error ? err.message : err);
    return false;
  }
}
