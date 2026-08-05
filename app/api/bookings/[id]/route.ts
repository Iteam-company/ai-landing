import { NextResponse } from "next/server";
import { bookings } from "@/lib/mongo";
import { isAdmin } from "@/lib/auth";
import { sendMail } from "@/lib/mailer";
import { bookingConfirmedEmail } from "@/lib/emails";
import { siteMeta } from "@/lib/site-meta";

export const dynamic = "force-dynamic";

const STATUSES = ["pending", "confirmed", "cancelled"] as const;
type Status = (typeof STATUSES)[number];

// PATCH /api/bookings/:id — admin only: change a booking's status.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const status = body.status as Status;
  if (!STATUSES.includes(status)) {
    return NextResponse.json({ error: `status must be one of ${STATUSES.join(", ")}.` }, { status: 400 });
  }
  const col = await bookings();
  const res = await col.updateOne({ id }, { $set: { status } });
  if (!res.matchedCount) return NextResponse.json({ error: "Not found." }, { status: 404 });

  // Email the customer when their booking is confirmed (no-op without SMTP).
  if (status === "confirmed") {
    const doc = await col.findOne({ id }, { projection: { _id: 0 } });
    if (doc) {
      // Written in the language the visitor booked in (see BookingDoc.locale).
      await sendMail({
        to: doc.email,
        ...bookingConfirmedEmail({ ...siteMeta(), locale: doc.locale, booking: doc }),
      });
    }
  }

  return NextResponse.json({ ok: true });
}

// DELETE /api/bookings/:id — admin only.
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const { id } = await params;
  const res = await (await bookings()).deleteOne({ id });
  if (!res.deletedCount) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
