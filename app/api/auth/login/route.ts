import { NextResponse } from "next/server";
import { customers } from "@/lib/mongo";
import { verifyPassword, setCustomerSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST /api/auth/login — verify credentials, bump lastVisited, start a session.
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (!email || !password) {
    return NextResponse.json({ error: "email and password are required." }, { status: 400 });
  }

  const col = await customers();
  const customer = await col.findOne({ email });
  if (!customer || !(await verifyPassword(password, customer.passwordHash))) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  await col.updateOne({ email }, { $set: { lastVisited: new Date().toISOString() } });
  await setCustomerSession(email);
  return NextResponse.json({ ok: true, email, bonuses: customer.bonuses });
}
