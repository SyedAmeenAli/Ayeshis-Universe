import { useEffect, useRef } from "react";
import Lenis from "lenis";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * Attach Lenis smooth scrolling to the window while this hook is mounted.
 * No-ops when reduced motion is active.
 */
export function useLenis({ duration = 1.1, easing } = {}) {
  const lenisRef = useRef(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;
    const lenis = new Lenis({
      duration,
      easing: easing || ((t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))),
      smoothWheel: true,
      smoothTouch: false,
    });
    lenisRef.current = lenis;

    let raf;
    function tick(time) {
      lenis.raf(time);
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [duration, easing, reduce]);

  return lenisRef;
}
