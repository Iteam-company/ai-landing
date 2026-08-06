import { Panel, PanelBar, Chip } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  AgentStageFlow,
  STAGE_INTERVAL_MS,
  FINAL_PAUSE_MS,
  type FlowPhase,
} from "./agent-stage-flow";
import type { Solution } from "@/content/types";

// The single large "mockup" panel — whichever agent is active. Two columns on
// desktop (the stage sequence, then the result/description/tags), one column
// stacked on mobile. Reused chrome: Panel + PanelBar (same console-panel
// language as Hero's flow diagram and Showcase's pipeline demo) — a plain
// `bg-bg-card` surface, the same flat panel background every other Panel on
// the site uses (Pains' cards included). No extra background layer.

export function AgentStage({
  item,
  count,
  panelId,
  tabId,
  phase,
}: {
  item: Solution;
  count: number;
  panelId: string;
  tabId: string;
  phase: FlowPhase;
}) {
  const stageCount = item.demo.stages.length;
  // Light, optional polish on the secondary text — off the same clock as the
  // stage flow, no extra React state. Name/title stay visible immediately
  // regardless of phase (the value proposition is never gated on the demo).
  const playing = phase === "playing";
  const done = phase === "done";
  const descriptionDelay = 2 * STAGE_INTERVAL_MS;
  const tagsDelay = (stageCount - 1) * STAGE_INTERVAL_MS + FINAL_PAUSE_MS;

  return (
    <Panel
      id={panelId}
      role="tabpanel"
      aria-labelledby={tabId}
      tabIndex={0}
      className="mt-6 overflow-hidden"
    >
      <PanelBar label={item.demo.caption} live>
        <span className="ml-auto font-mono text-[10px] uppercase text-fg-muted/70">
          {item.index} / {String(count).padStart(2, "0")}
        </span>
      </PanelBar>

      <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_minmax(240px,300px)] lg:gap-10">
        <AgentStageFlow stages={item.demo.stages} ariaLabel={item.demo.ariaLabel} phase={phase} />

        <div className="flex flex-col gap-4 border-t border-border pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
          <span className="font-mono text-[10px] uppercase text-fg-muted">{item.name}</span>
          <h3 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
            {item.title}
          </h3>
          <p
            className={cn(
              "text-[15px] leading-relaxed text-fg-muted text-pretty",
              !done && "opacity-0",
              done && "opacity-100",
            )}
            style={
              playing
                ? {
                    animationName: "stage-fade-in",
                    animationDuration: "400ms",
                    animationDelay: `${descriptionDelay}ms`,
                    animationTimingFunction: "ease-out",
                    animationFillMode: "forwards",
                  }
                : undefined
            }
          >
            {item.description}
          </p>
          <div
            className={cn(
              "mt-auto flex flex-wrap gap-2 pt-2",
              !done && "opacity-0",
              done && "opacity-100",
            )}
            style={
              playing
                ? {
                    animationName: "stage-fade-in",
                    animationDuration: "400ms",
                    animationDelay: `${tagsDelay}ms`,
                    animationTimingFunction: "ease-out",
                    animationFillMode: "forwards",
                  }
                : undefined
            }
          >
            {item.tags.map((tag) => (
              <Chip key={tag}>{tag}</Chip>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
}
