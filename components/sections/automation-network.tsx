"use client";

import { useRef } from "react";
import { useScroll } from "motion/react";
import { AutomationNetworkScene } from "@/components/effects/automation-network-scene";
import { useIsMobile } from "@/lib/use-is-mobile";
import type { Site } from "@/content/types";

interface AutomationNetworkProps {
  content: Site["automationNetwork"];
  onRevealChange?: (revealed: boolean) => void;
  onPreparedChange?: (prepared: boolean) => void;
}

export function AutomationNetwork({ content, onRevealChange, onPreparedChange }: AutomationNetworkProps) {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const isMobile = useIsMobile();

  return (
    <section
      ref={sectionRef}
      aria-hidden
      className="pointer-events-none relative z-10 h-[260vh] sm:h-[340vh] lg:h-[400vh]"
    >
      <div className="sticky top-0 h-dvh w-full overflow-hidden">
        <AutomationNetworkScene
          progress={scrollYProgress}
          nodes={content.nodes}
          processingStatuses={content.processingStatuses}
          completeMessage={content.completeMessage}
          exploreHint={content.exploreHint}
          intro={content.intro}
          isMobile={isMobile}
          onRevealChange={onRevealChange}
          onPreparedChange={onPreparedChange}
          className="absolute inset-0"
        />
      </div>
    </section>
  );
}
