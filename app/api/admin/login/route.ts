import { NextResponse } from "next/server";
import { adminLogin, clearAdminSession, isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST /api/admin/login — exchange ADMIN_USER / ADMIN_PASS for an admin session.
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const user = String(body.user ?? "").trim();
  const pass = String(body.pass ?? "");
  if (await adminLogin(user, pass)) {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Invalid admin credentials." }, { status: 401 });
}

// GET /api/admin/login — whether the current session is an admin (dashboard guard).
export async function GET() {
  return NextResponse.json({ admin: await isAdmin() });
}

// DELETE /api/admin/login — sign the admin out.
export async function DELETE() {
  await clearAdminSession();
  return NextResponse.json({ ok: true });
}
