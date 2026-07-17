import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AYESHA_SECTIONS } from "@/data/galleryItems";
import { AssetPlaceholder } from "@/components/media/AssetPlaceholder";
import { GalleryLightbox } from "@/components/editorial/GalleryLightbox";
import { useGalleryReactions } from "@/hooks/useGalleryReactions";
import { photoForAyeshaAssetId } from "@/lib/ayeshaPhotos";

// Each item gets a real photo from Ayesha's own pool, not the shared
// couple-photo pool used everywhere else on the site.
const SECTIONS_WITH_PHOTOS = AYESHA_SECTIONS.map((section) => ({
  ...section,
  items: section.items.map((item) => ({ ...item, src: photoForAyeshaAssetId(item.id) })),
}));

export default function Ayesha() {
  const { reactions, react } = useGalleryReactions("ayesha");
  const [open, setOpen] = useState(null); // { flatIndex }

  const flatItems = useMemo(() => SECTIONS_WITH_PHOTOS.flatMap((s) => s.items), []);

  function openItem(item) {
    const idx = flatItems.findIndex((i) => i.id === item.id);
    setOpen(idx);
  }

  return (
    <div className="min-h-screen w-full pt-24 md:pt-28 pb-24 px-5 md:px-10 max-w-[1440px] mx-auto">
      <header className="mb-16">
        <span className="type-mono text-[10px] text-text-muted">PRIVATE EDITION / 1709</span>
        <h1 className="mt-3 font-editorial text-6xl md:text-8xl leading-[0.9] tracking-tight">
          AYESHA
        </h1>
        <p className="mt-3 font-editorial text-lg text-text-secondary">
          Not a gallery. An entire department.
        </p>
      </header>

      {SECTIONS_WITH_PHOTOS.map((section) => (
        <section key={section.key} className="mb-20">
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="font-editorial text-3xl md:text-4xl">{section.label}</h2>
            <span className="type-mono text-[9px] text-lavender/70">{section.kicker}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {section.items.map((item, i) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: (i % 8) * 0.04 }}
                onClick={() => openItem(item)}
                className="relative group text-left"
                data-testid={`ayesha-grid-${item.id}`}
              >
                <AssetPlaceholder asset={item} aspect="4/5" minimal className="w-full" />
                {reactions[item.id]?.favourite && (
                  <span className="absolute top-2 right-2 text-bow text-xs">♥</span>
                )}
                <div className="absolute inset-0 rounded-2xl ring-0 group-hover:ring-2 ring-lavender/40 transition-all pointer-events-none" />
              </motion.button>
            ))}
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
        />
      )}
    </div>
  );
}
