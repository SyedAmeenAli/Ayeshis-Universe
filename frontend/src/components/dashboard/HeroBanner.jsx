import React, { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { SkullBow } from "@/components/mascot/SkullBow";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const HERO_VIDEO_URL = process.env.REACT_APP_HERO_VIDEO_URL || "";

/**
 * Full-width hero at the top of /home. Plays a personal video when
 * REACT_APP_HERO_VIDEO_URL is configured; otherwise falls back to an
 * animated lavender-particle placeholder so the page never looks broken.
 */
export function HeroBanner({ days, greetingText }) {
  const reducedMotion = useReducedMotion();
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  const { scrollY } = useScroll();
  const parallaxY = useTransform(scrollY, [0, 600], [0, reducedMotion ? 0 : 90]);
  const contentY = useTransform(scrollY, [0, 600], [0, reducedMotion ? 0 : 30]);
  const fade = useTransform(scrollY, [0, 420], [1, 0.25]);

  useEffect(() => {
    if (!HERO_VIDEO_URL || !videoRef.current) return;
    videoRef.current.play().catch(() => setVideoFailed(true));
  }, []);

  const showVideo = HERO_VIDEO_URL && !videoFailed;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[62vh] md:h-[68vh] min-h-[420px] rounded-3xl overflow-hidden border border-white/8 mb-10"
      data-testid="home-hero-banner"
    >
      {/* Media layer */}
      <motion.div className="absolute inset-0" style={{ y: parallaxY }}>
        {showVideo ? (
          <video
            ref={videoRef}
            className="w-full h-full object-cover object-top"
            src={HERO_VIDEO_URL}
            muted
            loop
            playsInline
            autoPlay
            onCanPlay={() => setVideoReady(true)}
            onError={() => setVideoFailed(true)}
          />
        ) : (
          <HeroFallback reducedMotion={reducedMotion} />
        )}
      </motion.div>

      {/* Scrim for legible text over any footage */}
      <div className="absolute inset-0 bg-gradient-to-t from-archive via-archive/35 to-archive/10" />
      <div className="absolute inset-0 bg-gradient-to-r from-archive/60 via-transparent to-archive/20" />

      {/* Content */}
      <motion.div
        style={{ y: contentY, opacity: fade }}
        className="relative z-10 h-full w-full flex flex-col justify-end p-6 md:p-12"
      >
        <span className="type-mono text-[10px] tracking-[0.2em] text-lavender-soft/90">
          PRIVATE ARCHIVE / 1709 · DAY {days}
        </span>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="mt-3 font-editorial text-6xl md:text-8xl leading-[0.92] tracking-tight text-text-primary"
          data-testid="home-anniversary-heading"
        >
          Happy Anniversary,
          <br />
          <span className="text-lavender">Ayeshi</span> <span className="text-bow">♡</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="mt-4 font-editorial text-lg md:text-2xl text-text-secondary max-w-lg"
        >
          {greetingText} — ten months, one private universe.
        </motion.p>
      </motion.div>

      {/* corner mascot, only when using the fallback so it never fights real footage */}
      {!showVideo && (
        <div className="absolute top-6 right-6 z-10 opacity-90">
          <SkullBow size={40} mood="alert" />
        </div>
      )}
    </div>
  );
}

function HeroFallback({ reducedMotion }) {
  return (
    <div className="relative w-full h-full bg-[radial-gradient(ellipse_at_top_right,_rgba(139,92,246,0.28),_transparent_60%),radial-gradient(ellipse_at_bottom_left,_rgba(243,167,196,0.16),_transparent_55%),#0b0b0f]">
      {!reducedMotion && (
        <div className="absolute inset-0 apu-hero-particles" aria-hidden="true">
          {Array.from({ length: 24 }).map((_, i) => (
            <span
              key={i}
              className="apu-hero-particle"
              style={{
                left: `${(i * 41) % 100}%`,
                animationDelay: `${(i % 8) * 0.9}s`,
                animationDuration: `${8 + (i % 6)}s`,
              }}
            />
          ))}
        </div>
      )}
      <div className="absolute inset-0 apu-shimmer opacity-30 pointer-events-none" />
      <div className="absolute bottom-6 left-6 type-mono text-[9px] text-lavender/70">
        ASSET ID: HOME-HERO-VIDEO · Drop an anniversary clip at REACT_APP_HERO_VIDEO_URL
      </div>
    </div>
  );
}
