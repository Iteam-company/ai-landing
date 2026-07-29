import { NextResponse } from "next/server";
import { customers } from "@/lib/mongo";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/customers — admin only: list customers (no password hashes).
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const list = await (await customers())
    .find({}, { projection: { _id: 0, passwordHash: 0 } })
    .sort({ lastVisited: -1 })
    .toArray();
  return NextResponse.json({ customers: list });
}
