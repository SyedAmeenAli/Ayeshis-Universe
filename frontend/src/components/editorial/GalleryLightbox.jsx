import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { AssetPlaceholder } from "@/components/media/AssetPlaceholder";

/**
 * Full-screen lightbox with keyboard nav, favourite toggle and an
 * optional rating tray (used by /ameen). Swipe on touch via native
 * horizontal drag isn't wired — arrows + keyboard cover desktop and
 * mobile taps, kept simple on purpose.
 */
export function GalleryLightbox({ items, index, onClose, onNavigate, reactions, onReact, ratingOptions }) {
  const item = items[index];

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNavigate((index + 1) % items.length);
      if (e.key === "ArrowLeft") onNavigate((index - 1 + items.length) % items.length);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, items.length, onClose, onNavigate]);

  if (!item) return null;
  const entry = reactions?.[item.id] || {};

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[80] bg-archive/96 backdrop-blur-md flex flex-col"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        data-testid="gallery-lightbox"
      >
        <div className="flex items-center justify-between p-5 md:p-8">
          <span className="type-mono text-[10px] text-text-muted">{item.id}</span>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full border border-white/15 flex items-center justify-center hover:border-lavender/50"
            data-testid="lightbox-close"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 md:px-16 relative min-h-0">
          <button
            onClick={() => onNavigate((index - 1 + items.length) % items.length)}
            className="absolute left-2 md:left-6 w-11 h-11 rounded-full border border-white/15 flex items-center justify-center hover:border-lavender/50"
            data-testid="lightbox-prev"
            aria-label="Previous"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="max-h-[70vh] w-full max-w-2xl"
          >
            <AssetPlaceholder asset={item} aspect="4/5" className="w-full h-full max-h-[70vh]" />
          </motion.div>

          <button
            onClick={() => onNavigate((index + 1) % items.length)}
            className="absolute right-2 md:right-6 w-11 h-11 rounded-full border border-white/15 flex items-center justify-center hover:border-lavender/50"
            data-testid="lightbox-next"
            aria-label="Next"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 md:p-8 flex flex-col items-center gap-4">
          {item.note && (
            <p className="font-hand text-2xl text-lavender-soft text-center max-w-md">{item.note}</p>
          )}

          <div className="flex items-center gap-3 flex-wrap justify-center">
            <button
              onClick={() => onReact(item.id, { favourite: !entry.favourite })}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs transition-colors ${
                entry.favourite ? "border-bow text-bow bg-bow/10" : "border-white/15 text-text-secondary hover:border-white/30"
              }`}
              data-testid="lightbox-favourite"
            >
              <Heart className="w-3.5 h-3.5" fill={entry.favourite ? "currentColor" : "none"} />
              favourite
            </button>

            {ratingOptions?.map((opt) => (
              <button
                key={opt.id}
                onClick={() => onReact(item.id, { rating: opt.id })}
                className={`rounded-full border px-4 py-2 text-xs transition-colors ${
                  entry.rating === opt.id
                    ? "border-lavender text-lavender bg-lavender/10"
                    : "border-white/15 text-text-secondary hover:border-white/30"
                }`}
                data-testid={`lightbox-rate-${opt.id}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
