import React from "react";
import { motion } from "framer-motion";

/**
 * Handwritten annotation used sparingly for intimate notes.
 * Slight rotation to feel organic — never used for body copy.
 */
export function HandwrittenAccent({ children, className = "", rotate = -2, delay = 0 }) {
  return (
    <motion.span
      initial={{ opacity: 0, x: -8 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 1, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`font-hand text-2xl md:text-3xl leading-tight text-lavender-soft inline-block ${className}`}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      {children}
    </motion.span>
  );
}
