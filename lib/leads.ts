// Where the conversion-zone form sends a lead. CLIENT-SAFE (no server imports) —
// the form component calls this to pick an endpoint at render time.
//
// Two supported wirings, in priority order:
//   1. NEXT_PUBLIC_N8N_WEBHOOK_URL — POST straight to an n8n Webhook node. Works
//      in a static export (no server), which is the default build.
//   2. /api/leads — the server route (backend builds only: it stores the lead in
//      MongoDB, emails the admin and can forward to N8N_WEBHOOK_URL server-side).
//      A static client has app/api pruned by the CLI, so it is only offered when
//      a backend feature is on.
//
// With neither configured the form falls back to the email/Telegram contacts
// shown next to it, instead of posting into the void.

import { HAS_BACKEND } from "@/lib/features";
import type { Locale } from "@/lib/lang";

export interface LeadPayload {
  name: string;
  contact: string;
  task?: string;
  /** Where on the page the lead came from, useful for n8n routing. */
  source: string;
  /** Language the visitor filled the form in — reply and route accordingly. */
  locale: Locale;
}

/** Localized failure copy, from `content/ui.ts` → `form`. */
export interface LeadMessages {
  failed: string;
  notConnected: string;
}

const WEBHOOK = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL?.trim();

/** The POST target for the lead form, or null when the form has nowhere to go. */
export function leadEndpoint(): string | null {
  if (WEBHOOK) return WEBHOOK;
  if (HAS_BACKEND) return "/api/leads";
  return null;
}

/** Posts a lead; throws with a readable message when the endpoint rejects it. */
export async function submitLead(
  payload: LeadPayload,
  messages: LeadMessages,
): Promise<void> {
  const endpoint = leadEndpoint();
  if (!endpoint) throw new Error(messages.notConnected);

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, submittedAt: new Date().toISOString() }),
  });

  // The endpoint's own error copy is English (or, with n8n, arbitrary), so the
  // caller's localized message is what the visitor sees.
  if (!res.ok) throw new Error(messages.failed);
}
