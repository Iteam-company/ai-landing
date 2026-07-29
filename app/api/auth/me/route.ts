import { NextResponse } from "next/server";
import { customers } from "@/lib/mongo";
import { getCustomerSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/auth/me — the signed-in customer's public profile, or 401.
export async function GET() {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const customer = await (await customers()).findOne(
    { email: session.email },
    { projection: { _id: 0, passwordHash: 0 } },
  );
  if (!customer) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ customer });
}
