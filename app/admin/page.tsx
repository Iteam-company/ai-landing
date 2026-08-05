"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getUi } from "@/content";
import { DEFAULT_LOCALE, INTL_LOCALE } from "@/lib/lang";

// Admin dashboard for the backend features: leads from the conversion-zone form,
// pending bookings (confirm/cancel) and the customer roster. Client component;
// guarded by the admin session cookie via /api/admin/login. Pruned from static
// (no-backend) clients by the CLI.
//
// This is the agency's own panel, not part of the localized site, so it always
// renders in the build's default locale.

const t = getUi(DEFAULT_LOCALE).admin;
const dateFormat = INTL_LOCALE[DEFAULT_LOCALE];

interface Booking {
  id: string;
  name: string;
  email: string;
  phone?: string;
  note?: string;
  date: string;
  time: string;
  status: "pending" | "confirmed" | "cancelled";
  createdAt: string;
}

interface Customer {
  email: string;
  phone?: string;
  bonuses: number;
  lastVisited: string;
  createdAt: string;
}

interface Lead {
  id: string;
  name: string;
  contact: string;
  task?: string;
  source: string;
  createdAt: string;
}

const inputClass =
  "w-full rounded-[var(--radius-input)] border border-border bg-bg px-4 py-3.5 text-[15px] text-fg placeholder:text-fg-muted/60 outline-none focus:border-accent/60";

export default function AdminPage() {
  const [authed, setAuthed] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    fetch("/api/admin/login")
      .then((r) => r.json())
      .then((d) => setAuthed(Boolean(d.admin)))
      .catch(() => setAuthed(false));
  }, []);

  if (authed === null) {
    return <Centered>{t.loading}</Centered>;
  }
  return authed ? <Dashboard onSignOut={() => setAuthed(false)} /> : <Login onSuccess={() => setAuthed(true)} />;
}

function Login({ onSuccess }: { onSuccess: () => void }) {
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: form.get("user"), pass: form.get("pass") }),
    });
    setBusy(false);
    if (res.ok) onSuccess();
    else setError(t.badCredentials);
  }

  return (
    <Centered>
      <form
        onSubmit={submit}
        className="w-full max-w-sm space-y-4 rounded-[var(--radius-card)] bg-bg-card p-8 shadow-node"
      >
        <h1 className="font-display text-2xl font-semibold tracking-tight text-fg">{t.title}</h1>
        <input name="user" placeholder={t.user} required className={inputClass} autoComplete="username" />
        <input name="pass" type="password" placeholder={t.pass} required className={inputClass} autoComplete="current-password" />
        {error ? <p className="font-mono text-[11px] text-red-400">{error}</p> : null}
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? "…" : t.signIn}
        </Button>
      </form>
    </Centered>
  );
}

async function fetchDashboard(): Promise<{
  bookings: Booking[];
  customers: Customer[];
  leads: Lead[];
}> {
  const [b, c, l] = await Promise.all([
    fetch("/api/bookings").then((r) => (r.ok ? r.json() : { bookings: [] })),
    fetch("/api/admin/customers").then((r) => (r.ok ? r.json() : { customers: [] })),
    fetch("/api/leads").then((r) => (r.ok ? r.json() : { leads: [] })),
  ]);
  return { bookings: b.bookings ?? [], customers: c.customers ?? [], leads: l.leads ?? [] };
}

function Dashboard({ onSignOut }: { onSignOut: () => void }) {
  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [leads, setLeads] = React.useState<Lead[]>([]);

  const apply = React.useCallback((d: Awaited<ReturnType<typeof fetchDashboard>>) => {
    setBookings(d.bookings);
    setCustomers(d.customers);
    setLeads(d.leads);
  }, []);

  const refresh = React.useCallback(async () => {
    apply(await fetchDashboard());
  }, [apply]);

  React.useEffect(() => {
    let active = true;
    fetchDashboard().then((d) => {
      if (active) apply(d);
    });
    return () => {
      active = false;
    };
  }, [apply]);

  async function setStatus(id: string, status: Booking["status"]) {
    await fetch(`/api/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    refresh();
  }

  async function signOut() {
    await fetch("/api/admin/login", { method: "DELETE" });
    onSignOut();
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-16 sm:px-8">
      <div className="mb-12 flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-fg">{t.dashboard}</h1>
        <Button variant="secondary" onClick={signOut}>
          {t.signOut}
        </Button>
      </div>

      <TableHeading>{t.leads.heading}</TableHeading>
      <TableFrame className="mb-14">
        <table className="w-full text-left text-sm">
          <Head cells={t.leads.cols} />
          <tbody>
            {leads.length === 0 ? (
              <Empty span={5}>{t.leads.empty}</Empty>
            ) : (
              leads.map((l) => (
                <tr key={l.id} className="border-b border-border/60 last:border-0">
                  <td className="p-3 font-mono text-[11px] text-fg-muted">
                    {new Date(l.createdAt).toLocaleString(dateFormat)}
                  </td>
                  <td className="p-3 text-fg">{l.name}</td>
                  <td className="p-3 text-fg-muted">{l.contact}</td>
                  <td className="max-w-[16rem] truncate p-3 text-fg-muted">{l.task ?? t.empty}</td>
                  <td className="p-3 font-mono text-[11px] text-fg-muted">{l.source}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableFrame>

      <TableHeading>{t.bookings.heading}</TableHeading>
      <TableFrame className="mb-14">
        <table className="w-full text-left text-sm">
          <Head cells={t.bookings.cols} />
          <tbody>
            {bookings.length === 0 ? (
              <Empty span={6}>{t.bookings.empty}</Empty>
            ) : (
              bookings.map((b) => (
                <tr key={b.id} className="border-b border-border/60 last:border-0">
                  <td className="p-3 font-mono text-[11px] text-fg">
                    {b.date} {b.time}
                  </td>
                  <td className="p-3 text-fg">{b.name}</td>
                  <td className="p-3 text-fg-muted">
                    {b.email}
                    {b.phone ? ` · ${b.phone}` : ""}
                  </td>
                  <td className="max-w-[14rem] truncate p-3 text-fg-muted">{b.note}</td>
                  <td className="p-3">
                    <StatusBadge status={b.status} />
                  </td>
                  <td className="whitespace-nowrap p-3">
                    {b.status !== "confirmed" ? (
                      <button
                        onClick={() => setStatus(b.id, "confirmed")}
                        className="mr-3 font-mono text-[11px] text-accent hover:underline"
                      >
                        {t.bookings.confirm}
                      </button>
                    ) : null}
                    {b.status !== "cancelled" ? (
                      <button
                        onClick={() => setStatus(b.id, "cancelled")}
                        className="font-mono text-[11px] text-fg-muted hover:text-fg"
                      >
                        {t.bookings.cancel}
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableFrame>

      <TableHeading>{t.customers.heading}</TableHeading>
      <TableFrame>
        <table className="w-full text-left text-sm">
          <Head cells={t.customers.cols} />
          <tbody>
            {customers.length === 0 ? (
              <Empty span={4}>{t.customers.empty}</Empty>
            ) : (
              customers.map((c) => (
                <tr key={c.email} className="border-b border-border/60 last:border-0">
                  <td className="p-3 text-fg">{c.email}</td>
                  <td className="p-3 text-fg-muted">{c.phone ?? t.empty}</td>
                  <td className="p-3 text-accent">{c.bonuses} pts</td>
                  <td className="p-3 font-mono text-[11px] text-fg-muted">
                    {new Date(c.lastVisited).toLocaleString(dateFormat)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableFrame>
    </div>
  );
}

function TableHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 flex items-center gap-2.5 font-mono text-[10px] uppercase text-accent">
      <span aria-hidden className="h-1.5 w-1.5 rotate-45 bg-accent" />
      {children}
    </h2>
  );
}

function TableFrame({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("overflow-x-auto rounded-[var(--radius-card)] bg-bg-card shadow-node", className)}>
      {children}
    </div>
  );
}

function Head({ cells }: { cells: string[] }) {
  return (
    <thead className="border-b border-border font-mono text-[10px] uppercase text-fg-muted">
      <tr>
        {cells.map((h, i) => (
          <th key={`${h}-${i}`} className="p-3 font-normal">
            {h}
          </th>
        ))}
      </tr>
    </thead>
  );
}

function Empty({ span, children }: { span: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={span} className="p-6 text-center text-fg-muted">
        {children}
      </td>
    </tr>
  );
}

function StatusBadge({ status }: { status: Booking["status"] }) {
  const label = t.bookings.status[status];
  return (
    <span
      className={cn(
        "rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase",
        status === "confirmed" && "border-accent/50 text-accent",
        status === "pending" && "border-border text-fg-muted",
        status === "cancelled" && "border-red-500/40 text-red-400",
      )}
    >
      {label}
    </span>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen items-center justify-center p-6">{children}</div>;
}
