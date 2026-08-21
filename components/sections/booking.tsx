"use client";

import * as React from "react";
import { Container, Section, SectionHeading } from "@/components/ui/container";
import { Panel, PanelBar } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";
import type { SiteContent, Ui } from "@/content/types";
import { INTL_LOCALE, type Locale } from "@/lib/lang";

// Business Calendar — a self-hosted slot picker. Feature: "calendar".
// Posts to the server route POST /api/bookings (present only in backend builds).
// Fields: name, email, phone?, note, date, time. This is the site's only
// booking flow (see the "Book a call" CTAs in header.tsx/hero.tsx, which
// link here).

const TIME_SLOTS = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

/** Which TIME_SLOTS are already taken for a given date — the availability endpoint is a UX nicety, not the source of truth (that's the uniq_active_slot index). */
function fetchBookedTimes(date: string): Promise<string[]> {
  return fetch(`/api/bookings/availability?date=${encodeURIComponent(date)}`)
    .then((res) => (res.ok ? res.json() : { bookedTimes: [] }))
    .then((data: { bookedTimes?: string[] }) => data.bookedTimes ?? [])
    .catch(() => []);
}

/** The next `count` week-days as { value: ISO date, label } options. */
function upcomingDays(count: number, locale: Locale): { value: string; label: string }[] {
  const out: { value: string; label: string }[] = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  while (out.length < count) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day === 0 || day === 6) continue; // skip weekends
    out.push({
      value: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString(INTL_LOCALE[locale], {
        weekday: "short",
        day: "numeric",
        month: "short",
      }),
    });
  }
  return out;
}

/** False during SSR / first client render, true after hydration — no setState-in-effect. */
function useHydrated(): boolean {
  return React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function Booking({
  content,
  ui,
  locale,
}: {
  content: SiteContent["booking"];
  ui: Ui["booking"];
  locale: Locale;
}) {
  // Days are computed only on the client so build-time and view-time dates can't
  // mismatch on hydration (the server renders an empty grid, then it fills in).
  const hydrated = useHydrated();
  const days = React.useMemo(
    () => (hydrated ? upcomingDays(8, locale) : []),
    [hydrated, locale],
  );
  const [picked, setPicked] = React.useState("");
  const date = picked || days[0]?.value || "";
  const [time, setTime] = React.useState(TIME_SLOTS[0]);
  const [bookedTimes, setBookedTimes] = React.useState<string[]>([]);
  const [status, setStatus] = React.useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = React.useState("");

  // If the picked time got taken out from under the visitor (fresh
  // availability, or right after a 409), the stale pick is simply not used —
  // no separate effect needed to "reset" it.
  const selectedTime = bookedTimes.includes(time) ? "" : time;

  React.useEffect(() => {
    if (!date) return;
    let active = true;
    fetchBookedTimes(date).then((times) => {
      if (active) setBookedTimes(times);
    });
    return () => {
      active = false;
    };
  }, [date]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          phone: form.get("phone"),
          note: form.get("note"),
          date,
          time: selectedTime,
          locale,
        }),
      });
      if (res.status === 409) {
        setStatus("error");
        setError(ui.slotTaken);
        setTime("");
        setBookedTimes(await fetchBookedTimes(date));
        return;
      }
      // The route answers in English (it is developer-facing), so the block shows
      // its own localized copy instead of the response body.
      if (!res.ok) throw new Error(ui.failed);
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : ui.failed);
    }
  }

  return (
    <Section id="booking" className="border-t border-border">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow={content.eyebrow}
            title={content.title}
            subtitle={content.subtitle}
          />
        </Reveal>

        <Reveal delay={0.1} className="mt-14">
          {status === "done" ? (
            <Panel className="p-8">
              <p className="text-[15px] leading-relaxed text-accent">{content.success}</p>
            </Panel>
          ) : (
            <Panel className="overflow-hidden">
              <PanelBar label="booking · slots" live />
              <form onSubmit={onSubmit} className="grid gap-8 p-6 sm:p-8 lg:grid-cols-2 lg:gap-10">
                {/* Left: date + time pickers */}
                <div className="space-y-7">
                  <Field label={ui.date}>
                    <div className="flex flex-wrap gap-2">
                      {days.map((d) => (
                        <Chip key={d.value} active={d.value === date} onClick={() => setPicked(d.value)}>
                          {d.label}
                        </Chip>
                      ))}
                    </div>
                  </Field>
                  <Field label={ui.time}>
                    <div className="flex flex-wrap gap-2">
                      {TIME_SLOTS.map((t) => (
                        <Chip
                          key={t}
                          active={t === selectedTime}
                          disabled={bookedTimes.includes(t)}
                          onClick={() => setTime(t)}
                        >
                          {t}
                        </Chip>
                      ))}
                    </div>
                  </Field>
                </div>

                {/* Right: contact fields */}
                <div className="space-y-3.5">
                  <input name="name" placeholder={ui.name} required autoComplete="name" className={inputClass} />
                  <input name="email" type="email" placeholder={ui.email} required autoComplete="email" className={inputClass} />
                  <input name="phone" type="tel" placeholder={ui.phone} autoComplete="tel" className={inputClass} />
                  <textarea
                    name="note"
                    placeholder={ui.note}
                    rows={3}
                    className={cn(inputClass, "resize-y")}
                  />
                  {status === "error" ? (
                    <p className="font-mono text-[11px] text-red-400">{error}</p>
                  ) : null}
                  <Button
                    type="submit"
                    size="lg"
                    disabled={status === "sending" || !selectedTime}
                    className="w-full"
                  >
                    {status === "sending" ? ui.sending : content.cta}
                  </Button>
                </div>
              </form>
            </Panel>
          )}
        </Reveal>
      </Container>
    </Section>
  );
}

const inputClass =
  "w-full rounded-[var(--radius-input)] border border-border bg-bg px-4 py-3.5 text-[15px] text-fg placeholder:text-fg-muted/60 outline-none transition-colors focus:border-accent/60";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-3.5 font-mono text-[10px] uppercase text-fg-muted">{label}</p>
      {children}
    </div>
  );
}

function Chip({
  active,
  disabled,
  children,
  onClick,
}: {
  active: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      className={cn(
        "rounded-full border px-3.5 py-2 font-mono text-[11px] transition-all",
        disabled
          ? "cursor-not-allowed border-border/50 bg-bg text-fg-muted/40"
          : active
            ? "border-accent bg-accent text-accent-fg"
            : "border-border bg-bg text-fg-muted hover:border-accent/50 hover:text-fg",
      )}
    >
      {children}
    </button>
  );
}
