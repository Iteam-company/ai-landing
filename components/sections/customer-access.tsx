"use client";

import * as React from "react";
import { Container, Section, SectionHeading } from "@/components/ui/container";
import { Panel, PanelBar } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";
import type { SiteContent } from "@/content/site";

// Customer accounts — sign in / up portal. Feature: "customers".
// Talks to the server routes under /api/auth/* (present only in backend builds).

interface Profile {
  email: string;
  phone?: string;
  bonuses: number;
  lastVisited: string;
}

const inputClass =
  "w-full rounded-[var(--radius-input)] border border-border bg-bg px-4 py-3.5 text-[15px] text-fg placeholder:text-fg-muted/60 outline-none transition-colors focus:border-accent/60";

export function CustomerAccess({ content }: { content: SiteContent["customers"] }) {
  const [mode, setMode] = React.useState<"login" | "signup">("login");
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");

  // Resume an existing session on mount.
  React.useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.customer && setProfile(d.customer))
      .catch(() => {});
  }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
          phone: form.get("phone") || undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Что-то пошло не так.");
      }
      const me = await fetch("/api/auth/me").then((r) => r.json());
      setProfile(me.customer);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Что-то пошло не так.");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setProfile(null);
  }

  return (
    <Section id="portal" className="border-t border-border bg-bg-soft/40">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow={content.eyebrow}
            title={content.title}
            subtitle={content.subtitle}
          />
        </Reveal>

        <Reveal delay={0.1} className="mt-14 max-w-md">
          <Panel className="overflow-hidden">
            <PanelBar label="client · portal" live={Boolean(profile)} />
            <div className="p-6 sm:p-7">
              {profile ? (
                <div className="space-y-4">
                  <Row label="аккаунт" value={profile.email} />
                  <Row label="бонусы" value={`${profile.bonuses} pts`} accent />
                  <Row
                    label="последний вход"
                    value={new Date(profile.lastVisited).toLocaleString("ru-RU")}
                  />
                  <Button variant="secondary" className="w-full" onClick={logout}>
                    Выйти
                  </Button>
                </div>
              ) : (
                <>
                  <div className="mb-6 flex gap-2">
                    <Tab active={mode === "login"} onClick={() => setMode("login")}>
                      Вход
                    </Tab>
                    <Tab active={mode === "signup"} onClick={() => setMode("signup")}>
                      Регистрация
                    </Tab>
                  </div>
                  <form onSubmit={submit} className="space-y-3.5">
                    <input name="email" type="email" required placeholder="Email" autoComplete="email" className={inputClass} />
                    <input
                      name="password"
                      type="password"
                      required
                      placeholder={mode === "signup" ? "Пароль (минимум 8 символов)" : "Пароль"}
                      autoComplete={mode === "signup" ? "new-password" : "current-password"}
                      className={inputClass}
                    />
                    {mode === "signup" ? (
                      <input name="phone" type="tel" placeholder="Телефон (необязательно)" autoComplete="tel" className={inputClass} />
                    ) : null}
                    {error ? <p className="font-mono text-[11px] text-red-400">{error}</p> : null}
                    <Button type="submit" size="lg" className="w-full" disabled={busy}>
                      {busy ? "…" : mode === "login" ? "Войти" : "Создать аккаунт"}
                    </Button>
                  </form>
                </>
              )}
            </div>
          </Panel>
        </Reveal>
      </Container>
    </Section>
  );
}

function Tab({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 rounded-full border px-3 py-2.5 font-mono text-[11px] uppercase transition-all",
        active ? "border-accent bg-accent text-accent-fg" : "border-border bg-bg text-fg-muted hover:text-fg",
      )}
    >
      {children}
    </button>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border pb-3 last:border-0">
      <span className="font-mono text-[10px] uppercase text-fg-muted">{label}</span>
      <span className={cn("text-sm", accent ? "text-accent" : "text-fg")}>{value}</span>
    </div>
  );
}
