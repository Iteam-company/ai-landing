import "server-only";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

// Lightweight, dependency-free auth for the backend features:
//   • customers  → bcrypt password hashing + a signed JWT in an httpOnly cookie
//   • admin      → a single credential (ADMIN_USER / ADMIN_PASS) → admin JWT cookie
// No external auth service, no per-request DB session — fits the free-tier,
// one-isolated-client-per-deploy model.

const CUSTOMER_COOKIE = "el_customer";
const ADMIN_COOKIE = "el_admin";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function secret(): Uint8Array {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET is not set — backend features require it.");
  return new TextEncoder().encode(s);
}

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

async function sign(payload: Record<string, unknown>): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
}

async function verify<T = Record<string, unknown>>(token: string): Promise<T | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as T;
  } catch {
    return null;
  }
}

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE,
};

// --- Customer session ------------------------------------------------------

export async function setCustomerSession(email: string): Promise<void> {
  const token = await sign({ email, role: "customer" });
  (await cookies()).set(CUSTOMER_COOKIE, token, cookieOptions);
}

export async function getCustomerSession(): Promise<{ email: string } | null> {
  const token = (await cookies()).get(CUSTOMER_COOKIE)?.value;
  if (!token) return null;
  const payload = await verify<{ email: string; role: string }>(token);
  return payload?.role === "customer" ? { email: payload.email } : null;
}

export async function clearCustomerSession(): Promise<void> {
  (await cookies()).delete(CUSTOMER_COOKIE);
}

// --- Admin session ---------------------------------------------------------

/** Validate the admin credential against ADMIN_USER / ADMIN_PASS and start a session. */
export async function adminLogin(user: string, pass: string): Promise<boolean> {
  const ok = user === process.env.ADMIN_USER && pass === process.env.ADMIN_PASS;
  if (!ok) return false;
  const token = await sign({ user, role: "admin" });
  (await cookies()).set(ADMIN_COOKIE, token, cookieOptions);
  return true;
}

export async function isAdmin(): Promise<boolean> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  const payload = await verify<{ role: string }>(token);
  return payload?.role === "admin";
}

export async function clearAdminSession(): Promise<void> {
  (await cookies()).delete(ADMIN_COOKIE);
}
