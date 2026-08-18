// Theme-matched HTML email builders for the booking + lead flows. Pure string
// builders (no server-only deps) — the routes pass the client's brand + accent so
// each email matches the site's look. Inline styles only (email clients ignore
// <style>).
//
// Copy comes from `content/<locale>/ui.ts` → `emails`: visitor-facing mail is
// written in the language the visitor used (stored on the booking), while the
// agency's own notifications default to the build's DEFAULT_LOCALE.

import { getUi } from "@/content";
import type { Ui } from "@/content/types";
import { DEFAULT_LOCALE, type Locale } from "@/lib/lang";
import { fill } from "@/lib/utils";

export interface EmailBooking {
  name: string;
  email: string;
  phone?: string;
  note?: string;
  date: string;
  time: string;
  status: "pending" | "confirmed" | "cancelled";
}

export interface EmailLead {
  name: string;
  contact: string;
  task?: string;
  source: string;
}

interface Theme {
  brand: string;
  accent: string; // hex, the client's palette accent
  /** Language of this email. Defaults to the build's default locale. */
  locale?: Locale;
}

type BookingEmail = Theme & { booking: EmailBooking };

type Fields = Ui["emails"]["fields"];

interface Cta {
  label: string;
  href: string;
}

function rows(b: EmailBooking, f: Fields): [string, string][] {
  return [
    [f.when, `${b.date} · ${b.time}`],
    [f.name, b.name],
    [f.email, b.email],
    ...(b.phone ? ([[f.phone, b.phone]] as [string, string][]) : []),
    ...(b.note ? ([[f.note, b.note]] as [string, string][]) : []),
  ];
}

/** Shared dark, accent-tinted shell. Works across all (dark) palettes. */
function shell({
  brand,
  accent,
  title,
  intro,
  details,
  footer,
  cta,
}: {
  brand: string;
  accent: string;
  title: string;
  intro: string;
  details: [string, string][];
  footer: string;
  cta?: Cta;
}): string {
  const detailRows = details
    .map(
      ([k, v]) =>
        `<tr>
          <td style="padding:6px 0;color:#8b9088;font-size:13px;width:104px;vertical-align:top">${k}</td>
          <td style="padding:6px 0;color:#edf0e8;font-size:14px">${escapeHtml(v)}</td>
        </tr>`,
    )
    .join("");

  // Table-based button — email clients strip <style>, so all sizing/color is inline.
  const ctaBlock = cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0 0">
        <tr><td style="border-radius:10px;background:${accent}">
          <a href="${escapeHtml(cta.href)}" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:600;color:#0a0b0f;text-decoration:none;border-radius:10px">${escapeHtml(cta.label)}</a>
        </td></tr>
      </table>`
    : "";

  return `<!doctype html>
<html><body style="margin:0;background:#0a0b0f;padding:28px 16px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0"
        style="max-width:480px;background:#12141c;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden">
        <tr><td style="height:4px;background:${accent}"></td></tr>
        <tr><td style="padding:30px 30px 26px">
          <div style="font-size:12px;font-weight:600;letter-spacing:0.12em;color:${accent};text-transform:uppercase">${escapeHtml(brand)}</div>
          <h1 style="margin:10px 0 14px;font-size:22px;line-height:1.25;color:#edf0e8;font-weight:700">${escapeHtml(title)}</h1>
          <p style="margin:0 0 22px;color:#8b9088;font-size:15px;line-height:1.6">${escapeHtml(intro)}</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
            style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:6px 16px">
            ${detailRows}
          </table>
          ${ctaBlock}
          <p style="margin:22px 0 0;color:#6b6f68;font-size:12px;line-height:1.6">${escapeHtml(footer)}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function bookingCustomerEmail({
  brand,
  accent,
  locale = DEFAULT_LOCALE,
  booking,
}: BookingEmail): { subject: string; html: string } {
  const t = getUi(locale).emails;
  const name = booking.name.split(" ")[0] || booking.name;
  return {
    subject: fill(t.bookingCustomer.subject, { brand }),
    html: shell({
      brand,
      accent,
      title: fill(t.bookingCustomer.title, { name }),
      intro: t.bookingCustomer.intro,
      details: rows(booking, t.fields),
      footer: fill(t.bookingCustomer.footer, { brand }),
    }),
  };
}

export function bookingAdminEmail({
  brand,
  accent,
  locale = DEFAULT_LOCALE,
  booking,
}: BookingEmail): { subject: string; html: string } {
  const t = getUi(locale).emails;
  return {
    subject: fill(t.bookingAdmin.subject, {
      name: booking.name,
      date: booking.date,
      time: booking.time,
    }),
    html: shell({
      brand,
      accent,
      title: t.bookingAdmin.title,
      intro: t.bookingAdmin.intro,
      details: rows(booking, t.fields),
      footer: fill(t.bookingAdmin.footer, { brand }),
    }),
  };
}

export function bookingConfirmedEmail({
  brand,
  accent,
  locale = DEFAULT_LOCALE,
  booking,
  meetUrl,
}: BookingEmail & { meetUrl?: string }): { subject: string; html: string } {
  const t = getUi(locale).emails;
  const trimmedMeetUrl = meetUrl?.trim();
  const cta = trimmedMeetUrl ? { label: t.bookingConfirmed.meetCta, href: trimmedMeetUrl } : undefined;
  return {
    subject: fill(t.bookingConfirmed.subject, { brand }),
    html: shell({
      brand,
      accent,
      title: t.bookingConfirmed.title,
      intro: cta ? t.bookingConfirmed.introWithMeet : t.bookingConfirmed.intro,
      details: rows(booking, t.fields),
      footer: fill(t.bookingConfirmed.footer, { brand }),
      cta,
    }),
  };
}

/** Admin notification for a conversion-zone form submission. */
export function leadAdminEmail({
  brand,
  accent,
  locale = DEFAULT_LOCALE,
  lead,
}: Theme & { lead: EmailLead }): { subject: string; html: string } {
  const t = getUi(locale).emails;
  return {
    subject: fill(t.leadAdmin.subject, { name: lead.name }),
    html: shell({
      brand,
      accent,
      title: t.leadAdmin.title,
      intro: t.leadAdmin.intro,
      details: [
        [t.fields.name, lead.name],
        [t.fields.contact, lead.contact],
        ...(lead.task ? ([[t.fields.task, lead.task]] as [string, string][]) : []),
        [t.fields.source, lead.source],
      ],
      footer: fill(t.leadAdmin.footer, { brand }),
    }),
  };
}
