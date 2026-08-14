"use client";

import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { GlassReactorCore } from "./glass-reactor-core";
import { DataConstructCore } from "./data-construct-core";

type Concept = "glass" | "data";

const CONCEPTS: { id: Concept; label: string }[] = [
  { id: "glass", label: "Glass Reactor" },
  { id: "data", label: "Data Construct" },
];

export function AiCoreLabClient() {
  const [concept, setConcept] = useState<Concept>("glass");
  const [activity, setActivity] = useState(0.3);
  const [paused, setPaused] = useState(false);

  return (
    <div className="relative h-dvh w-full bg-bg">
      <Canvas
        camera={{ position: [0, 0, 3.2], fov: 40 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={["#0a0b0f"]} />
        <fog attach="fog" args={["#0a0b0f", 2.6, 8]} />
        {concept === "glass" ? (
          <GlassReactorCore activity={activity} paused={paused} />
        ) : (
          <DataConstructCore activity={activity} paused={paused} />
        )}
      </Canvas>

      <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-between p-6 font-mono text-[11px] uppercase text-fg-muted">
        <span>AI Core prototype — R3F / drei, isolated from production</span>
        <span>pointer parallax active</span>
      </div>

      <div className="pointer-events-auto absolute bottom-6 left-6 flex w-72 flex-col gap-3 rounded-(--radius-card) border border-border bg-bg-card/80 p-4 backdrop-blur-sm">
        <div className="flex gap-1 rounded-full border border-border bg-bg/60 p-1 font-mono text-[10px] uppercase">
          {CONCEPTS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setConcept(c.id)}
              className={`flex-1 rounded-full px-2 py-1 transition-colors ${
                concept === c.id ? "bg-accent text-bg" : "text-fg-muted hover:text-fg"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <label className="flex items-center justify-between font-mono text-[10px] uppercase text-fg-muted">
          activity
          <span className="text-accent">{activity.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={activity}
          onChange={(e) => setActivity(Number(e.target.value))}
          className="accent-accent"
        />

        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          className="rounded-full border border-border px-2 py-1 font-mono text-[10px] uppercase text-fg-muted transition-colors hover:text-fg"
        >
          {paused ? "Resume idle motion" : "Pause idle motion"}
        </button>
      </div>
    </div>
  );
}
