import React from "react";
import { motion } from "framer-motion";

/**
 * Polished asset placeholder. Never shows a broken-image icon.
 * Shows exact replacement instructions in a monospace card.
 */
export function AssetPlaceholder({
  asset,
  aspect = "3/2",
  className = "",
  minimal = false,
  variant = "dark",
}) {
  const style = { aspectRatio: aspect };
  const isLight = variant === "light";
  const containerBase = isLight
    ? "apu-placeholder"
    : "apu-placeholder";

  return (
    <motion.div
      className={`${containerBase} ${className}`}
      style={style}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.9 }}
      data-testid={`asset-placeholder-${asset?.id || asset?.asset_id || "unknown"}`}
    >
      <div className="absolute inset-0 apu-shimmer opacity-40 pointer-events-none" />
      <div className="relative z-10 h-full w-full flex flex-col justify-between p-5 md:p-7">
        <div className="flex items-start justify-between">
          <span className="type-mono text-[9px] md:text-[10px] text-lavender/80">
            {asset?.id || asset?.asset_id || "ASSET"}
          </span>
          <span className="type-mono text-[9px] md:text-[10px] text-text-muted">
            {asset?.type || "media"}
          </span>
        </div>

        {!minimal && (
          <div className="flex flex-col gap-2 max-w-[22rem]">
            <p className="font-editorial text-lg md:text-2xl leading-tight text-text-primary/85">
              {asset?.purpose || asset?.content_needed || "Personal media replaces this."}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <span className="type-mono text-[9px] text-text-muted">
                {asset?.orientation || "orientation"}
              </span>
              <span className="type-mono text-[9px] text-text-muted">
                {asset?.resolution || "resolution"}
              </span>
              <span className="type-mono text-[9px] text-text-muted">
                {asset?.aspect || "aspect"}
              </span>
            </div>
            {asset?.filename && (
              <span className="type-mono text-[9px] text-text-muted opacity-60">
                {asset.filename}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
