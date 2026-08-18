import { NextResponse } from "next/server";
import { bookings } from "@/lib/mongo";

export const dynamic = "force-dynamic";

// POST /api/bookings/:id/team-reminder-sent — n8n only (Bearer N8N_WEBHOOK_SECRET).
// Doesn't send Telegram itself — n8n sends it, then calls this right after its
// Telegram node succeeds, to mark that channel done. Idempotent: calling it
// again after teamReminderSentAt is already set just echoes the existing
// timestamp rather than erroring, so a retried n8n step can't break the flow.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const secret = process.env.N8N_WEBHOOK_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const col = await bookings();
  const doc = await col.findOne({ id }, { projection: { _id: 0 } });
  if (!doc) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  if (doc.status !== "confirmed") {
    return NextResponse.json({ error: "Booking is not confirmed." }, { status: 409 });
  }

  if (doc.teamReminderSentAt) {
    return NextResponse.json({ ok: true, alreadySent: true, teamReminderSentAt: doc.teamReminderSentAt });
  }

  const teamReminderSentAt = new Date().toISOString();
  await col.updateOne({ id }, { $set: { teamReminderSentAt } });

  return NextResponse.json({ ok: true, alreadySent: false, teamReminderSentAt });
}
