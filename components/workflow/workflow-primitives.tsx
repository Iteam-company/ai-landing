import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import type { WorkflowDataPoint } from "@/content/types";

export type WorkflowStageState = "pending" | "active" | "completed";

export function WorkflowStage({
  eyebrow,
  state,
  children,
  className,
}: {
  eyebrow: string;
  state?: WorkflowStageState;
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <div className={cn("relative", className)}>
      <p
        className={cn(
          "font-mono text-[10px] uppercase tracking-tight",
          !reduce && "transition-colors duration-300",
          state === "pending"
            ? "text-fg-muted/45"
            : state === "active"
              ? "text-accent"
              : "text-fg-muted",
        )}
      >
        {eyebrow}
      </p>
      <div
        className={cn(
          "mt-2",
          !reduce && "transition-opacity duration-300",
          state === "pending" && "opacity-40",
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function WorkflowConnector({
  signal,
  className,
}: {
  signal?: boolean;
  className?: string;
}) {
  return (
    <div aria-hidden className={cn("flex min-h-4 flex-1 items-center justify-center pl-[3px]", className)}>
      <span className="relative h-full border-l border-dashed border-accent/50">
        {signal ? (
          <span className="absolute left-[-3.5px] top-0 h-1.75 w-1.75 rounded-full bg-accent animate-connector-signal" />
        ) : null}
      </span>
    </div>
  );
}

export function WorkflowDataRow({
  point,
  visible = true,
}: {
  point: WorkflowDataPoint;
  visible?: boolean;
}) {
  const reduce = useReducedMotion();
  return (
    <div
      className={cn(
        "flex items-baseline justify-between gap-4 border-b border-border/60 py-1.5 last:border-b-0",
        !reduce && "transition-all duration-300 ease-out",
        visible ? "opacity-100" : "opacity-0 translate-y-1.5",
      )}
    >
      <dt className="font-mono text-[10px] uppercase text-fg-muted">{point.label}</dt>
      <dd
        className={cn(
          "font-display text-sm font-semibold tracking-tight",
          point.emphasis ? "text-accent" : "text-fg",
        )}
      >
        {point.value}
      </dd>
    </div>
  );
}

export function WorkflowDataList({
  points,
  revealedCount,
}: {
  points: WorkflowDataPoint[];
  revealedCount?: number;
}) {
  return (
    <dl>
      {points.map((point, i) => (
        <WorkflowDataRow
          key={point.label}
          point={point}
          visible={revealedCount === undefined || i < revealedCount}
        />
      ))}
    </dl>
  );
}

export function WorkflowChecklist({
  items,
  revealedCount,
}: {
  items: string[];
  revealedCount?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((item, i) => {
        const visible = revealedCount === undefined || i < revealedCount;
        return (
          <li
            key={item}
            className={cn(
              "flex items-center gap-2 text-[13px] leading-snug text-fg",
              !reduce && "transition-all duration-300 ease-out",
              visible ? "opacity-100" : "opacity-0 translate-y-1.5",
            )}
          >
            <Check aria-hidden size={13} strokeWidth={2.5} className="shrink-0 text-accent" />
            {item}
          </li>
        );
      })}
    </ul>
  );
}

export function WorkflowQuote({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "border-l-2 border-accent/40 pl-2.5 text-[13px] leading-snug text-fg-muted",
        className,
      )}
    >
      “{children}”
    </p>
  );
}

export function WorkflowReveal({
  visible,
  children,
  className,
}: {
  visible: boolean;
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <div
      className={cn(
        !reduce && "transition-all duration-300 ease-out",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1.5",
        className,
      )}
    >
      {children}
    </div>
  );
}
