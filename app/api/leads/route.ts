import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { leads, type LeadDoc } from "@/lib/mongo";
import { isAdmin } from "@/lib/auth";
import { sendMail } from "@/lib/mailer";
import { leadAdminEmail } from "@/lib/emails";
import { siteMeta } from "@/lib/site-meta";

export const dynamic = "force-dynamic";

// Lead intake for the conversion-zone form. Only exists in backend builds — a
// static client has app/api pruned and posts straight to the n8n webhook via
// NEXT_PUBLIC_N8N_WEBHOOK_URL instead (see lib/leads.ts).
//
// On a submission this route: stores the lead in MongoDB → emails the admin
// (no-op without SMTP) → forwards the payload to N8N_WEBHOOK_URL if set, so the
// same automation runs whichever wiring the client picked.

/** Best-effort forward to n8n. Never throws — the lead is already persisted. */
async function forwardToN8n(doc: LeadDoc): Promise<void> {
  const url = process.env.N8N_WEBHOOK_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.N8N_WEBHOOK_SECRET
          ? { Authorization: `Bearer ${process.env.N8N_WEBHOOK_SECRET}` }
          : {}),
      },
      body: JSON.stringify(doc),
    });
  } catch (err) {
    console.error("[leads] n8n forward failed:", err instanceof Error ? err.message : err);
  }
}

// POST /api/leads — public: accept a lead from the contact form.
export async function POST(request: Request) {
  let body: Partial<LeadDoc>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректное тело запроса." }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  const contact = String(body.contact ?? "").trim();

  if (!name || !contact) {
    return NextResponse.json({ error: "Укажите имя и контакт." }, { status: 400 });
  }

  const doc: LeadDoc = {
    id: randomUUID(),
    name,
    contact,
    task: body.task ? String(body.task).trim() : undefined,
    source: body.source ? String(body.source).trim() : "contact-form",
    createdAt: new Date().toISOString(),
  };

  await (await leads()).insertOne(doc);

  const adminTo = process.env.ADMIN_USER;
  if (adminTo) {
    await sendMail({ to: adminTo, ...leadAdminEmail({ ...siteMeta(), lead: doc }) });
  }
  await forwardToN8n(doc);

  return NextResponse.json({ ok: true, id: doc.id }, { status: 201 });
}

// GET /api/leads — admin only: list leads (newest first).
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const list = await (await leads())
    .find({}, { projection: { _id: 0 } })
    .sort({ createdAt: -1 })
    .toArray();
  return NextResponse.json({ leads: list });
}
