import { NextResponse } from "next/server";
import { bookings } from "@/lib/mongo";

export const dynamic = "force-dynamic";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: Request) {
  const date = new URL(request.url).searchParams.get("date") ?? "";
  if (!DATE_RE.test(date)) {
    return NextResponse.json({ error: "date must be YYYY-MM-DD." }, { status: 400 });
  }

  const docs = await (await bookings())
    .find(
      {
        date,
        $or: [{ blocksSlot: true }, { blocksSlot: { $exists: false }, status: { $in: ["pending", "confirmed"] } }],
      },
      { projection: { _id: 0, time: 1 } },
    )
    .toArray();

  return NextResponse.json({ date, bookedTimes: docs.map((d) => d.time) });
}
