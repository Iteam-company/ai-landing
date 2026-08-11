import * as React from "react";
import { Check } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { Chip } from "@/components/ui/card";
import {
  CrmWorkflowPaths,
  useCrmPathMetrics,
  type CrmConnectorPhase,
} from "@/components/workflow/crm-workflow-paths";
import {
  EmailWorkflowPaths,
  useEmailPathMetrics,
  type EmailConnectorPhase,
} from "@/components/workflow/email-workflow-paths";
import {
  KnowledgeWorkflowPaths,
  useKnowledgePathMetrics,
  type KnowledgeConnectorPhase,
} from "@/components/workflow/knowledge-workflow-paths";
import {
  LeadWorkflowPaths,
  useLeadPathMetrics,
  type LeadConnectorPhase,
} from "@/components/workflow/lead-workflow-paths";
import {
  WorkflowQuote,
  WorkflowReveal,
  type WorkflowStageState,
} from "@/components/workflow/workflow-primitives";
import { cn } from "@/lib/utils";
import type {
  CrmWorkflowContent,
  EmailWorkflowContent,
  HeroWorkflowContent,
  KnowledgeWorkflowContent,
  LeadWorkflowContent,
  WorkflowDataPoint,
} from "@/content/types";

const LEAD_STEP = {
  INPUT: 1,
  SIGNAL_1: 2,
  ANALYSIS_ACTIVE: 3,
  ANALYSIS_ROW_1: 4,
  ANALYSIS_ROW_2: 5,
  ANALYSIS_ROW_3: 6,
  ANALYSIS_ROW_4: 7,
  SIGNAL_2: 8,
  QUALIFIED_ACTIVE: 9,
  QUALIFIED_VALUE: 10,
  SIGNAL_3: 11,
  ACTION_ACTIVE: 12,
  ACTION_ITEM_1: 13,
  ACTION_ITEM_2: 14,
  ACTION_ITEM_3: 15,
  COMPLETED: 16,
} as const;

const REVEAL_MS = 260;
const ROW_STAGGER_MS = 130;
const ACTION_STAGGER_MS = 180;
const SIGNAL_MS = 440;

const LEAD_STEP_DELAYS: Record<number, number> = (() => {
  const d: Record<number, number> = {};
  d[LEAD_STEP.INPUT] = 300;
  d[LEAD_STEP.SIGNAL_1] = d[LEAD_STEP.INPUT] + REVEAL_MS + 260;
  d[LEAD_STEP.ANALYSIS_ACTIVE] = d[LEAD_STEP.SIGNAL_1] + SIGNAL_MS;
  d[LEAD_STEP.ANALYSIS_ROW_1] = d[LEAD_STEP.ANALYSIS_ACTIVE];
  d[LEAD_STEP.ANALYSIS_ROW_2] = d[LEAD_STEP.ANALYSIS_ROW_1] + ROW_STAGGER_MS;
  d[LEAD_STEP.ANALYSIS_ROW_3] = d[LEAD_STEP.ANALYSIS_ROW_2] + ROW_STAGGER_MS;
  d[LEAD_STEP.ANALYSIS_ROW_4] = d[LEAD_STEP.ANALYSIS_ROW_3] + ROW_STAGGER_MS;
  d[LEAD_STEP.SIGNAL_2] = d[LEAD_STEP.ANALYSIS_ROW_4] + REVEAL_MS + 160;
  d[LEAD_STEP.QUALIFIED_ACTIVE] = d[LEAD_STEP.SIGNAL_2] + SIGNAL_MS;
  d[LEAD_STEP.QUALIFIED_VALUE] = d[LEAD_STEP.QUALIFIED_ACTIVE];
  d[LEAD_STEP.SIGNAL_3] = d[LEAD_STEP.QUALIFIED_VALUE] + 280 + 160;
  d[LEAD_STEP.ACTION_ACTIVE] = d[LEAD_STEP.SIGNAL_3] + SIGNAL_MS;
  d[LEAD_STEP.ACTION_ITEM_1] = d[LEAD_STEP.ACTION_ACTIVE];
  d[LEAD_STEP.ACTION_ITEM_2] = d[LEAD_STEP.ACTION_ITEM_1] + ACTION_STAGGER_MS;
  d[LEAD_STEP.ACTION_ITEM_3] = d[LEAD_STEP.ACTION_ITEM_2] + ACTION_STAGGER_MS;
  d[LEAD_STEP.COMPLETED] = d[LEAD_STEP.ACTION_ITEM_3] + REVEAL_MS + 170;
  return d;
})();

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function deriveLeadPhase(step: number) {
  const inputState: WorkflowStageState = step >= LEAD_STEP.SIGNAL_1 ? "completed" : "active";
  const analysisState: WorkflowStageState =
    step < LEAD_STEP.ANALYSIS_ACTIVE ? "pending" : step >= LEAD_STEP.SIGNAL_2 ? "completed" : "active";
  const qualifiedState: WorkflowStageState =
    step < LEAD_STEP.QUALIFIED_ACTIVE ? "pending" : step >= LEAD_STEP.SIGNAL_3 ? "completed" : "active";
  const actionState: WorkflowStageState =
    step < LEAD_STEP.ACTION_ACTIVE ? "pending" : step >= LEAD_STEP.COMPLETED ? "completed" : "active";

  return {
    inputState,
    inputRevealed: step >= LEAD_STEP.INPUT,
    signal1: step === LEAD_STEP.SIGNAL_1,
    analysisState,
    analysisRevealed: clamp(step - LEAD_STEP.ANALYSIS_ROW_1 + 1, 0, 4),
    signal2: step === LEAD_STEP.SIGNAL_2,
    qualifiedState,
    qualifiedRevealed: step >= LEAD_STEP.QUALIFIED_VALUE,
    signal3: step === LEAD_STEP.SIGNAL_3,
    actionState,
    actionRevealed: clamp(step - LEAD_STEP.ACTION_ITEM_1 + 1, 0, 3),
  };
}

function LeadAnalysisRow({
  point,
  visible,
  reduce,
}: {
  point: WorkflowDataPoint;
  visible: boolean;
  reduce: boolean | null;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/60 py-1 last:border-b-0">
      <dt className="font-mono text-[10px] uppercase text-fg-muted">{point.label}</dt>
      <dd
        className={cn(
          "font-display text-sm font-semibold tracking-tight",
          !reduce && "transition-colors duration-300 ease-out",
          visible ? (point.emphasis ? "text-accent" : "text-fg") : "text-fg-muted/40",
        )}
      >
        {visible ? point.value : "···"}
      </dd>
    </div>
  );
}

function LeadActionItem({
  item,
  done,
  reduce,
}: {
  item: string;
  done: boolean;
  reduce: boolean | null;
}) {
  return (
    <li className="flex items-center gap-2 text-[13px] leading-snug">
      <span
        aria-hidden
        className={cn(
          "grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full border",
          !reduce && "transition-colors duration-200 ease-out",
          done ? "border-accent bg-accent" : "border-border",
        )}
      >
        <Check
          size={9}
          strokeWidth={3}
          className={cn(
            "text-accent-fg",
            !reduce && "transition-all duration-200 ease-out",
            done ? "scale-100 opacity-100" : "scale-0 opacity-0",
          )}
        />
      </span>
      <span
        className={cn(
          !reduce && "transition-colors duration-200 ease-out",
          done ? "text-fg" : "text-fg-muted/50",
        )}
      >
        {item}
      </span>
    </li>
  );
}

function LeadModule({
  moduleRef,
  index,
  eyebrow,
  state,
  reduce,
  className,
  children,
}: {
  moduleRef: React.RefObject<HTMLDivElement | null>;
  index: string;
  eyebrow: string;
  state: WorkflowStageState;
  reduce: boolean | null;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      ref={moduleRef}
      className={cn(
        "relative rounded-input border py-1 pl-3.5 pr-2.5",
        !reduce && "transition-colors duration-300 ease-out",
        state === "pending" && "border-border/50 bg-bg-card",
        state === "active" &&
          "border-accent/55 bg-[color-mix(in_oklab,var(--color-accent)_6%,var(--color-bg-card))]",
        state === "completed" && "border-border bg-bg-card",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-accent",
          !reduce && "transition-opacity duration-300 ease-out",
          state === "pending" ? "opacity-25" : state === "active" ? "opacity-100" : "opacity-55",
        )}
      />
      <span
        aria-hidden
        className="absolute right-2.5 top-1.5 font-mono text-[9px] tabular-nums text-fg-muted/35"
      >
        {index}
      </span>
      <p
        className={cn(
          "font-mono text-[10px] uppercase tracking-tight",
          !reduce && "transition-colors duration-300",
          state === "pending" ? "text-fg-muted/45" : state === "active" ? "text-accent" : "text-fg-muted",
        )}
      >
        {eyebrow}
      </p>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

export function LeadWorkflowBody({
  content,
  active = true,
}: {
  content: LeadWorkflowContent;
  active?: boolean;
}) {
  const reduce = useReducedMotion();
  const [step, setStep] = React.useState(0);
  const { containerRef, stage1Ref, stage2Ref, stage3Ref, stage4Ref, metrics } = useLeadPathMetrics();

  React.useEffect(() => {
    if (!active) {
      const id = window.setTimeout(() => setStep(0), 0);
      return () => window.clearTimeout(id);
    }
    if (reduce) {
      const id = window.setTimeout(() => setStep(LEAD_STEP.COMPLETED), 0);
      return () => window.clearTimeout(id);
    }
    const timeouts = Object.values(LEAD_STEP).map((targetStep) =>
      window.setTimeout(() => setStep(targetStep), LEAD_STEP_DELAYS[targetStep]),
    );
    return () => {
      timeouts.forEach((id) => window.clearTimeout(id));
    };
  }, [active, reduce]);

  const phase = deriveLeadPhase(step);
  const scorePct = (content.qualified.score / content.qualified.scoreMax) * 100;
  const connectors: [LeadConnectorPhase, LeadConnectorPhase, LeadConnectorPhase] = [
    { signal: phase.signal1, fired: phase.analysisState !== "pending" },
    { signal: phase.signal2, fired: phase.qualifiedState !== "pending" },
    { signal: phase.signal3, fired: phase.actionState !== "pending" },
  ];

  return (
    <div ref={containerRef} className="relative isolate flex h-full flex-col">
      <LeadWorkflowPaths metrics={metrics} connectors={connectors} reduce={reduce} />

      <LeadModule
        moduleRef={stage1Ref}
        index="01"
        eyebrow={content.input.eyebrow}
        state={phase.inputState}
        reduce={reduce}
        className="w-[92%] sm:w-[84%]"
      >
        <WorkflowReveal visible={phase.inputRevealed}>
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className={cn(
                "h-1.5 w-1.5 shrink-0 rounded-full bg-accent",
                !reduce && phase.inputRevealed && "animate-lead-endpoint-pulse",
              )}
            />
            <p className="font-display text-base font-semibold text-fg">{content.input.name}</p>
          </div>
          <WorkflowQuote className="mt-1.5">{content.input.quote}</WorkflowQuote>
          <Chip className="mt-2">{content.input.source}</Chip>
        </WorkflowReveal>
      </LeadModule>

      <div aria-hidden className="min-h-2 flex-1" />

      <LeadModule
        moduleRef={stage2Ref}
        index="02"
        eyebrow={content.analysis.eyebrow}
        state={phase.analysisState}
        reduce={reduce}
        className="w-[94%] sm:w-[92%] ml-[4%] sm:ml-[8%]"
      >
        <dl>
          {content.analysis.points.map((point, i) => (
            <LeadAnalysisRow
              key={point.label}
              point={point}
              visible={i < phase.analysisRevealed}
              reduce={reduce}
            />
          ))}
        </dl>
      </LeadModule>

      <div aria-hidden className="min-h-2 flex-1" />

      <LeadModule
        moduleRef={stage3Ref}
        index="03"
        eyebrow={content.qualified.eyebrow}
        state={phase.qualifiedState}
        reduce={reduce}
        className="w-[54%] sm:w-[46%]"
      >
        <p
          className={cn(
            "font-display text-2xl font-semibold tracking-tight",
            !reduce && "transition-colors duration-300 ease-out",
            phase.qualifiedRevealed ? "text-accent" : "text-fg-muted/40",
          )}
        >
          {phase.qualifiedRevealed ? content.qualified.score : "--"}
          <span className="text-sm font-medium text-fg-muted"> / {content.qualified.scoreMax}</span>
        </p>
        <div className="mt-2 h-[2.5px] w-full max-w-28 overflow-hidden rounded-full bg-border">
          <div
            className={cn(
              "h-full rounded-full bg-accent",
              !reduce && "transition-[width] duration-700 ease-out",
            )}
            style={{ width: phase.qualifiedRevealed ? `${scorePct}%` : "0%" }}
          />
        </div>
      </LeadModule>

      <div aria-hidden className="min-h-2 flex-1" />

      <LeadModule
        moduleRef={stage4Ref}
        index="04"
        eyebrow={content.action.eyebrow}
        state={phase.actionState}
        reduce={reduce}
        className="w-[82%] sm:w-[74%] ml-[6%] sm:ml-[12%]"
      >
        <ul className="flex flex-col gap-1">
          {content.action.items.map((item, i) => (
            <LeadActionItem key={item} item={item} done={i < phase.actionRevealed} reduce={reduce} />
          ))}
        </ul>
      </LeadModule>
    </div>
  );
}

const EMAIL_STEP = {
  INPUT: 1,
  SIGNAL_1: 2,
  ROUTER_ACTIVE: 3,
  ROUTER_ROW_1: 4,
  ROUTER_ROW_2: 5,
  ROUTER_ROW_3: 6,
  SIGNAL_2: 7,
  KNOWLEDGE_ACTIVE: 8,
  KNOWLEDGE_ROW_1: 9,
  KNOWLEDGE_ROW_2: 10,
  KNOWLEDGE_ROW_3: 11,
  SIGNAL_3: 12,
  ACTION_ACTIVE: 13,
  ACTION_ITEM_1: 14,
  ACTION_ITEM_2: 15,
  ACTION_ITEM_3: 16,
  COMPLETED: 17,
} as const;

const EMAIL_REVEAL_MS = 260;
const EMAIL_ROW_STAGGER_MS = 130;
const EMAIL_ACTION_STAGGER_MS = 180;
const EMAIL_SIGNAL_MS = 440;

const EMAIL_STEP_DELAYS: Record<number, number> = (() => {
  const d: Record<number, number> = {};
  d[EMAIL_STEP.INPUT] = 300;
  d[EMAIL_STEP.SIGNAL_1] = d[EMAIL_STEP.INPUT] + EMAIL_REVEAL_MS + 260;
  d[EMAIL_STEP.ROUTER_ACTIVE] = d[EMAIL_STEP.SIGNAL_1] + EMAIL_SIGNAL_MS;
  d[EMAIL_STEP.ROUTER_ROW_1] = d[EMAIL_STEP.ROUTER_ACTIVE];
  d[EMAIL_STEP.ROUTER_ROW_2] = d[EMAIL_STEP.ROUTER_ROW_1] + EMAIL_ROW_STAGGER_MS;
  d[EMAIL_STEP.ROUTER_ROW_3] = d[EMAIL_STEP.ROUTER_ROW_2] + EMAIL_ROW_STAGGER_MS;
  d[EMAIL_STEP.SIGNAL_2] = d[EMAIL_STEP.ROUTER_ROW_3] + EMAIL_REVEAL_MS + 160;
  d[EMAIL_STEP.KNOWLEDGE_ACTIVE] = d[EMAIL_STEP.SIGNAL_2] + EMAIL_SIGNAL_MS;
  d[EMAIL_STEP.KNOWLEDGE_ROW_1] = d[EMAIL_STEP.KNOWLEDGE_ACTIVE];
  d[EMAIL_STEP.KNOWLEDGE_ROW_2] = d[EMAIL_STEP.KNOWLEDGE_ROW_1] + EMAIL_ROW_STAGGER_MS;
  d[EMAIL_STEP.KNOWLEDGE_ROW_3] = d[EMAIL_STEP.KNOWLEDGE_ROW_2] + EMAIL_ROW_STAGGER_MS;
  d[EMAIL_STEP.SIGNAL_3] = d[EMAIL_STEP.KNOWLEDGE_ROW_3] + EMAIL_REVEAL_MS + 160;
  d[EMAIL_STEP.ACTION_ACTIVE] = d[EMAIL_STEP.SIGNAL_3] + EMAIL_SIGNAL_MS;
  d[EMAIL_STEP.ACTION_ITEM_1] = d[EMAIL_STEP.ACTION_ACTIVE];
  d[EMAIL_STEP.ACTION_ITEM_2] = d[EMAIL_STEP.ACTION_ITEM_1] + EMAIL_ACTION_STAGGER_MS;
  d[EMAIL_STEP.ACTION_ITEM_3] = d[EMAIL_STEP.ACTION_ITEM_2] + EMAIL_ACTION_STAGGER_MS;
  d[EMAIL_STEP.COMPLETED] = d[EMAIL_STEP.ACTION_ITEM_3] + EMAIL_REVEAL_MS + 170;
  return d;
})();

function deriveEmailPhase(step: number) {
  const inputState: WorkflowStageState = step >= EMAIL_STEP.SIGNAL_1 ? "completed" : "active";
  const routerState: WorkflowStageState =
    step < EMAIL_STEP.ROUTER_ACTIVE ? "pending" : step >= EMAIL_STEP.SIGNAL_2 ? "completed" : "active";
  const knowledgeState: WorkflowStageState =
    step < EMAIL_STEP.KNOWLEDGE_ACTIVE ? "pending" : step >= EMAIL_STEP.SIGNAL_3 ? "completed" : "active";
  const actionState: WorkflowStageState =
    step < EMAIL_STEP.ACTION_ACTIVE ? "pending" : step >= EMAIL_STEP.COMPLETED ? "completed" : "active";

  return {
    inputState,
    inputRevealed: step >= EMAIL_STEP.INPUT,
    signal1: step === EMAIL_STEP.SIGNAL_1,
    routerState,
    routerRevealed: clamp(step - EMAIL_STEP.ROUTER_ROW_1 + 1, 0, 3),
    signal2: step === EMAIL_STEP.SIGNAL_2,
    knowledgeState,
    knowledgeRevealed: clamp(step - EMAIL_STEP.KNOWLEDGE_ROW_1 + 1, 0, 3),
    signal3: step === EMAIL_STEP.SIGNAL_3,
    actionState,
    actionRevealed: clamp(step - EMAIL_STEP.ACTION_ITEM_1 + 1, 0, 3),
  };
}

export function EmailWorkflowBody({
  content,
  active = true,
}: {
  content: EmailWorkflowContent;
  active?: boolean;
}) {
  const reduce = useReducedMotion();
  const [step, setStep] = React.useState(0);
  const { containerRef, stage1Ref, stage2Ref, stage3Ref, stage4Ref, metrics } = useEmailPathMetrics();

  React.useEffect(() => {
    if (!active) {
      const id = window.setTimeout(() => setStep(0), 0);
      return () => window.clearTimeout(id);
    }
    if (reduce) {
      const id = window.setTimeout(() => setStep(EMAIL_STEP.COMPLETED), 0);
      return () => window.clearTimeout(id);
    }
    const timeouts = Object.values(EMAIL_STEP).map((targetStep) =>
      window.setTimeout(() => setStep(targetStep), EMAIL_STEP_DELAYS[targetStep]),
    );
    return () => {
      timeouts.forEach((id) => window.clearTimeout(id));
    };
  }, [active, reduce]);

  const phase = deriveEmailPhase(step);
  const connectors: [EmailConnectorPhase, EmailConnectorPhase, EmailConnectorPhase] = [
    { signal: phase.signal1, fired: phase.routerState !== "pending" },
    { signal: phase.signal2, fired: phase.knowledgeState !== "pending" },
    { signal: phase.signal3, fired: phase.actionState !== "pending" },
  ];

  return (
    <div ref={containerRef} className="relative isolate flex h-full flex-col">
      <EmailWorkflowPaths metrics={metrics} connectors={connectors} reduce={reduce} />

      <LeadModule
        moduleRef={stage1Ref}
        index="01"
        eyebrow={content.input.eyebrow}
        state={phase.inputState}
        reduce={reduce}
        className="w-[86%] sm:w-[72%] ml-[8%] sm:ml-[14%]"
      >
        <WorkflowReveal visible={phase.inputRevealed}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="flex items-center gap-2 font-mono text-[10px] uppercase text-fg-muted">
              <span
                aria-hidden
                className={cn(
                  "h-1.5 w-1.5 shrink-0 rounded-full bg-accent",
                  !reduce && phase.inputRevealed && "animate-lead-endpoint-pulse",
                )}
              />
              from
            </span>
            <span className="font-display text-sm font-semibold text-fg">{content.input.from}</span>
          </div>
          <p className="mt-1.5 font-display text-base font-semibold text-fg">{content.input.subject}</p>
          <WorkflowQuote className="mt-1.5">{content.input.quote}</WorkflowQuote>
        </WorkflowReveal>
      </LeadModule>

      <div aria-hidden className="min-h-2 flex-1" />

      <LeadModule
        moduleRef={stage2Ref}
        index="02"
        eyebrow={content.analysis.eyebrow}
        state={phase.routerState}
        reduce={reduce}
        className="w-[62%] sm:w-[52%]"
      >
        <dl>
          {content.analysis.points.map((point, i) => (
            <LeadAnalysisRow key={point.label} point={point} visible={i < phase.routerRevealed} reduce={reduce} />
          ))}
        </dl>
      </LeadModule>

      <div aria-hidden className="min-h-2 flex-1" />

      <LeadModule
        moduleRef={stage3Ref}
        index="03"
        eyebrow={content.context.eyebrow}
        state={phase.knowledgeState}
        reduce={reduce}
        className="w-[96%] sm:w-[94%] ml-[4%] sm:ml-[6%]"
      >
        <dl>
          {content.context.points.map((point, i) => (
            <LeadAnalysisRow key={point.label} point={point} visible={i < phase.knowledgeRevealed} reduce={reduce} />
          ))}
        </dl>
      </LeadModule>

      <div aria-hidden className="min-h-2 flex-1" />

      <LeadModule
        moduleRef={stage4Ref}
        index="04"
        eyebrow={content.action.eyebrow}
        state={phase.actionState}
        reduce={reduce}
        className="w-[74%] sm:w-[64%] ml-[10%] sm:ml-[18%]"
      >
        <ul className="flex flex-col gap-1">
          {content.action.items.map((item, i) => (
            <LeadActionItem key={item} item={item} done={i < phase.actionRevealed} reduce={reduce} />
          ))}
        </ul>
      </LeadModule>
    </div>
  );
}

const CRM_STEP = {
  INPUT: 1,
  SIGNAL_1: 2,
  EXTRACTION_ACTIVE: 3,
  EXTRACTION_ROW_1: 4,
  EXTRACTION_ROW_2: 5,
  EXTRACTION_ROW_3: 6,
  EXTRACTION_ROW_4: 7,
  SIGNAL_2: 8,
  UPDATE_ACTIVE: 9,
  UPDATE_ROW_1: 10,
  UPDATE_ROW_2: 11,
  UPDATE_ROW_3: 12,
  UPDATE_ROW_4: 13,
  COMPLETED: 14,
} as const;

const CRM_ROW_STAGGER_MS = 150;
const CRM_SIGNAL_MS = 440;

const CRM_STEP_DELAYS: Record<number, number> = (() => {
  const d: Record<number, number> = {};
  d[CRM_STEP.INPUT] = 400;
  d[CRM_STEP.SIGNAL_1] = d[CRM_STEP.INPUT] + 260 + 400;
  d[CRM_STEP.EXTRACTION_ACTIVE] = d[CRM_STEP.SIGNAL_1] + CRM_SIGNAL_MS;
  d[CRM_STEP.EXTRACTION_ROW_1] = d[CRM_STEP.EXTRACTION_ACTIVE];
  d[CRM_STEP.EXTRACTION_ROW_2] = d[CRM_STEP.EXTRACTION_ROW_1] + CRM_ROW_STAGGER_MS;
  d[CRM_STEP.EXTRACTION_ROW_3] = d[CRM_STEP.EXTRACTION_ROW_2] + CRM_ROW_STAGGER_MS;
  d[CRM_STEP.EXTRACTION_ROW_4] = d[CRM_STEP.EXTRACTION_ROW_3] + CRM_ROW_STAGGER_MS;
  d[CRM_STEP.SIGNAL_2] = d[CRM_STEP.EXTRACTION_ROW_4] + 260 + 300;
  d[CRM_STEP.UPDATE_ACTIVE] = d[CRM_STEP.SIGNAL_2] + CRM_SIGNAL_MS;
  d[CRM_STEP.UPDATE_ROW_1] = d[CRM_STEP.UPDATE_ACTIVE];
  d[CRM_STEP.UPDATE_ROW_2] = d[CRM_STEP.UPDATE_ROW_1] + CRM_ROW_STAGGER_MS;
  d[CRM_STEP.UPDATE_ROW_3] = d[CRM_STEP.UPDATE_ROW_2] + CRM_ROW_STAGGER_MS;
  d[CRM_STEP.UPDATE_ROW_4] = d[CRM_STEP.UPDATE_ROW_3] + CRM_ROW_STAGGER_MS;
  d[CRM_STEP.COMPLETED] = d[CRM_STEP.UPDATE_ROW_4] + 260 + 400;
  return d;
})();

function deriveCrmPhase(step: number) {
  const inputState: WorkflowStageState = step >= CRM_STEP.SIGNAL_1 ? "completed" : "active";
  const extractionState: WorkflowStageState =
    step < CRM_STEP.EXTRACTION_ACTIVE ? "pending" : step >= CRM_STEP.SIGNAL_2 ? "completed" : "active";
  const updateState: WorkflowStageState =
    step < CRM_STEP.UPDATE_ACTIVE ? "pending" : step >= CRM_STEP.COMPLETED ? "completed" : "active";

  return {
    inputState,
    inputRevealed: step >= CRM_STEP.INPUT,
    signal1: step === CRM_STEP.SIGNAL_1,
    extractionState,
    extractionRevealed: clamp(step - CRM_STEP.EXTRACTION_ROW_1 + 1, 0, 4),
    signal2: step === CRM_STEP.SIGNAL_2,
    updateState,
    updateRevealed: clamp(step - CRM_STEP.UPDATE_ROW_1 + 1, 0, 4),
  };
}

export function CrmWorkflowBody({
  content,
  active = true,
}: {
  content: CrmWorkflowContent;
  active?: boolean;
}) {
  const reduce = useReducedMotion();
  const [step, setStep] = React.useState(0);
  const { containerRef, stage1Ref, stage2Ref, stage3Ref, metrics } = useCrmPathMetrics();

  React.useEffect(() => {
    if (!active) {
      const id = window.setTimeout(() => setStep(0), 0);
      return () => window.clearTimeout(id);
    }
    if (reduce) {
      const id = window.setTimeout(() => setStep(CRM_STEP.COMPLETED), 0);
      return () => window.clearTimeout(id);
    }
    const timeouts = Object.values(CRM_STEP).map((targetStep) =>
      window.setTimeout(() => setStep(targetStep), CRM_STEP_DELAYS[targetStep]),
    );
    return () => {
      timeouts.forEach((id) => window.clearTimeout(id));
    };
  }, [active, reduce]);

  const phase = deriveCrmPhase(step);
  const connectors: [CrmConnectorPhase, CrmConnectorPhase] = [
    { signal: phase.signal1, fired: phase.extractionState !== "pending" },
    { signal: phase.signal2, fired: phase.updateState !== "pending" },
  ];

  return (
    <div ref={containerRef} className="relative isolate flex h-full flex-col">
      <CrmWorkflowPaths metrics={metrics} connectors={connectors} reduce={reduce} />

      <LeadModule
        moduleRef={stage1Ref}
        index="01"
        eyebrow={content.input.eyebrow}
        state={phase.inputState}
        reduce={reduce}
        className="w-[46%] sm:w-[36%]"
      >
        <WorkflowReveal visible={phase.inputRevealed}>
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className={cn(
                "h-1.5 w-1.5 shrink-0 rounded-full bg-accent",
                !reduce && phase.inputRevealed && "animate-lead-endpoint-pulse",
              )}
            />
            <p className="font-display text-2xl font-semibold tracking-tight text-fg">
              {content.input.duration}
            </p>
          </div>
        </WorkflowReveal>
      </LeadModule>

      <div aria-hidden className="min-h-2 flex-1" />

      <LeadModule
        moduleRef={stage2Ref}
        index="02"
        eyebrow={content.analysis.eyebrow}
        state={phase.extractionState}
        reduce={reduce}
        className="w-[98%] sm:w-[96%] ml-[2%]"
      >
        <dl>
          {content.analysis.points.map((point, i) => (
            <LeadAnalysisRow
              key={point.label}
              point={point}
              visible={i < phase.extractionRevealed}
              reduce={reduce}
            />
          ))}
        </dl>
      </LeadModule>

      <div aria-hidden className="min-h-2 flex-1" />

      <LeadModule
        moduleRef={stage3Ref}
        index="03"
        eyebrow={content.result.eyebrow}
        state={phase.updateState}
        reduce={reduce}
        className="w-[80%] sm:w-[70%] ml-[16%] sm:ml-[26%]"
      >
        <dl>
          {content.result.points.map((point, i) => (
            <LeadAnalysisRow key={point.label} point={point} visible={i < phase.updateRevealed} reduce={reduce} />
          ))}
        </dl>
      </LeadModule>
    </div>
  );
}

const KNOWLEDGE_STEP = {
  INPUT: 1,
  SIGNAL_1: 2,
  SEARCH_ACTIVE: 3,
  SEARCH_ROW_1: 4,
  SEARCH_ROW_2: 5,
  SEARCH_ROW_3: 6,
  SIGNAL_2: 7,
  ANSWER_ACTIVE: 8,
  ANSWER_SOURCES: 9,
  COMPLETED: 10,
} as const;

const KNOWLEDGE_ROW_STAGGER_MS = 150;
const KNOWLEDGE_SIGNAL_MS = 440;

const KNOWLEDGE_STEP_DELAYS: Record<number, number> = (() => {
  const d: Record<number, number> = {};
  d[KNOWLEDGE_STEP.INPUT] = 400;
  d[KNOWLEDGE_STEP.SIGNAL_1] = d[KNOWLEDGE_STEP.INPUT] + 260 + 400;
  d[KNOWLEDGE_STEP.SEARCH_ACTIVE] = d[KNOWLEDGE_STEP.SIGNAL_1] + KNOWLEDGE_SIGNAL_MS;
  d[KNOWLEDGE_STEP.SEARCH_ROW_1] = d[KNOWLEDGE_STEP.SEARCH_ACTIVE];
  d[KNOWLEDGE_STEP.SEARCH_ROW_2] = d[KNOWLEDGE_STEP.SEARCH_ROW_1] + KNOWLEDGE_ROW_STAGGER_MS;
  d[KNOWLEDGE_STEP.SEARCH_ROW_3] = d[KNOWLEDGE_STEP.SEARCH_ROW_2] + KNOWLEDGE_ROW_STAGGER_MS;
  d[KNOWLEDGE_STEP.SIGNAL_2] = d[KNOWLEDGE_STEP.SEARCH_ROW_3] + 260 + 300;
  d[KNOWLEDGE_STEP.ANSWER_ACTIVE] = d[KNOWLEDGE_STEP.SIGNAL_2] + KNOWLEDGE_SIGNAL_MS;
  d[KNOWLEDGE_STEP.ANSWER_SOURCES] = d[KNOWLEDGE_STEP.ANSWER_ACTIVE] + 400;
  d[KNOWLEDGE_STEP.COMPLETED] = d[KNOWLEDGE_STEP.ANSWER_SOURCES] + 260 + 600;
  return d;
})();

function deriveKnowledgePhase(step: number) {
  const inputState: WorkflowStageState = step >= KNOWLEDGE_STEP.SIGNAL_1 ? "completed" : "active";
  const searchState: WorkflowStageState =
    step < KNOWLEDGE_STEP.SEARCH_ACTIVE ? "pending" : step >= KNOWLEDGE_STEP.SIGNAL_2 ? "completed" : "active";
  const answerState: WorkflowStageState =
    step < KNOWLEDGE_STEP.ANSWER_ACTIVE ? "pending" : step >= KNOWLEDGE_STEP.COMPLETED ? "completed" : "active";

  return {
    inputState,
    inputRevealed: step >= KNOWLEDGE_STEP.INPUT,
    signal1: step === KNOWLEDGE_STEP.SIGNAL_1,
    searchState,
    searchRevealed: clamp(step - KNOWLEDGE_STEP.SEARCH_ROW_1 + 1, 0, 3),
    signal2: step === KNOWLEDGE_STEP.SIGNAL_2,
    answerState,
    answerRevealed: step >= KNOWLEDGE_STEP.ANSWER_ACTIVE,
    sourcesRevealed: step >= KNOWLEDGE_STEP.ANSWER_SOURCES,
  };
}

export function KnowledgeWorkflowBody({
  content,
  active = true,
}: {
  content: KnowledgeWorkflowContent;
  active?: boolean;
}) {
  const reduce = useReducedMotion();
  const [step, setStep] = React.useState(0);
  const { containerRef, stage1Ref, stage2Ref, stage3Ref, metrics } = useKnowledgePathMetrics();

  React.useEffect(() => {
    if (!active) {
      const id = window.setTimeout(() => setStep(0), 0);
      return () => window.clearTimeout(id);
    }
    if (reduce) {
      const id = window.setTimeout(() => setStep(KNOWLEDGE_STEP.COMPLETED), 0);
      return () => window.clearTimeout(id);
    }
    const timeouts = Object.values(KNOWLEDGE_STEP).map((targetStep) =>
      window.setTimeout(() => setStep(targetStep), KNOWLEDGE_STEP_DELAYS[targetStep]),
    );
    return () => {
      timeouts.forEach((id) => window.clearTimeout(id));
    };
  }, [active, reduce]);

  const phase = deriveKnowledgePhase(step);
  const connectors: [KnowledgeConnectorPhase, KnowledgeConnectorPhase] = [
    { signal: phase.signal1, fired: phase.searchState !== "pending" },
    { signal: phase.signal2, fired: phase.answerState !== "pending" },
  ];

  return (
    <div ref={containerRef} className="relative isolate flex h-full flex-col">
      <KnowledgeWorkflowPaths metrics={metrics} connectors={connectors} reduce={reduce} />

      <LeadModule
        moduleRef={stage1Ref}
        index="01"
        eyebrow={content.input.eyebrow}
        state={phase.inputState}
        reduce={reduce}
        className="w-[68%] sm:w-[58%] ml-[6%] sm:ml-[10%]"
      >
        <WorkflowReveal visible={phase.inputRevealed}>
          <div className="flex items-start gap-2">
            <span
              aria-hidden
              className={cn(
                "mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent",
                !reduce && phase.inputRevealed && "animate-lead-endpoint-pulse",
              )}
            />
            <WorkflowQuote className="border-l-0 pl-0">{content.input.quote}</WorkflowQuote>
          </div>
        </WorkflowReveal>
      </LeadModule>

      <div aria-hidden className="min-h-2 flex-1" />

      <LeadModule
        moduleRef={stage2Ref}
        index="02"
        eyebrow={content.search.eyebrow}
        state={phase.searchState}
        reduce={reduce}
        className="w-full sm:w-[98%]"
      >
        <dl>
          {content.search.points.map((point, i) => (
            <LeadAnalysisRow key={point.label} point={point} visible={i < phase.searchRevealed} reduce={reduce} />
          ))}
        </dl>
      </LeadModule>

      <div aria-hidden className="min-h-2 flex-1" />

      <LeadModule
        moduleRef={stage3Ref}
        index="03"
        eyebrow={content.answer.eyebrow}
        state={phase.answerState}
        reduce={reduce}
        className="w-[88%] sm:w-[80%] ml-[4%] sm:ml-[8%]"
      >
        <WorkflowReveal visible={phase.answerRevealed}>
          <p className="text-[13px] leading-relaxed text-fg">{content.answer.text}</p>
        </WorkflowReveal>
        <WorkflowReveal visible={phase.sourcesRevealed} className="mt-2.5 flex flex-wrap gap-1.5">
          {content.answer.sources.map((source) => (
            <Chip key={source}>{source}</Chip>
          ))}
        </WorkflowReveal>
      </LeadModule>
    </div>
  );
}

export function WorkflowScenarioBody({
  workflow,
  active,
}: {
  workflow: HeroWorkflowContent;
  active: boolean;
}) {
  switch (workflow.kind) {
    case "lead":
      return <LeadWorkflowBody content={workflow} active={active} />;
    case "email":
      return <EmailWorkflowBody content={workflow} active={active} />;
    case "crm":
      return <CrmWorkflowBody content={workflow} active={active} />;
    case "knowledge":
      return <KnowledgeWorkflowBody content={workflow} active={active} />;
    default: {
      const exhaustive: never = workflow;
      return exhaustive;
    }
  }
}
