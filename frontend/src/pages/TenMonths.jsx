import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useLenis } from "@/hooks/useLenis";
import { useProgress } from "@/stores/progressStore";
import { FINAL_LETTER } from "@/data/loveLetter";
import { AssetPlaceholder } from "@/components/media/AssetPlaceholder";
import { HandwrittenAccent } from "@/components/motion/HandwrittenAccent";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { SkullBow } from "@/components/mascot/SkullBow";
import { MaskReveal, FadeUp } from "@/components/motion/MaskReveal";

/**
 * /ten-months — the final anniversary reveal.
 * Locked until the hidden scroll is legitimately unlocked.
 */
export default function TenMonths() {
  useLenis();
  const navigate = useNavigate();
  const {
    finalRevealUnlocked,
    finalRevealViewed,
    markFinalViewed,
    hiddenScrollEligible,
    loaded,
  } = useProgress();
  const [openedLight, setOpenedLight] = useState(null);

  useEffect(() => {
    if (loaded && !finalRevealUnlocked) {
      // hard redirect if the URL is opened directly without unlock
      navigate("/home", { replace: true });
    }
  }, [loaded, finalRevealUnlocked, navigate]);

  useEffect(() => {
    if (finalRevealUnlocked && !finalRevealViewed) {
      markFinalViewed();
    }
  }, [finalRevealUnlocked, finalRevealViewed, markFinalViewed]);

  if (!loaded) return null;
  if (!finalRevealUnlocked) return null;

  return (
    <div className="relative w-full min-h-screen bg-archive text-text-primary">
      {/* Scene 1 */}
      <section className="min-h-[80vh] flex items-center px-6 md:px-14 pt-28">
        <MaskReveal>
          <p className="font-hand text-4xl md:text-6xl text-lavender-soft leading-tight">
            {FINAL_LETTER.scene1}
          </p>
        </MaskReveal>
      </section>

      {/* Scene 2 — Ten Month Lights */}
      <section className="px-6 md:px-14 py-24">
        <FadeUp>
          <span className="type-mono text-[10px] text-text-muted">TEN LIGHTS · ONE PER MONTH</span>
          <p className="mt-4 font-editorial text-2xl md:text-3xl text-text-secondary max-w-xl">
            Tap each light. Each opens a small memory from the month it lived.
          </p>
        </FadeUp>

        <div className="mt-12 grid grid-cols-5 md:grid-cols-10 gap-3 md:gap-4">
          {FINAL_LETTER.monthLights.map((light) => (
            <button
              key={light.month}
              onClick={() => setOpenedLight(light)}
              data-testid={`month-light-${light.month}`}
              className="group relative aspect-square rounded-full flex items-center justify-center"
            >
              <span className="absolute inset-0 rounded-full bg-lavender/10 group-hover:bg-lavender/25 transition-colors" />
              <span className="absolute inset-2 rounded-full border border-lavender/30 group-hover:border-lavender transition-colors" />
              <span className="relative type-mono text-[10px] md:text-xs text-lavender-soft">
                {String(light.month).padStart(2, "0")}
              </span>
            </button>
          ))}
        </div>
      </section>

      <AnimatePresence>
        {openedLight && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-archive/95 backdrop-blur-md flex items-center justify-center px-6"
            onClick={() => setOpenedLight(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="max-w-lg w-full rounded-2xl border border-lavender/30 bg-archive-soft p-8"
              onClick={(e) => e.stopPropagation()}
              data-testid="month-light-modal"
            >
              <span className="type-mono text-[10px] text-lavender">MONTH {openedLight.month}</span>
              <h3 className="mt-3 font-editorial text-3xl">{openedLight.label}</h3>
              <p className="mt-4 font-editorial text-lg text-text-secondary">
                {openedLight.note}
              </p>
              <button
                onClick={() => setOpenedLight(null)}
                className="mt-6 type-mono text-[10px] text-text-muted hover:text-lavender"
              >
                close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scene 3 — Title */}
      <section className="px-6 md:px-14 py-24 flex flex-col items-start">
        <FadeUp>
          <SkullBow size={54} mood="anniversary" />
        </FadeUp>
        <MaskReveal className="mt-8">
          <h1 className="font-editorial text-6xl md:text-9xl leading-[0.88] tracking-tighter">
            {FINAL_LETTER.scene3}
          </h1>
        </MaskReveal>
      </section>

      {/* Scene 4 — Letter */}
      <section className="px-6 md:px-14 py-24">
        <div className="grid md:grid-cols-12 gap-6">
          <div className="md:col-span-4 md:sticky md:top-32 self-start">
            <span className="type-mono text-[10px] text-text-muted">A LETTER · TEN MONTHS</span>
            <h2 className="mt-4 font-editorial text-4xl md:text-5xl leading-[0.95] tracking-tight">
              {FINAL_LETTER.letterHeading}
            </h2>
            <HandwrittenAccent className="mt-6 block" rotate={-2}>
              read slowly, Ayeshi
            </HandwrittenAccent>
          </div>
          <div className="md:col-span-7 md:col-start-6 space-y-3">
            {FINAL_LETTER.letter.map((line, i) => (
              <FadeUp key={i} delay={Math.min(i, 6) * 0.05}>
                <p className={`font-editorial text-lg md:text-2xl leading-relaxed ${line ? "text-text-primary/85" : "h-1"}`}>
                  {line || "\u00A0"}
                </p>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* Scene 5 — Voice letter */}
      <section className="px-6 md:px-14 py-16">
        <div className="grid md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-6">
            <span className="type-mono text-[10px] text-text-muted">VOICE LETTER · PLACEHOLDER</span>
            <h2 className="mt-3 font-editorial text-3xl md:text-5xl leading-tight">
              A voice, when text is not enough.
            </h2>
            <p className="mt-4 text-base text-text-secondary max-w-lg font-editorial">
              This slot holds an anniversary voice letter. Ameen will drop the file here.
              Until then, this is a considered pause — not a missing feature.
            </p>
          </div>
          <div className="md:col-span-6">
            <AssetPlaceholder
              asset={{
                id: "TEN-VOICE-LETTER",
                type: "audio",
                orientation: "landscape",
                resolution: "≤ 25 MB · m4a/mp3",
                aspect: "16:9",
                purpose: "Personal anniversary voice letter from Ameen",
                filename: "ten-months-voice-letter.mp3",
              }}
              aspect="16/9"
            />
          </div>
        </div>
      </section>

      {/* Scene 6 — Video */}
      <section className="px-6 md:px-14 py-16">
        <div className="grid md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-6 md:order-2">
            <span className="type-mono text-[10px] text-text-muted">VIDEO MESSAGE · PLACEHOLDER</span>
            <h2 className="mt-3 font-editorial text-3xl md:text-5xl leading-tight">
              A short film, meant just for you.
            </h2>
            <p className="mt-4 text-base text-text-secondary max-w-lg font-editorial">
              A minute of Ameen talking directly to you — poster frame, captions, no autoplay.
            </p>
          </div>
          <div className="md:col-span-6 md:order-1">
            <AssetPlaceholder
              asset={{
                id: "TEN-VIDEO-MESSAGE",
                type: "video",
                orientation: "landscape",
                resolution: "1080p · ≤ 90 s",
                aspect: "16:9",
                purpose: "Personal anniversary video message",
                filename: "ten-months-video-message.mp4",
              }}
              aspect="16/9"
            />
          </div>
        </div>
      </section>

      {/* Scene 7 — Montage */}
      <section className="px-6 md:px-14 py-16">
        <span className="type-mono text-[10px] text-text-muted">MONTAGE · MONTH 1 → MONTH 10</span>
        <h2 className="mt-3 font-editorial text-3xl md:text-5xl leading-tight max-w-3xl">
          A quiet chronological reel.
        </h2>
        <div className="mt-10 overflow-x-auto -mx-6 md:mx-0">
          <div className="flex gap-3 px-6 md:px-0 w-max">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="w-[70vw] md:w-[26vw] flex-shrink-0">
                <AssetPlaceholder
                  asset={{
                    id: `TEN-MONTAGE-${String(i + 1).padStart(2, "0")}`,
                    type: "photograph or short video",
                    orientation: "portrait",
                    resolution: "1080 × 1350 px",
                    aspect: "4:5",
                    purpose: `Month ${i + 1} — favourite frame`,
                    filename: `ten-months-montage-${String(i + 1).padStart(2, "0")}.webp`,
                  }}
                  aspect="4/5"
                  minimal
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Scene 8 — China */}
      <section className="px-6 md:px-14 py-24">
        <div className="grid md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-6">
            <span className="type-mono text-[10px] text-text-muted">A DREAM, POSTPONED · NOT CANCELLED</span>
            <div className="mt-6 space-y-3 max-w-xl">
              {FINAL_LETTER.chinaCopy.map((line, i) => (
                <p key={i} className="font-editorial text-2xl md:text-3xl text-text-primary/85 leading-tight">
                  {line}
                </p>
              ))}
            </div>
          </div>
          <div className="md:col-span-6 relative">
            <div className="apu-placeholder aspect-[16/10] flex items-center justify-center">
              <div className="relative w-full h-full flex items-center justify-center">
                <svg width="80%" height="60%" viewBox="0 0 400 200" fill="none">
                  <motion.path
                    d="M 40 130 Q 150 40 220 100 T 360 70"
                    stroke="#B89CFF"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 2.4, ease: "easeInOut" }}
                  />
                  <circle cx="40" cy="130" r="4" fill="#F3A7C4" />
                  <circle cx="360" cy="70" r="4" fill="#F3A7C4" />
                  <text x="46" y="145" className="type-mono" fontSize="8" fill="#7F7885">
                    HYDERABAD
                  </text>
                  <text x="330" y="60" className="type-mono" fontSize="8" fill="#7F7885">
                    CHINA
                  </text>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Scene 9 — Continue */}
      <section className="px-6 md:px-14 py-24">
        <div className="flex flex-col items-start gap-6">
          <p className="font-hand text-3xl md:text-4xl text-lavender-soft">
            The archive keeps growing.
          </p>
          <MagneticButton to="/home" variant="primary" size="lg" data-testid="ten-months-continue">
            continue our story
          </MagneticButton>
        </div>
      </section>
    </div>
  );
}
