"use client";

import * as React from "react";
import { useReducedMotion } from "motion/react";
import { Container, Section, SectionHeading } from "@/components/ui/container";
import { Reveal } from "@/components/motion/reveal";
import { AgentTabs } from "./agent-tabs";
import { AgentStage } from "./agent-stage";
import type { FlowPhase } from "./agent-stage-flow";
import type { Site, Ui } from "@/content/types";

export function Solutions({
  content,
  a11y,
}: {
  content: Site["solutions"];
  a11y: Ui["a11y"];
}) {
  const reduce = useReducedMotion();
  const [activeId, setActiveId] = React.useState(content.items[0].id);
  const [playToken, setPlayToken] = React.useState(0);
  const [entered, setEntered] = React.useState(false);

  const baseId = React.useId();
  const panelId = `${baseId}-panel`;
  const tabIdFor = React.useCallback((id: string) => `${baseId}-tab-${id}`, [baseId]);

  const activeItem = content.items.find((item) => item.id === activeId) ?? content.items[0];

  const phase: FlowPhase = reduce ? "done" : entered ? "playing" : "pending";

  function selectAgent(id: string) {
    setActiveId(id);
    setPlayToken((t) => t + 1);
  }

  return (
    <Section id="solutions" className="border-t border-border bg-bg-soft/40">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow={content.eyebrow}
            title={content.title}
            subtitle={content.subtitle}
          />
        </Reveal>

        <Reveal delay={0.08} className="mt-14">
          <AgentTabs
            items={content.items}
            activeId={activeId}
            onSelect={selectAgent}
            label={a11y.agents}
            panelId={panelId}
            tabIdFor={tabIdFor}
          />
        </Reveal>

        <Reveal delay={0.12} onViewportEnter={() => setEntered(true)}>
          <AgentStage
            key={`${activeId}-${playToken}`}
            item={activeItem}
            count={content.items.length}
            panelId={panelId}
            tabId={tabIdFor(activeId)}
            phase={phase}
          />
        </Reveal>
      </Container>
    </Section>
  );
}
