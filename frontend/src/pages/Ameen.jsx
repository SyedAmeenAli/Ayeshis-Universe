import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AMEEN_SECTIONS, AMEEN_RATINGS } from "@/data/galleryItems";
import { AssetPlaceholder } from "@/components/media/AssetPlaceholder";
import { GalleryLightbox } from "@/components/editorial/GalleryLightbox";
import { useGalleryReactions } from "@/hooks/useGalleryReactions";
import { fetchAmeenGalleryStats } from "@/lib/galleryApi";

const RATING_LABEL = Object.fromEntries(AMEEN_RATINGS.map((r) => [r.id, r.label]));

export default function Ameen() {
  const { reactions, react } = useGalleryReactions("ameen");
  const [open, setOpen] = useState(null);
  const [stats, setStats] = useState(null);

  const flatItems = useMemo(() => AMEEN_SECTIONS.flatMap((s) => s.items), []);

  useEffect(() => {
    fetchAmeenGalleryStats().then(setStats).catch(() => {});
  }, [reactions]);

  function openItem(item) {
    const idx = flatItems.findIndex((i) => i.id === item.id);
    setOpen(idx);
  }

  return (
    <div className="min-h-screen w-full pt-24 md:pt-28 pb-24 px-5 md:px-10 max-w-[1440px] mx-auto">
      <header className="mb-10">
        <span className="type-mono text-[10px] text-text-muted">EXHIBIT / 1709</span>
        <h1 className="mt-3 font-editorial text-5xl md:text-7xl leading-[0.9] tracking-tight">
          Unfortunately, the Boyfriend Also Exists
        </h1>
      </header>

      {stats && (
        <div className="mb-14 flex flex-wrap gap-3">
          {AMEEN_RATINGS.map((r) => (
            <div
              key={r.id}
              className="rounded-full border border-white/10 bg-surface-1 px-4 py-2 flex items-center gap-2"
              data-testid={`ameen-stat-${r.id}`}
            >
              <span className="type-mono text-[9px] text-text-muted">{r.label}</span>
              <span className="font-editorial text-lg text-lavender">{stats[r.id] ?? 0}</span>
            </div>
          ))}
        </div>
      )}

      {AMEEN_SECTIONS.map((section) => (
        <section key={section.key} className="mb-20">
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="font-editorial text-3xl md:text-4xl">{section.label}</h2>
            <span className="type-mono text-[9px] text-lavender/70">{section.kicker}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {section.items.map((item, i) => {
              const entry = reactions[item.id] || {};
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: (i % 8) * 0.04 }}
                  className="flex flex-col gap-2"
                >
                  <button
                    onClick={() => openItem(item)}
                    className="relative group text-left"
                    data-testid={`ameen-grid-${item.id}`}
                  >
                    <AssetPlaceholder asset={item} aspect="4/5" minimal className="w-full" />
                    <div className="absolute inset-0 rounded-2xl ring-0 group-hover:ring-2 ring-lavender/40 transition-all pointer-events-none" />
                  </button>
                  {entry.rating && (
                    <span className="type-mono text-[9px] text-lavender/80 self-start">
                      {RATING_LABEL[entry.rating]}
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </section>
      ))}

      {open !== null && (
        <GalleryLightbox
          items={flatItems}
          index={open}
          onClose={() => setOpen(null)}
          onNavigate={setOpen}
          reactions={reactions}
          onReact={react}
          ratingOptions={AMEEN_RATINGS}
        />
      )}
    </div>
  );
}
