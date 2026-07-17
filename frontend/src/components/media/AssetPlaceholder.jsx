import React, { useState } from "react";
import { motion } from "framer-motion";
import { photoForAssetId } from "@/lib/realAssets";

/**
 * Polished asset placeholder. Never shows a broken-image icon.
 * Renders a real personal photo when one has been dropped into
 * public/assets/real/ (matched deterministically by asset id).
 * Falls back to the metadata placeholder card otherwise.
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
  const assetId = asset?.id || asset?.asset_id || "unknown";
  const realSrc = asset?.src || photoForAssetId(assetId);
  const [photoFailed, setPhotoFailed] = useState(false);

  if (realSrc && !photoFailed) {
    return (
      <motion.div
        className={`relative overflow-hidden rounded-2xl ${className}`}
        style={style}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9 }}
        data-testid={`asset-placeholder-${assetId}`}
      >
        <img
          src={realSrc}
          alt={asset?.purpose || asset?.content_needed || assetId}
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setPhotoFailed(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent pointer-events-none" />
        {!minimal && (
          <span className="absolute top-3 left-3 type-mono text-[9px] text-white/80">
            {assetId}
          </span>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`${containerBase} ${className}`}
      style={style}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.9 }}
      data-testid={`asset-placeholder-${assetId}`}
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
