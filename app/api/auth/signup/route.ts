import { NextResponse } from "next/server";
import { customers, type CustomerDoc } from "@/lib/mongo";
import { hashPassword, setCustomerSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST /api/auth/signup — create a customer account and start a session.
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (!email || !password) {
    return NextResponse.json({ error: "email and password are required." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const col = await customers();
  if (await col.findOne({ email })) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }

  const now = new Date().toISOString();
  const doc: CustomerDoc = {
    email,
    passwordHash: await hashPassword(password),
    phone: body.phone ? String(body.phone).trim() : undefined,
    photo: body.photo ? String(body.photo).trim() : undefined,
    bonuses: 0,
    lastVisited: now,
    createdAt: now,
  };
  await col.insertOne(doc);
  await setCustomerSession(email);
  return NextResponse.json({ ok: true, email }, { status: 201 });
}
