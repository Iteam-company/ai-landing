"use client";

import { useEffect, useState } from "react";

/**
 * Matches the `sm` breakpoint (640px) already used to size the Automation
 * Network section (`h-[230vh] sm:h-[280vh] ...`) — keeping this in sync with
 * that class means the section's height and its 3D composition/interaction
 * mode always switch at the same viewport width.
 */
const DEFAULT_BREAKPOINT_PX = 640;

/** `false` on the server and before hydration — avoids a mobile/desktop mismatch flash by defaulting to desktop. */
export function useIsMobile(breakpointPx: number = DEFAULT_BREAKPOINT_PX): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(`(max-width: ${breakpointPx - 1}px)`);
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [breakpointPx]);

  return isMobile;
}
