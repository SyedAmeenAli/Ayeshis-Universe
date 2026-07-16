import React from "react";
import { motion } from "framer-motion";

/**
 * Original skull-and-bow mascot. NOT a copy of Kuromi — just a spiritual cousin.
 * Rendered as an inline SVG for full styling control.
 */
export function SkullBow({ size = 44, mood = "sleepy", className = "" }) {
  // moods change subtle expression: sleepy, alert, mischief, anniversary
  const eyeShape = mood === "sleepy"
    ? "M 30 46 L 40 46 M 60 46 L 70 46"
    : mood === "alert"
    ? "M 32 46 a 4 4 0 1 0 8 0 a 4 4 0 1 0 -8 0 M 60 46 a 4 4 0 1 0 8 0 a 4 4 0 1 0 -8 0"
    : "M 32 46 l 8 4 M 60 46 l 8 4";

  return (
    <motion.svg
      viewBox="0 0 100 110"
      width={size}
      height={size * 1.1}
      className={className}
      initial={{ y: 0 }}
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
      aria-hidden="true"
    >
      {/* bow */}
      <g>
        <path d="M 22 22 Q 12 8 28 12 Q 40 15 50 22" fill="#F3A7C4" opacity="0.95" />
        <path d="M 78 22 Q 88 8 72 12 Q 60 15 50 22" fill="#F3A7C4" opacity="0.95" />
        <circle cx="50" cy="24" r="4" fill="#B89CFF" />
      </g>
      {/* skull */}
      <g>
        <path
          d="M 20 46 Q 20 26 50 26 Q 80 26 80 46 Q 80 62 72 68 L 72 78 Q 72 84 66 84 L 62 84 L 62 78 L 56 78 L 56 84 L 44 84 L 44 78 L 38 78 L 38 84 L 34 84 Q 28 84 28 78 L 28 68 Q 20 62 20 46 Z"
          fill="#F7F4F6"
          stroke="#2C2C37"
          strokeWidth="2"
        />
        <path d={eyeShape} stroke="#0B0B0F" strokeWidth="4" strokeLinecap="round" fill="none" />
        <path d="M 46 62 L 54 62" stroke="#0B0B0F" strokeWidth="2" strokeLinecap="round" />
      </g>
      {mood === "anniversary" && (
        <g>
          <path d="M 50 96 l 4 6 l -8 0 z" fill="#F3A7C4" />
        </g>
      )}
    </motion.svg>
  );
}
