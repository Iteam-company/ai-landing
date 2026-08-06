"use client";

import * as React from "react";
import { Send, CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { leadEndpoint, submitLead, type LeadMessages } from "@/lib/leads";
import { cn } from "@/lib/utils";
import type { Site } from "@/content/types";
import type { Locale } from "@/lib/lang";

const fieldClass =
  "w-full rounded-[var(--radius-input)] border border-border bg-bg px-4 py-3.5 text-[15px] text-fg placeholder:text-fg-muted/60 outline-none transition-colors focus:border-accent/60";

export function LeadForm({
  content,
  messages,
  locale,
}: {
  content: Site["contact"]["form"];
  messages: LeadMessages;
  locale: Locale;
}) {
  const endpoint = leadEndpoint();
  const [status, setStatus] = React.useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = React.useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setStatus("sending");
    setError("");
    try {
      await submitLead(
        {
          name: String(form.get("name") ?? ""),
          contact: String(form.get("contact") ?? ""),
          task: String(form.get("task") ?? "") || undefined,
          source: "contact-form",
          locale,
        },
        messages,
      );
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : messages.failed);
    }
  }

  if (status === "done") {
    return (
      <div className="flex min-h-[18rem] flex-col items-start justify-center gap-4 rounded-[var(--radius-input)] border border-accent/40 bg-bg/40 p-8">
        <CircleCheck size={26} className="text-accent" />
        <p className="text-[15px] leading-relaxed text-fg text-pretty">{content.success}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3.5">
      <input
        name="name"
        required
        autoComplete="name"
        placeholder={content.name}
        className={fieldClass}
      />
      <input
        name="contact"
        required
        autoComplete="email"
        placeholder={content.contact}
        className={fieldClass}
      />
      <textarea
        name="task"
        rows={4}
        placeholder={content.task}
        className={cn(fieldClass, "resize-y")}
      />

      {status === "error" ? (
        <p className="font-mono text-[11px] text-red-400">{error}</p>
      ) : null}

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={status === "sending" || !endpoint}
      >
        <Send size={16} />
        {status === "sending" ? content.sending : content.submit}
      </Button>

      <p className="font-mono text-[10px] uppercase leading-relaxed text-fg-muted/70">
        {endpoint ? content.consent : content.disabled}
      </p>
    </form>
  );
}
