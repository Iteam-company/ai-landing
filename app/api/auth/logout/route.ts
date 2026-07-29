import { NextResponse } from "next/server";
import { clearCustomerSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST /api/auth/logout — end the customer session.
export async function POST() {
  await clearCustomerSession();
  return NextResponse.json({ ok: true });
}
