"use client";

import { useState } from "react";
import { AutomationNetwork } from "@/components/sections/automation-network";
import { Hero } from "@/components/sections/hero";
import type { Site } from "@/content/types";

interface AutomationNetworkHeroProps {
  automationNetworkContent: Site["automationNetwork"];
  heroContent: Site["hero"];
}

/**
 * Bridges AutomationNetwork's scroll-driven ENTER CORE reveal to Hero's own
 * entrance animation — a thin client boundary purely so both can share the
 * `heroRevealed`/`heroPrepared` booleans (Landing itself renders them as
 * plain siblings and doesn't otherwise need to be a Client Component). See
 * onRevealChange/onPreparedChange in automation-network-scene.tsx for what
 * actually flips these.
 */
export function AutomationNetworkHero({
  automationNetworkContent,
  heroContent,
}: AutomationNetworkHeroProps) {
  const [heroRevealed, setHeroRevealed] = useState(false);
  const [heroPrepared, setHeroPrepared] = useState(false);

  return (
    <>
      <AutomationNetwork
        content={automationNetworkContent}
        onRevealChange={setHeroRevealed}
        onPreparedChange={setHeroPrepared}
      />
      <Hero
        content={heroContent}
        revealed={heroRevealed}
        prepared={heroPrepared}
      />
    </>
  );
}
