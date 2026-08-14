"use client";

import { useState } from "react";
import { AutomationNetwork } from "@/components/sections/automation-network";
import { Hero } from "@/components/sections/hero";
import type { Site, Ui } from "@/content/types";

interface AutomationNetworkHeroProps {
  automationNetworkContent: Site["automationNetwork"];
  heroContent: Site["hero"];
  calendar: Site["contact"]["calendar"];
  a11y: Ui["a11y"];
}

/**
 * Bridges AutomationNetwork's scroll-driven ENTER CORE reveal to Hero's own
 * entrance animation — a thin client boundary purely so both can share one
 * `heroRevealed` boolean (Landing itself renders them as plain siblings and
 * doesn't otherwise need to be a Client Component). See onRevealChange in
 * automation-network-scene.tsx for what actually flips this.
 */
export function AutomationNetworkHero({
  automationNetworkContent,
  heroContent,
  calendar,
  a11y,
}: AutomationNetworkHeroProps) {
  const [heroRevealed, setHeroRevealed] = useState(false);

  return (
    <>
      <AutomationNetwork content={automationNetworkContent} onRevealChange={setHeroRevealed} />
      <Hero content={heroContent} calendar={calendar} a11y={a11y} revealed={heroRevealed} />
    </>
  );
}
