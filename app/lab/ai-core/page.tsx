import type { Metadata } from "next";
import { AiCoreLabClient } from "@/components/lab/ai-core-prototype/ai-core-lab-client";

// Isolated visual-iteration prototype — not linked from site navigation, not
// part of the production automation-network scroll scene. Kept out of search
// indexing since it's a dev tool, not marketing content.
export const metadata: Metadata = {
  title: "AI Core prototype (lab)",
  robots: { index: false, follow: false },
};

export default function AiCoreLabPage() {
  return <AiCoreLabClient />;
}
