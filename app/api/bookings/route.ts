import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { bookings, type BookingDoc } from "@/lib/mongo";
import { isAdmin } from "@/lib/auth";
import { sendMail } from "@/lib/mailer";
import { bookingCustomerEmail, bookingAdminEmail } from "@/lib/emails";
import { siteMeta } from "@/lib/site-meta";

export const dynamic = "force-dynamic";

// POST /api/bookings — public: create a booking request (status "pending").
export async function POST(request: Request) {
  let body: Partial<BookingDoc>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

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
    createdAt: new Date().toISOString(),
  };

  await (await bookings()).insertOne(doc);

  // Theme-matched notifications (no-op when SMTP isn't configured).
  const meta = siteMeta();
  await sendMail({ to: doc.email, ...bookingCustomerEmail({ ...meta, booking: doc }) });
  const adminTo = process.env.ADMIN_USER;
  if (adminTo) await sendMail({ to: adminTo, ...bookingAdminEmail({ ...meta, booking: doc }) });

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
