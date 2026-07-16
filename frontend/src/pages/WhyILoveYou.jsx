import React, { useState } from "react";
import { motion } from "framer-motion";
import { useLenis } from "@/hooks/useLenis";
import { WHY_I_LOVE_YOU } from "@/data/whyILoveYou";
import { AssetPlaceholder } from "@/components/media/AssetPlaceholder";
import { HandwrittenAccent } from "@/components/motion/HandwrittenAccent";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { MaskReveal, FadeUp } from "@/components/motion/MaskReveal";

/**
 * Romantic editorial essay. Warm off-white surface. Sits inside the app shell,
 * so we invert the local mode.
 */
export default function WhyILoveYou() {
  useLenis();
  const { opening, chapters, closing } = WHY_I_LOVE_YOU;

  return (
    <div className="mode-romantic min-h-screen w-full">
      <div className="max-w-[1440px] mx-auto px-6 md:px-14 pt-28 pb-24">
        {/* Opening */}
        <section className="grid md:grid-cols-12 gap-8 md:gap-16 mb-32">
          <div className="md:col-span-6 flex flex-col">
            <span className="type-mono text-[10px] text-black/50">CHAPTER 00 · A LETTER, LOOSELY</span>
            <MaskReveal className="mt-6">
              <h1 className="font-editorial text-6xl md:text-8xl leading-[0.88] tracking-tighter text-black">
                Everything I Love About You
              </h1>
            </MaskReveal>
            <HandwrittenAccent className="mt-8 text-black/75" rotate={-2}>
              {opening.handwritten}
            </HandwrittenAccent>
          </div>
          <div className="md:col-span-6">
            <AssetPlaceholder asset={opening.hero} aspect="4/5" />
          </div>
        </section>

        {/* Chapters */}
        {chapters.map((chapter, i) => (
          <Chapter key={chapter.id} chapter={chapter} index={i} />
        ))}

        {/* Closing */}
        <section className="mt-24 grid md:grid-cols-12 gap-8 md:gap-16">
          <div className="md:col-span-8 md:col-start-3">
            <FadeUp>
              <p className="type-mono text-[10px] text-black/50">CLOSING</p>
              <div className="mt-6 space-y-4 max-w-2xl">
                {closing.copy.map((line, k) => (
                  <p key={k} className="font-editorial text-2xl md:text-3xl leading-tight text-black/85">
                    {line}
                  </p>
                ))}
              </div>
              <div className="mt-10 flex flex-wrap gap-3">
                <MagneticButton to="/memories" variant="ivory" size="md" data-testid="why-to-memories">
                  see yourself through the archive
                </MagneticButton>
                <MagneticButton to="/our-story" variant="danger" size="md" data-testid="why-to-story">
                  return to our story
                </MagneticButton>
              </div>
            </FadeUp>
          </div>
        </section>
      </div>
    </div>
  );
}

function Chapter({ chapter, index }) {
  const flip = index % 2 === 1;

  if (chapter.kind === "orbit") {
    return <OrbitChapter chapter={chapter} />;
  }

  return (
    <section className={`mt-24 grid md:grid-cols-12 gap-8 md:gap-16 items-start`}>
      <div className={`md:col-span-6 ${flip ? "md:order-2" : ""}`}>
        <FadeUp>
          <span className="type-mono text-[10px] text-black/50">CHAPTER {chapter.number}</span>
          <h2 className="mt-4 font-editorial text-4xl md:text-6xl leading-[0.95] tracking-tight text-black">
            {chapter.heading}
          </h2>
          <div className="mt-6 space-y-3 max-w-lg">
            {chapter.copy.map((line, k) => (
              <p key={k} className="text-base md:text-lg text-black/70 font-editorial">{line}</p>
            ))}
          </div>
          {chapter.annotation && (
            <HandwrittenAccent className="mt-6 block text-black/80" rotate={2}>
              {chapter.annotation}
            </HandwrittenAccent>
          )}
          {chapter.stickers && (
            <div className="mt-6 flex flex-wrap gap-2">
              {chapter.stickers.map((s) => (
                <span
                  key={s}
                  className="px-3 py-1 rounded-full text-xs font-mono border border-black/15 text-black/70"
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </FadeUp>
      </div>

      <div className={`md:col-span-6 ${flip ? "md:order-1" : ""}`}>
        {chapter.strip ? (
          <div className="overflow-x-auto -mx-6 md:mx-0">
            <div className="flex gap-3 px-6 md:px-0 w-max">
              {chapter.strip.map((s) => (
                <div key={s.id} className="w-[60vw] md:w-[16rem]">
                  <AssetPlaceholder
                    asset={{
                      id: s.id,
                      type: "photograph",
                      orientation: "portrait",
                      resolution: "1200 × 1600 px",
                      aspect: "3:4",
                      purpose: s.label,
                      filename: s.filename,
                    }}
                    aspect="3/4"
                    minimal
                  />
                </div>
              ))}
            </div>
          </div>
        ) : chapter.assets ? (
          <div className="grid gap-3 grid-cols-2">
            {chapter.assets.map((a, k) => (
              <div key={a.id} className={k === 0 ? "col-span-2" : ""}>
                <AssetPlaceholder asset={a} aspect={k === 0 ? "3/2" : "4/5"} />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-black/10 bg-tulip/40 p-8 min-h-[320px] flex items-end">
            <div>
              <span className="type-mono text-[10px] text-black/50">A QUIET PAGE</span>
              <p className="mt-3 font-editorial text-2xl md:text-3xl text-black/80 max-w-md">
                {chapter.copy[0]}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function OrbitChapter({ chapter }) {
  const [selected, setSelected] = useState(chapter.versions[0].key);
  const active = chapter.versions.find((v) => v.key === selected);
  return (
    <section className="mt-24 grid md:grid-cols-12 gap-8 md:gap-16">
      <div className="md:col-span-5">
        <FadeUp>
          <span className="type-mono text-[10px] text-black/50">CHAPTER {chapter.number}</span>
          <h2 className="mt-4 font-editorial text-4xl md:text-6xl leading-[0.95] tracking-tight text-black">
            {chapter.heading}
          </h2>
          <p className="mt-6 text-base md:text-lg text-black/65 font-editorial max-w-md">
            Ten small versions. Tap any of them.
          </p>
        </FadeUp>
      </div>
      <div className="md:col-span-7">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {chapter.versions.map((v) => (
            <button
              key={v.key}
              data-testid={`why-version-${v.key}`}
              onClick={() => setSelected(v.key)}
              className={`text-left rounded-xl border p-4 min-h-[92px] transition-colors ${
                selected === v.key
                  ? "border-black bg-black text-tulip"
                  : "border-black/15 bg-transparent hover:border-black/40 text-black"
              }`}
            >
              <span className={`type-mono text-[9px] ${selected === v.key ? "text-tulip/70" : "text-black/50"}`}>
                {v.key.toUpperCase()}
              </span>
              <p className="mt-2 font-editorial text-lg leading-tight">{v.label}</p>
            </button>
          ))}
        </div>
        <motion.div
          key={active.key}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mt-6 rounded-2xl border border-black/15 p-6 md:p-8 min-h-[180px] bg-tulip/60"
          data-testid="why-version-detail"
        >
          <span className="type-mono text-[10px] text-black/50">ON {active.label.toUpperCase()}</span>
          <p className="mt-3 font-editorial text-2xl md:text-3xl leading-tight text-black/85 max-w-2xl">
            {active.copy}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
