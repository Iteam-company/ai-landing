import "server-only";
import { MongoClient, type Db, type Collection } from "mongodb";
import type { Locale } from "@/lib/lang";

// Server-only MongoDB access for the backend features (Business Calendar,
// Customers) and this template's lead intake. One free database per client — the
// connection string and DB name come from the env the CLI writes into .env.local
// (MONGODB_URI / EASYLAND_DB_NAME).
//
// The client is cached on globalThis so Next's dev hot-reload doesn't open a new
// pool on every request.

export interface BookingDoc {
  id: string; // stable uuid the admin dashboard acts on
  name: string;
  email: string;
  phone?: string;
  note?: string;
  date: string; // ISO date, e.g. "2026-06-10"
  time: string; // "14:30"
  status: "pending" | "confirmed" | "cancelled";
  /** Language the visitor booked in — used for the confirmation email. */
  locale?: Locale;
  createdAt: string;
  /** Google Meet link, set by the n8n confirmation callback once created. */
  meetUrl?: string;
  /** Client reminder email successfully sent. */
  clientReminderSentAt?: string;
  /** Internal Telegram reminder successfully sent. */
  teamReminderSentAt?: string;
}

export interface CustomerDoc {
  email: string;
  passwordHash: string;
  phone?: string;
  photo?: string;
  bonuses: number;
  lastVisited: string;
  createdAt: string;
}

/** A submission from the conversion-zone form (POST /api/leads). */
export interface LeadDoc {
  id: string;
  name: string;
  /** Email or Telegram handle — the form takes either. */
  contact: string;
  task?: string;
  /** Which block the lead came from, e.g. "contact-form". */
  source: string;
  /** Language the visitor filled the form in — reply and route accordingly. */
  locale?: Locale;
  createdAt: string;
}

const uri = process.env.MONGODB_URI;
const dbName = process.env.EASYLAND_DB_NAME || "easyland";

declare global {
  var __easylandMongo: Promise<MongoClient> | undefined;
}

function clientPromise(): Promise<MongoClient> {
  if (!uri) {
    throw new Error("MONGODB_URI is not set — backend features require a MongoDB connection.");
  }
  if (!global.__easylandMongo) {
    global.__easylandMongo = new MongoClient(uri).connect();
  }
  return global.__easylandMongo;
}

export async function getDb(): Promise<Db> {
  const client = await clientPromise();
  return client.db(dbName);
}

export async function bookings(): Promise<Collection<BookingDoc>> {
  return (await getDb()).collection<BookingDoc>("bookings");
}

export async function customers(): Promise<Collection<CustomerDoc>> {
  const col = (await getDb()).collection<CustomerDoc>("customers");
  // Idempotent: enforce one account per email.
  await col.createIndex({ email: 1 }, { unique: true }).catch(() => {});
  return col;
}

export async function leads(): Promise<Collection<LeadDoc>> {
  return (await getDb()).collection<LeadDoc>("leads");
}
