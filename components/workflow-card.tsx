import { Panel, PanelBar } from "@/components/ui/card";
import { WorkflowScenarioBody } from "@/components/workflow/workflow-scenario-body";
import { cn } from "@/lib/utils";
import type { HeroWorkflowContent } from "@/content/types";

export interface WorkflowCardProps {
  label: string;
  status: string;
  workflow: HeroWorkflowContent;
  className?: string;
  active?: boolean;
}

const BODY_HEIGHT = "h-[532px] lg:h-[548px]";

export function WorkflowCard({ label, status, workflow, className, active = true }: WorkflowCardProps) {
  return (
    <Panel data-active={active} className={cn("overflow-hidden", className)}>
      <PanelBar label={label} live>
        <span className="ml-auto font-mono text-[10px] uppercase text-fg-muted/70">
          live
        </span>
      </PanelBar>
      <div className={cn("workflow-grid relative p-5 sm:p-7", BODY_HEIGHT)}>
        <WorkflowScenarioBody workflow={workflow} active={active} />
      </div>
      <div className="border-t border-border px-5 py-3">
        <p className="font-mono text-[10px] uppercase leading-relaxed text-fg-muted">
          {status}
        </p>
      </div>
    </Panel>
  );
}
