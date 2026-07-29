// Theme-matched HTML email builders for the booking + lead flows. Pure string
// builders (no server-only deps) — the routes pass the client's brand + accent so
// each email matches the site's look. Inline styles only (email clients ignore
// <style>). Copy is Russian, like the rest of this template.

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
  booking: EmailBooking;
}

function rows(b: EmailBooking): [string, string][] {
  return [
    ["Когда", `${b.date} · ${b.time}`],
    ["Имя", b.name],
    ["Email", b.email],
    ...(b.phone ? ([["Телефон", b.phone]] as [string, string][]) : []),
    ...(b.note ? ([["Комментарий", b.note]] as [string, string][]) : []),
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
}: {
  brand: string;
  accent: string;
  title: string;
  intro: string;
  details: [string, string][];
  footer: string;
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

export function bookingCustomerEmail({ brand, accent, booking }: Theme): { subject: string; html: string } {
  return {
    subject: `Заявка на созвон принята — ${brand}`,
    html: shell({
      brand,
      accent,
      title: `Спасибо, ${booking.name.split(" ")[0] || booking.name}!`,
      intro: "Мы получили вашу заявку на созвон и подтвердим её письмом в ближайшее время.",
      details: rows(booking),
      footer: "Если вы не оставляли заявку, просто проигнорируйте это письмо.",
    }),
  };
}

export function bookingAdminEmail({ brand, accent, booking }: Theme): { subject: string; html: string } {
  return {
    subject: `Новая заявка на созвон: ${booking.name} — ${booking.date} ${booking.time}`,
    html: shell({
      brand,
      accent,
      title: "Новая заявка на созвон",
      intro: "Пришла новая заявка. Откройте админ-панель, чтобы подтвердить или отменить её.",
      details: rows(booking),
      footer: `Отправлено автоматически с сайта ${brand}.`,
    }),
  };
}

export function bookingConfirmedEmail({ brand, accent, booking }: Theme): { subject: string; html: string } {
  return {
    subject: `Созвон подтверждён — ${brand}`,
    html: shell({
      brand,
      accent,
      title: "Созвон подтверждён",
      intro: "Ваш созвон подтверждён — ссылка на встречу придёт отдельным письмом. До связи!",
      details: rows(booking),
      footer: "Нужно перенести? Просто ответьте на это письмо.",
    }),
  };
}

/** Admin notification for a conversion-zone form submission. */
export function leadAdminEmail({
  brand,
  accent,
  lead,
}: {
  brand: string;
  accent: string;
  lead: EmailLead;
}): { subject: string; html: string } {
  return {
    subject: `Новая заявка с сайта: ${lead.name}`,
    html: shell({
      brand,
      accent,
      title: "Новая заявка с сайта",
      intro: "Кто-то заполнил форму в блоке контактов. Свяжитесь, пока лид горячий.",
      details: [
        ["Имя", lead.name],
        ["Контакт", lead.contact],
        ...(lead.task ? ([["Задача", lead.task]] as [string, string][]) : []),
        ["Источник", lead.source],
      ],
      footer: `Отправлено автоматически с сайта ${brand}.`,
    }),
  };
}
