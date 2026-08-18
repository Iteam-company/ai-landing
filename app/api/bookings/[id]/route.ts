import { NextResponse } from "next/server";
import { bookings } from "@/lib/mongo";
import { isAdmin } from "@/lib/auth";
import { sendN8nEvent } from "@/lib/n8n";

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

  // Notify n8n when a booking is confirmed. It creates the Google Calendar
  // event/Meet link and calls back POST .../confirmation-email with the
  // meetUrl once ready — the branded confirmation email is sent from there,
  // not here, since the Meet link doesn't exist yet at this point.
  if (status === "confirmed") {
    const doc = await col.findOne({ id }, { projection: { _id: 0 } });
    if (doc) {
      // Best-effort — never throws.
      await sendN8nEvent({
        event: "booking.confirmed",
        bookingId: doc.id,
        name: doc.name,
        email: doc.email,
        phone: doc.phone ?? "",
        date: doc.date,
        time: doc.time,
        comment: doc.note ?? "",
      });
    }
  }

  if (status === "cancelled") {
    const doc = await col.findOne({ id }, { projection: { _id: 0 } });
    if (doc) {
      // Best-effort — never throws. No cancellation email — none exists yet.
      await sendN8nEvent({
        event: "booking.cancelled",
        bookingId: doc.id,
        name: doc.name,
        email: doc.email,
        phone: doc.phone ?? "",
        date: doc.date,
        time: doc.time,
        comment: doc.note ?? "",
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
