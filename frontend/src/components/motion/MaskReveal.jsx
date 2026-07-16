import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";

/**
 * Mask-swipe reveal for text or media on scroll.
 */
export function MaskReveal({ children, delay = 0, className = "", axis = "y" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px -10% 0px" });

  const initial = axis === "y"
    ? { clipPath: "inset(0% 0 100% 0)" }
    : { clipPath: "inset(0 100% 0 0)" };
  const visible = { clipPath: "inset(0 0 0 0)" };

  return (
    <div ref={ref} className={className}>
      <motion.div
        initial={initial}
        animate={inView ? visible : initial}
        transition={{
          duration: 1.1,
          delay,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

export function FadeUp({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 22 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 22 }}
      transition={{ duration: 0.9, delay, ease: [0.25, 1, 0.5, 1] }}
    >
      {children}
    </motion.div>
  );
}
