"use client";

import * as React from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { cn } from "@/lib/utils";

type Direction = "up" | "down" | "left" | "right" | "none";

interface RevealProps extends React.HTMLAttributes<HTMLDivElement> {
  delay?: number;
  direction?: Direction;
  distance?: number;
  duration?: number;
  once?: boolean;
  amount?: number;
  as?: keyof React.JSX.IntrinsicElements;
  /** Fires once when the element enters the viewport — lets a caller lazily
   *  trigger its own one-shot effect (e.g. Solutions' stage animation) off
   *  the same observer Reveal already sets up, instead of a second one. */
  onViewportEnter?: (entry: IntersectionObserverEntry | null) => void;
}

const offsets: Record<Direction, { x: number; y: number }> = {
  up: { x: 0, y: 28 },
  down: { x: 0, y: -28 },
  left: { x: 28, y: 0 },
  right: { x: -28, y: 0 },
  none: { x: 0, y: 0 },
};

export function Reveal({
  children,
  className,
  delay = 0,
  direction = "up",
  distance,
  duration = 0.7,
  once = true,
  amount = 0.2,
  ...rest
}: RevealProps) {
  const reduce = useReducedMotion();
  const base = offsets[direction];
  const offset = distance
    ? { x: Math.sign(base.x) * distance, y: Math.sign(base.y) * distance }
    : base;

  const variants: Variants = {
    hidden: reduce
      ? { opacity: 1 }
      : { opacity: 0, x: offset.x, y: offset.y, filter: "blur(6px)" },
    show: {
      opacity: 1,
      x: 0,
      y: 0,
      filter: "blur(0px)",
      transition: { duration, ease: [0.22, 1, 0.36, 1], delay },
    },
  };

  return (
    <motion.div
      className={cn(className)}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount }}
      {...(rest as React.ComponentProps<typeof motion.div>)}
    >
      {children}
    </motion.div>
  );
}

export function Stagger({
  children,
  className,
  delayChildren = 0,
  staggerChildren = 0.08,
  amount = 0.2,
  once = true,
}: React.PropsWithChildren<{
  className?: string;
  delayChildren?: number;
  staggerChildren?: number;
  amount?: number;
  once?: boolean;
}>) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount }}
      variants={{
        hidden: {},
        show: {
          transition: { delayChildren, staggerChildren },
        },
      }}
    >
      {children}
    </motion.div>
  );
}
