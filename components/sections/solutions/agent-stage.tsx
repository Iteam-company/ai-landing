import * as React from "react";
import { Panel, PanelBar, Chip } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { SolutionsAmbientBackground } from "./solutions-ambient-background";
import {
  AgentStageFlow,
  STAGE_INTERVAL_MS,
  FINAL_PAUSE_MS,
  type FlowPhase,
} from "./agent-stage-flow";
import type { Solution } from "@/content/types";

export function AgentStage({
  item,
  count,
  panelId,
  tabId,
  phase,
  stageKey,
}: {
  item: Solution;
  count: number;
  panelId: string;
  tabId: string;
  phase: FlowPhase;
  stageKey: string;
}) {
  const stageCount = item.demo.stages.length;
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
      className="relative mt-6 overflow-hidden"
    >
      <SolutionsAmbientBackground />

      <React.Fragment key={stageKey}>
        <PanelBar label={item.demo.caption} live className="relative z-10">
          <span className="ml-auto font-mono text-[10px] uppercase text-fg-muted/70">
            {item.index} / {String(count).padStart(2, "0")}
          </span>
        </PanelBar>

        <div className="relative z-10 grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_minmax(240px,300px)] lg:gap-10">
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
      </React.Fragment>
    </Panel>
  );
}
