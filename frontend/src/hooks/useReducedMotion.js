import { useEffect, useState } from "react";
import { useSettings } from "@/stores/settingsStore";

/**
 * Respect the user's OS-level reduced-motion preference plus our in-app toggle.
 */
export function useReducedMotion() {
  const forced = useSettings((s) => s.reducedMotion);
  const [prefers, setPrefers] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = () => setPrefers(mq.matches);
    handler();
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);

  return forced || prefers;
}
