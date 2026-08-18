import "server-only";

// Best-effort n8n webhook notifications. Configured via env — when
// N8N_BOOKING_WEBHOOK_URL is unset the whole thing is INERT, mirroring
// lib/mailer.ts. Never throws: a webhook failure must not break the request
// that triggered it.
//
//   N8N_BOOKING_WEBHOOK_URL, N8N_WEBHOOK_SECRET (optional, sent as Bearer token)

const url = process.env.N8N_BOOKING_WEBHOOK_URL;
const secret = process.env.N8N_WEBHOOK_SECRET;

const TIMEOUT_MS = 3000;

/** Best-effort send. Never throws — a webhook failure must not break the request. */
export async function sendN8nEvent(
  payload: Record<string, unknown>,
): Promise<boolean> {
  if (!url) return false;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!res.ok) {
      console.error("[n8n] webhook failed:", res.status, res.statusText);
      return false;
    }

    return true;
  } catch (err) {
    console.error(
      "[n8n] webhook failed:",
      err instanceof Error ? err.message : err,
    );
    return false;
  } finally {
    clearTimeout(timeout);
  }
}
