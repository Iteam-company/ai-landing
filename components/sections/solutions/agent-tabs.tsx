"use client";

import * as React from "react";
import { Radar, Bot, Library, Workflow, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Solution, SolutionIcon } from "@/content/types";

const ICONS: Record<SolutionIcon, LucideIcon> = {
  radar: Radar,
  bot: Bot,
  library: Library,
  workflow: Workflow,
};

export function AgentTabs({
  items,
  activeId,
  onSelect,
  label,
  panelId,
  tabIdFor,
}: {
  items: Solution[];
  activeId: string;
  onSelect: (id: string) => void;
  /** Tablist aria-label, e.g. "AI agents". */
  label: string;
  /** id of the single shared tabpanel every tab controls. */
  panelId: string;
  tabIdFor: (id: string) => string;
}) {
  const tabRefs = React.useRef<(HTMLButtonElement | null)[]>([]);

  function move(from: number, key: string) {
    const count = items.length;
    let next: number | null = null;
    switch (key) {
      case "ArrowRight":
        next = (from + 1) % count;
        break;
      case "ArrowLeft":
        next = (from - 1 + count) % count;
        break;
      case "ArrowDown":
        next = (from + 2) % count;
        break;
      case "ArrowUp":
        next = (from - 2 + count) % count;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = count - 1;
        break;
      default:
        return;
    }
    onSelect(items[next].id);
    tabRefs.current[next]?.focus();
  }

  return (
    <div
      role="tablist"
      aria-label={label}
      className="grid grid-cols-2 gap-2 lg:flex lg:gap-0 lg:overflow-hidden lg:rounded-input lg:border lg:border-border lg:divide-x lg:divide-border"
    >
      {items.map((item, i) => {
        const Icon = ICONS[item.icon];
        const active = item.id === activeId;
        return (
          <button
            key={item.id}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            id={tabIdFor(item.id)}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls={panelId}
            tabIndex={active ? 0 : -1}
            onClick={() => onSelect(item.id)}
            onKeyDown={(e) => {
              if (
                e.key === "ArrowRight" ||
                e.key === "ArrowLeft" ||
                e.key === "ArrowUp" ||
                e.key === "ArrowDown" ||
                e.key === "Home" ||
                e.key === "End"
              ) {
                e.preventDefault();
                move(i, e.key);
              }
            }}
            className={cn(
              "group relative flex items-center gap-2.5 rounded-input border border-border px-3.5 py-3 text-left transition-colors lg:flex-1 lg:rounded-none lg:border-0 lg:px-4 lg:py-3.5",
              active
                ? "border-accent/50 bg-accent/5 lg:bg-accent/[0.06]"
                : "hover:border-accent/25 lg:hover:bg-fg/[0.03]",
            )}
          >
            <Icon
              aria-hidden
              size={15}
              strokeWidth={1.75}
              className={cn("shrink-0 transition-colors", active ? "text-accent" : "text-fg-muted")}
            />
            <span
              className={cn(
                "font-mono text-[9px] transition-colors",
                active ? "text-accent" : "text-fg-muted/50",
              )}
            >
              {item.index}
            </span>
            <span
              className={cn(
                "min-w-0 text-[13px] font-medium leading-snug transition-colors lg:truncate",
                active ? "text-fg" : "text-fg-muted",
              )}
            >
              {item.name}
            </span>
            <span
              aria-hidden
              className={cn(
                "absolute inset-x-0 bottom-0 hidden h-0.5 bg-accent transition-opacity lg:block",
                active ? "opacity-100" : "opacity-0",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
