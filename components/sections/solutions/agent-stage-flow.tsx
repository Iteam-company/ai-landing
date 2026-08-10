"use client";

import { CircleCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SolutionStage } from "@/content/types";


export const STAGE_INTERVAL_MS = 1300;
export const FINAL_PAUSE_MS = 450;
const STAGE_ENTER_MS = 380;
const DETAIL_DELAY_MS = 170;
const DETAIL_ENTER_MS = 320;
const DETAIL_TYPE_MS = 780;
const CONNECTOR_DELAY_MS = 520;
const CONNECTOR_DURATION_MS = 480;
const NODE_SETTLE_MS = 320;

export type FlowPhase =
  | "pending"
  | "playing"
  | "done";

export function AgentStageFlow({
  stages,
  ariaLabel,
  phase,
}: {
  stages: SolutionStage[];
  ariaLabel: string;
  phase: FlowPhase;
}) {
  return (
    <ol aria-label={ariaLabel} className="relative flex flex-col">
      {stages.map((stage, i) => {
        const isLast = i === stages.length - 1;
        const start = i * STAGE_INTERVAL_MS + (isLast ? FINAL_PAUSE_MS : 0);
        const detailDelay = start + DETAIL_DELAY_MS;
        const connectorDelay = start + CONNECTOR_DELAY_MS;
        const settleDelay = connectorDelay + CONNECTOR_DURATION_MS;

        const playing = phase === "playing";
        const done = phase === "done";

        return (
          <li key={stage.id} className="relative flex gap-4 pb-7 last:pb-0">
            <div className="relative flex w-4 shrink-0 flex-col items-center">
              <span
                aria-hidden
                className={cn(
                  "grid h-4 w-4 shrink-0 place-items-center rounded-full border border-border",
                  done && "border-accent bg-accent",
                )}
                style={
                  playing
                    ? {
                        animationName: "stage-node-enter, stage-node-settle",
                        animationDuration: `${STAGE_ENTER_MS}ms, ${NODE_SETTLE_MS}ms`,
                        animationDelay: `${start}ms, ${settleDelay}ms`,
                        animationTimingFunction: "ease-out",
                        animationFillMode: "forwards",
                      }
                    : undefined
                }
              >
                {isLast ? (
                  <CircleCheck
                    aria-hidden
                    size={11}
                    strokeWidth={2.5}
                    className={cn("text-accent-fg", !done && "opacity-0", done && "opacity-100")}
                    style={
                      playing
                        ? {
                            animationName: "stage-icon-in",
                            animationDuration: "250ms",
                            animationDelay: `${start + 120}ms`,
                            animationTimingFunction: "ease-out",
                            animationFillMode: "forwards",
                          }
                        : undefined
                    }
                  />
                ) : null}
              </span>

              {!isLast ? (
                <span aria-hidden className="mt-0.5 w-px flex-1 bg-border">
                  <span
                    className={cn(
                      "block h-full w-full origin-top bg-accent",
                      !done && "scale-y-0",
                      done && "scale-y-100",
                    )}
                    style={
                      playing
                        ? {
                            animationName: "stage-rail-in",
                            animationDuration: `${CONNECTOR_DURATION_MS}ms`,
                            animationDelay: `${connectorDelay}ms`,
                            animationTimingFunction: "ease-out",
                            animationFillMode: "forwards",
                          }
                        : undefined
                    }
                  />
                </span>
              ) : null}
            </div>

            <div className="-mt-0.5 min-w-0 flex-1">
              <div
                className={cn(
                  "flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5",
                  !done && "opacity-0",
                  done && "opacity-100",
                )}
                style={
                  playing
                    ? {
                        animationName: "stage-fade-in",
                        animationDuration: `${STAGE_ENTER_MS}ms`,
                        animationDelay: `${start}ms`,
                        animationTimingFunction: "ease-out",
                        animationFillMode: "forwards",
                      }
                    : undefined
                }
              >
                <h4 className="font-display text-[15px] font-semibold tracking-tight text-fg">
                  {stage.label}
                </h4>
                <span className="font-mono text-[9px] uppercase text-fg-muted/50">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>

              <p
                className={cn(
                  "mt-1 text-[13px] leading-relaxed text-fg-muted",
                  !done && !(playing && stage.typing) && "opacity-0",
                  (done || (playing && stage.typing)) && "opacity-100",
                )}
                style={
                  playing && !stage.typing
                    ? {
                        animationName: "stage-fade-in",
                        animationDuration: `${DETAIL_ENTER_MS}ms`,
                        animationDelay: `${detailDelay}ms`,
                        animationTimingFunction: "ease-out",
                        animationFillMode: "forwards",
                      }
                    : undefined
                }
              >
                {stage.typing && playing ? (
                  <span
                    className="animate-stage-type"
                    style={{ animationDuration: `${DETAIL_TYPE_MS}ms`, animationDelay: `${detailDelay}ms` }}
                  >
                    {stage.detail}
                  </span>
                ) : (
                  stage.detail
                )}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
