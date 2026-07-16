import { useRef } from "react";

/**
 * Attach magnetic hover behaviour to an element.
 * Returns { ref, onMouseMove, onMouseLeave }.
 */
export function useMagnetic({ strength = 0.25, max = 8 } = {}) {
  const ref = useRef(null);

  function handleMove(e) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) * strength;
    const dy = (e.clientY - cy) * strength;
    const clampedX = Math.max(-max, Math.min(max, dx));
    const clampedY = Math.max(-max, Math.min(max, dy));
    el.style.transform = `translate3d(${clampedX}px, ${clampedY}px, 0)`;
  }

  function handleLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "translate3d(0, 0, 0)";
  }

  return { ref, onMouseMove: handleMove, onMouseLeave: handleLeave };
}
