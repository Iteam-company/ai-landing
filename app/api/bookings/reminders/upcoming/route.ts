import { NextResponse } from "next/server";
import { bookings } from "@/lib/mongo";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.N8N_WEBHOOK_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const col = await bookings();
  const docs = await col
    .find(
      {
        status: "confirmed",
        meetUrl: { $exists: true, $ne: "" },
        $or: [{ clientReminderSentAt: { $exists: false } }, { teamReminderSentAt: { $exists: false } }],
      },
      { projection: { _id: 0 } },
    )
    .toArray();

  return NextResponse.json({
    bookings: docs.map((doc) => ({
      bookingId: doc.id,
      name: doc.name,
      email: doc.email,
      phone: doc.phone ?? "",
      date: doc.date,
      time: doc.time,
      comment: doc.note ?? "",
      meetUrl: doc.meetUrl ?? "",
      clientReminderSent: Boolean(doc.clientReminderSentAt),
      teamReminderSent: Boolean(doc.teamReminderSentAt),
    })),
  });
}
