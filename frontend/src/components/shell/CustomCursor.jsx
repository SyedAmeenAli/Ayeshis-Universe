import React, { useEffect, useRef, useState } from "react";
import { useSettings } from "@/stores/settingsStore";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * Restrained custom cursor with a max-8-particle lavender trail.
 * Automatically disables on touch devices and when reduced motion is active.
 */
export function CustomCursor() {
  const cursorEnabled = useSettings((s) => s.cursorEnabled);
  const reduce = useReducedMotion();
  const cursorRef = useRef(null);
  const trailRef = useRef([]);
  const [supported, setSupported] = useState(false);
  const [variant, setVariant] = useState("default");
  const [label, setLabel] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    setSupported(canHover);
  }, []);

  const active = supported && cursorEnabled && !reduce;

  useEffect(() => {
    if (!active) {
      document.documentElement.classList.remove("apu-cursor-enabled");
      return;
    }
    document.documentElement.classList.add("apu-cursor-enabled");
    return () => document.documentElement.classList.remove("apu-cursor-enabled");
  }, [active]);

  useEffect(() => {
    if (!active) return;

    let lastX = -100;
    let lastY = -100;
    let raf = 0;
    let lastEmit = 0;

    function move(e) {
      lastX = e.clientX;
      lastY = e.clientY;

      // detect interactive element
      const el = e.target;
      let v = "default";
      let l = "";
      if (el && el.closest) {
        const inter = el.closest("a, button, [role='button'], input, textarea, select, [data-cursor]");
        if (inter) {
          const custom = inter.getAttribute?.("data-cursor");
          if (custom === "view") { v = "view"; l = "view"; }
          else if (custom === "open") { v = "open"; l = "open"; }
          else if (custom === "drag") { v = "drag"; l = "drag"; }
          else v = "interactive";
        }
      }
      setVariant(v);
      setLabel(l);

      // emit trail particle at low rate
      const now = performance.now();
      if (now - lastEmit > 40) {
        lastEmit = now;
        spawnParticle(lastX, lastY);
      }
    }

    function spawnParticle(x, y) {
      const p = document.createElement("div");
      p.className = "apu-cursor__trail";
      p.style.transform = `translate3d(${x - 3}px, ${y - 3}px, 0)`;
      p.style.opacity = "0.55";
      document.body.appendChild(p);
      trailRef.current.push(p);
      if (trailRef.current.length > 8) {
        const old = trailRef.current.shift();
        old?.remove();
      }
      requestAnimationFrame(() => {
        p.style.transition = "transform 600ms cubic-bezier(0.22,1,0.36,1), opacity 600ms linear";
        p.style.transform = `translate3d(${x - 3 + (Math.random() * 24 - 12)}px, ${y - 3 + (Math.random() * 20 - 4)}px, 0)`;
        p.style.opacity = "0";
      });
      setTimeout(() => {
        p.remove();
        trailRef.current = trailRef.current.filter((t) => t !== p);
      }, 700);
    }

    function tick() {
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${lastX - cursorRef.current.offsetWidth / 2}px, ${lastY - cursorRef.current.offsetHeight / 2}px, 0)`;
      }
      raf = requestAnimationFrame(tick);
    }

    window.addEventListener("mousemove", move, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", move);
      cancelAnimationFrame(raf);
      trailRef.current.forEach((el) => el.remove());
      trailRef.current = [];
    };
  }, [active]);

  if (!active) return null;
  return (
    <div ref={cursorRef} className="apu-cursor" data-variant={variant}>
      {label}
    </div>
  );
}
