import "server-only";
import { MongoClient, type Db, type Collection } from "mongodb";
import type { Locale } from "@/lib/lang";

export interface BookingDoc {
  id: string;
  name: string;
  email: string;
  phone?: string;
  note?: string;
  date: string;
  time: string;
  status: "pending" | "confirmed" | "cancelled";
  locale?: Locale;
  createdAt: string;
  meetUrl?: string;
  clientReminderSentAt?: string;
  teamReminderSentAt?: string;
  blocksSlot?: boolean;
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
