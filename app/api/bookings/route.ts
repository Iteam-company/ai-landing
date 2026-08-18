import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { bookings, type BookingDoc } from "@/lib/mongo";
import { isAdmin } from "@/lib/auth";
import { sendMail } from "@/lib/mailer";
import { bookingCustomerEmail, bookingAdminEmail } from "@/lib/emails";
import { siteMeta } from "@/lib/site-meta";
import { requestLocale } from "@/lib/lang";
import { sendN8nEvent } from "@/lib/n8n";

export const dynamic = "force-dynamic";

// POST /api/bookings — public: create a booking request (status "pending").
export async function POST(request: Request) {
  let body: Partial<BookingDoc>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  // The block posts the locale it was rendered in, so the confirmation email
  // speaks the visitor's language. Error copy stays English — the form shows its own.
  const locale = requestLocale(body.locale);

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  const date = String(body.date ?? "").trim();
  const time = String(body.time ?? "").trim();

  if (!name || !email || !date || !time) {
    return NextResponse.json({ error: "name, email, date and time are required." }, { status: 400 });
  }

  const doc: BookingDoc = {
    id: randomUUID(),
    name,
    email,
    phone: body.phone ? String(body.phone).trim() : undefined,
    note: body.note ? String(body.note).trim() : undefined,
    date,
    time,
    status: "pending",
    locale,
    createdAt: new Date().toISOString(),
  };

  await (await bookings()).insertOne(doc);

  // Fire the booking.created event at n8n. Best-effort — never throws, and a
  // failure here must not affect the booking (already saved) or the emails below.
  await sendN8nEvent({
    event: "booking.created",
    bookingId: doc.id,
    name: doc.name,
    email: doc.email,
    phone: doc.phone ?? "",
    date: doc.date,
    time: doc.time,
    comment: doc.note ?? "",
  });

  // Theme-matched notifications (no-op when SMTP isn't configured). The visitor
  // gets their own language; the agency gets the site's default one.
  const meta = siteMeta();
  await sendMail({ to: doc.email, ...bookingCustomerEmail({ ...meta, locale, booking: doc }) });
  // ADMIN_USER is the primary recipient; NOTIFY_EMAILS (comma-separated) adds
  // extra people (e.g. a second team member) to the same notification.
  const adminRecipients = [process.env.ADMIN_USER, ...(process.env.NOTIFY_EMAILS ?? "").split(",")]
    .map((addr) => addr?.trim())
    .filter((addr): addr is string => Boolean(addr));
  if (adminRecipients.length) {
    await sendMail({ to: adminRecipients.join(", "), ...bookingAdminEmail({ ...meta, booking: doc }) });
  }

  return NextResponse.json({ ok: true, id: doc.id }, { status: 201 });
}

// GET /api/bookings — admin only: list bookings (newest first).
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const list = await (await bookings())
    .find({}, { projection: { _id: 0 } })
    .sort({ createdAt: -1 })
    .toArray();
  return NextResponse.json({ bookings: list });
}
