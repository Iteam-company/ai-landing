import { NextResponse } from "next/server";
import { bookings } from "@/lib/mongo";
import { sendMail } from "@/lib/mailer";
import { bookingConfirmedEmail } from "@/lib/emails";
import { siteMeta } from "@/lib/site-meta";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const secret = process.env.N8N_WEBHOOK_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const meetUrl = typeof body.meetUrl === "string" ? body.meetUrl.trim() : "";
  if (!meetUrl) {
    return NextResponse.json({ error: "meetUrl is required." }, { status: 400 });
  }

  const col = await bookings();
  const doc = await col.findOne({ id }, { projection: { _id: 0 } });
  if (!doc) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  if (doc.status !== "confirmed") {
    return NextResponse.json({ error: "Booking is not confirmed." }, { status: 409 });
  }

  // Written in the language the visitor booked in (see BookingDoc.locale).
  const sent = await sendMail({
    to: doc.email,
    ...bookingConfirmedEmail({ ...siteMeta(), locale: doc.locale, booking: doc, meetUrl }),
  });

  return NextResponse.json({ ok: true, sent });
}
