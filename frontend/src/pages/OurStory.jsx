import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useLenis } from "@/hooks/useLenis";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useProgress } from "@/stores/progressStore";
import { STORY_SECTIONS } from "@/data/storySections";
import { AssetPlaceholder } from "@/components/media/AssetPlaceholder";
import { HandwrittenAccent } from "@/components/motion/HandwrittenAccent";
import { MagneticButton } from "@/components/motion/MagneticButton";

/**
 * Cinematic /our-story — 16 sections, each with its own animation kind.
 */
export default function OurStory() {
  useLenis();
  const reduce = useReducedMotion();
  const saveStoryPosition = useProgress((s) => s.saveStoryPosition);
  const storyPosition = useProgress((s) => s.storyPosition);
  const containerRef = useRef(null);
  const [activeIdx, setActiveIdx] = useState(0);

  // Restore reading position once
  useEffect(() => {
    if (!storyPosition) return;
    const el = document.getElementById(`story-section-${storyPosition.section_index}`);
    if (el && storyPosition.section_index > 0) {
      setTimeout(() => el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }), 400);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track active section
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute("data-idx"));
            setActiveIdx(idx);
            saveStoryPosition(idx, 0);
          }
        });
      },
      { threshold: 0.35 }
    );
    const nodes = document.querySelectorAll("[data-story-section]");
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [saveStoryPosition]);

  return (
    <div ref={containerRef} className="relative w-full bg-archive text-text-primary">
      {/* Fixed month indicator */}
      <div className="fixed top-24 left-4 md:left-8 z-30 pointer-events-none">
        <span className="type-mono text-[10px] text-text-muted">
          {STORY_SECTIONS[activeIdx]?.month}
        </span>
        <div className="mt-1 flex flex-col gap-1">
          {STORY_SECTIONS.map((_, i) => (
            <div
              key={i}
              className={`w-px h-3 transition-colors ${i === activeIdx ? "bg-lavender" : "bg-white/12"}`}
            />
          ))}
        </div>
      </div>

      {STORY_SECTIONS.map((section, i) => (
        <Section key={section.id} section={section} idx={i} />
      ))}
    </div>
  );
}

function SectionShell({ idx, id, children, className = "" }) {
  return (
    <section
      id={`story-section-${idx}`}
      data-idx={idx}
      data-story-section
      className={`relative w-full min-h-screen py-24 md:py-32 px-6 md:px-14 ${className}`}
      data-testid={`story-section-${id}`}
    >
      {children}
    </section>
  );
}

function Section({ section, idx }) {
  switch (section.kind) {
    case "split": return <BeforeUsSection section={section} idx={idx} />;
    case "hinge": return <MatchSection section={section} idx={idx} />;
    case "phone": return <PhoneSection section={section} idx={idx} />;
    case "lift": return <LiftSection section={section} idx={idx} />;
    case "confession": return <ConfessionSection section={section} idx={idx} />;
    case "kiss": return <KissSection section={section} idx={idx} />;
    case "cards": return <CardsSection section={section} idx={idx} />;
    case "align": return <AlignSection section={section} idx={idx} />;
    case "ring": return <RingSection section={section} idx={idx} />;
    case "birthday": return <BirthdaySection section={section} idx={idx} />;
    case "editorial-strip": return <EditorialStripSection section={section} idx={idx} />;
    case "strip": return <StripSection section={section} idx={idx} />;
    case "monolith": return <MonolithSection section={section} idx={idx} />;
    case "portal": return <PortalSection section={section} idx={idx} />;
    case "locked": return <LockedSection section={section} idx={idx} />;
    default: return null;
  }
}

// -----------------------------------------------------------------------------
// Section variants
// -----------------------------------------------------------------------------

function BeforeUsSection({ section, idx }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const leftX = useTransform(scrollYProgress, [0, 1], ["-40%", "10%"]);
  const rightX = useTransform(scrollYProgress, [0, 1], ["40%", "-10%"]);

  return (
    <SectionShell idx={idx} id={section.id}>
      <div ref={ref} className="relative min-h-[80vh]">
        <h2 className="font-editorial text-[18vw] md:text-[12vw] leading-[0.85] tracking-tighter text-white/8 select-none">
          {section.heading}
        </h2>
        <div className="mt-16 grid md:grid-cols-12 gap-6 items-center">
          <motion.div style={{ x: leftX }} className="md:col-span-4">
            <AssetPlaceholder asset={section.assets[0]} aspect="3/4" />
          </motion.div>
          <div className="md:col-span-4 max-w-md">
            {section.copy.map((line, i) => (
              <p key={i} className="text-base md:text-lg text-text-secondary mb-3 font-editorial">
                {line}
              </p>
            ))}
          </div>
          <motion.div style={{ x: rightX }} className="md:col-span-4">
            <AssetPlaceholder asset={section.assets[1]} aspect="3/4" />
          </motion.div>
        </div>
      </div>
    </SectionShell>
  );
}

function MatchSection({ section, idx }) {
  return (
    <SectionShell idx={idx} id={section.id}>
      <div className="grid md:grid-cols-12 gap-8 items-start">
        <div className="md:col-span-6 md:sticky md:top-32">
          <span className="type-mono text-[10px] text-lavender">{section.date} · MONTH ZERO</span>
          <h2 className="mt-4 font-editorial text-4xl md:text-6xl leading-[0.95] tracking-tight">
            {section.heading}
          </h2>
          <h3 className="mt-3 font-editorial text-2xl md:text-3xl text-text-secondary italic">
            {section.subheading}
          </h3>
          <div className="mt-8 space-y-3">
            {section.copy.map((line, i) => (
              <p key={i} className="text-base md:text-lg text-text-secondary max-w-lg font-editorial">
                {line}
              </p>
            ))}
          </div>
        </div>
        <div className="md:col-span-6 space-y-4">
          <AssetPlaceholder asset={section.assets[0]} aspect="9/19" className="md:max-w-xs" />
          <div className="grid grid-cols-2 gap-3">
            <AssetPlaceholder asset={section.assets[1]} aspect="4/5" />
            <AssetPlaceholder asset={section.assets[2]} aspect="4/5" />
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

function PhoneSection({ section, idx }) {
  const bubbles = [
    "hey",
    "hi",
    "so… were you actually going to reply?",
    "give me a moment. gathering personality.",
    "take your time, I'll wait",
    "what a boyfriend-in-training thing to say",
  ];
  return (
    <SectionShell idx={idx} id={section.id}>
      <div className="grid md:grid-cols-12 gap-8">
        <div className="md:col-span-6">
          <h2 className="font-editorial text-4xl md:text-6xl leading-[0.95] tracking-tight">
            {section.heading}
          </h2>
          <div className="mt-6 space-y-3">
            {section.copy.map((line, i) => (
              <p key={i} className="text-base md:text-lg text-text-secondary max-w-lg font-editorial">
                {line}
              </p>
            ))}
          </div>
          <HandwrittenAccent className="mt-6 block" rotate={-2}>
            (this is a fictional recreation — the real ones live only with us)
          </HandwrittenAccent>
        </div>
        <div className="md:col-span-6">
          <div className="max-w-sm mx-auto rounded-[36px] border border-white/12 bg-surface-1 p-5 relative overflow-hidden">
            <div className="type-mono text-[9px] text-text-muted flex justify-between mb-4">
              <span>18:47</span>
              <span>message · encrypted</span>
            </div>
            <div className="flex flex-col gap-2">
              {bubbles.map((b, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-10%" }}
                  transition={{ delay: i * 0.15, duration: 0.5 }}
                  className={`max-w-[80%] text-sm rounded-2xl px-4 py-2 ${
                    i % 2 === 0
                      ? "self-start bg-surface-3 text-text-primary"
                      : "self-end bg-lavender/85 text-archive"
                  }`}
                >
                  {b}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

function LiftSection({ section, idx }) {
  const [crushed, setCrushed] = useState(false);
  useEffect(() => {
    const iv = setInterval(() => setCrushed((c) => !c), 3200);
    return () => clearInterval(iv);
  }, []);
  return (
    <SectionShell idx={idx} id={section.id}>
      <div className="grid md:grid-cols-12 gap-8">
        <div className="md:col-span-6">
          <span className="type-mono text-[10px] text-lavender">{section.date}</span>
          <h2 className="mt-4 font-editorial text-4xl md:text-6xl leading-[0.95] tracking-tight">
            {section.heading}
          </h2>
          <h3 className="mt-3 font-editorial text-xl md:text-2xl italic text-text-secondary">
            {section.subheading}
          </h3>
          <div className="mt-6 space-y-3">
            {section.copy.map((line, i) => (
              <p key={i} className="text-base md:text-lg text-text-secondary max-w-lg font-editorial">
                {line}
              </p>
            ))}
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4 max-w-md">
            {section.stats.map((s) => (
              <div key={s.label} className="border-t border-white/15 pt-3">
                <div className="type-mono text-[9px] text-text-muted">{s.label}</div>
                <div className="font-editorial text-3xl mt-1">{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-6 flex items-center justify-center">
          <motion.div
            animate={crushed ? { x: [0, -6, 6, -3, 0] } : { x: 0 }}
            transition={{ duration: 0.4 }}
            className="relative w-full max-w-md aspect-[4/5] rounded-3xl overflow-hidden border border-white/10"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-surface-1 to-archive-soft" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-editorial text-6xl text-white/8">LIFT</span>
            </div>
            <motion.div
              animate={{ x: crushed ? "-6%" : "-46%" }}
              transition={{ duration: 1.2 }}
              className="absolute inset-y-0 left-0 w-1/2 bg-surface-2 border-r border-white/8"
            />
            <motion.div
              animate={{ x: crushed ? "6%" : "46%" }}
              transition={{ duration: 1.2 }}
              className="absolute inset-y-0 right-0 w-1/2 bg-surface-2 border-l border-white/8"
            />
            <motion.div
              animate={{ scale: crushed ? [1, 0.85, 1] : 1 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <span className="text-3xl" role="img" aria-label="hand">✋</span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </SectionShell>
  );
}

function ConfessionSection({ section, idx }) {
  const [heard, setHeard] = useState(false);
  return (
    <SectionShell idx={idx} id={section.id}>
      <div className="grid md:grid-cols-12 gap-8 items-start">
        <div className="md:col-span-7">
          <h2 className="font-editorial text-4xl md:text-6xl leading-[0.95] tracking-tight">
            {section.heading}
          </h2>
          <div className="mt-6 space-y-3">
            {section.copy.map((line, i) => (
              <p key={i} className="text-base md:text-lg text-text-secondary max-w-lg font-editorial">
                {line}
              </p>
            ))}
          </div>
          <div className="mt-8 flex items-center gap-4">
            <motion.div
              initial={{ opacity: 1, scale: 1 }}
              animate={{ opacity: [1, 1, 0.5, 0], scale: [1, 1, 0.98, 0.9] }}
              transition={{ duration: 4, repeat: Infinity, times: [0, 0.5, 0.8, 1] }}
              className="text-2xl font-editorial italic text-lavender"
            >
              Love you—
            </motion.div>
            <MagneticButton
              variant="ghost"
              size="sm"
              onClick={() => setHeard(true)}
              data-testid="story-confession-heard"
            >
              I heard it
            </MagneticButton>
          </div>
          {heard && (
            <p className="mt-4 font-hand text-2xl text-lavender-soft">
              Ayesha denies all allegations.
            </p>
          )}
        </div>
        <div className="md:col-span-5">
          <AssetPlaceholder asset={section.assets[0]} aspect="4/5" />
        </div>
      </div>
    </SectionShell>
  );
}

function KissSection({ section, idx }) {
  return (
    <SectionShell idx={idx} id={section.id}>
      <div className="grid md:grid-cols-12 gap-10 items-center">
        <div className="md:col-span-5">
          <span className="type-mono text-[10px] text-lavender">{section.date}</span>
          <h2 className="mt-4 font-editorial text-5xl md:text-7xl leading-[0.9] tracking-tight italic">
            {section.heading}
          </h2>
          <div className="mt-8 space-y-3">
            {section.copy.map((line, i) => (
              <p key={i} className="text-base md:text-lg text-text-secondary max-w-lg font-editorial">
                {line}
              </p>
            ))}
          </div>
        </div>
        <div className="md:col-span-7 relative aspect-[3/2]">
          <motion.div
            className="absolute inset-0 rounded-full"
            initial={{ filter: "blur(30px)", opacity: 0.6 }}
            whileInView={{ filter: "blur(6px)", opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 2 }}
            style={{
              background:
                "radial-gradient(circle at 40% 50%, rgba(243,167,196,0.35), transparent 40%), radial-gradient(circle at 60% 50%, rgba(184,156,255,0.35), transparent 40%)",
            }}
          />
          <div className="absolute inset-0">
            <AssetPlaceholder asset={section.assets[0]} aspect="3/2" className="opacity-90" />
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

function CardsSection({ section, idx }) {
  return (
    <SectionShell idx={idx} id={section.id}>
      <h2 className="font-editorial text-4xl md:text-6xl leading-[0.95] tracking-tight max-w-3xl">
        {section.heading}
      </h2>
      <div className="mt-10 grid md:grid-cols-4 gap-4">
        {section.cards.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 30, x: i % 2 === 0 ? -20 : 20 }}
            whileInView={{ opacity: 1, y: 0, x: 0 }}
            viewport={{ once: true, margin: "-15%" }}
            transition={{ duration: 0.8, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl border border-white/10 bg-surface-1 p-6 min-h-[220px] flex flex-col justify-between"
          >
            <span className="type-mono text-[10px] text-lavender/70">EXHIBIT {String(i + 1).padStart(2, "0")}</span>
            <div>
              <h3 className="font-editorial text-2xl leading-tight">{c.title}</h3>
              <p className="mt-3 text-sm text-text-secondary">{c.body}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </SectionShell>
  );
}

function AlignSection({ section, idx }) {
  return (
    <SectionShell idx={idx} id={section.id} className="bg-gradient-to-b from-archive to-surface-1">
      <div className="max-w-3xl mx-auto">
        <h2 className="font-editorial text-4xl md:text-6xl leading-[0.95] tracking-tight text-center">
          {section.heading}
        </h2>
        <div className="mt-12 grid md:grid-cols-2 gap-8">
          <motion.div
            initial={{ x: -30, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 1.2 }}
            className="space-y-3"
          >
            {section.copy.slice(0, 4).map((line, i) => (
              <p key={i} className="text-base md:text-lg text-text-secondary font-editorial">{line}</p>
            ))}
          </motion.div>
          <motion.div
            initial={{ x: 30, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 1.2, delay: 0.2 }}
            className="space-y-3"
          >
            {section.copy.slice(4).map((line, i) => (
              <p key={i} className="text-base md:text-lg text-text-secondary font-editorial">{line}</p>
            ))}
          </motion.div>
        </div>
      </div>
    </SectionShell>
  );
}

function RingSection({ section, idx }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const rotate = useTransform(scrollYProgress, [0, 1], [-6, 6]);
  return (
    <SectionShell idx={idx} id={section.id}>
      <div ref={ref} className="grid md:grid-cols-12 gap-10 items-center">
        <div className="md:col-span-6 relative">
          <motion.div
            className="absolute -inset-8 rounded-full border border-lavender/25"
            initial={{ scale: 0.6, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.4 }}
          />
          <span className="relative type-mono text-[10px] text-lavender">{section.date}</span>
          <h2 className="relative mt-4 font-editorial text-4xl md:text-6xl leading-[0.95] tracking-tight">
            {section.heading}
          </h2>
          <div className="mt-6 space-y-3">
            {section.copy.map((line, i) => (
              <p key={i} className="text-base md:text-lg text-text-secondary max-w-lg font-editorial">{line}</p>
            ))}
          </div>
        </div>
        <div className="md:col-span-6 grid grid-cols-2 gap-4">
          <AssetPlaceholder asset={section.assets[0]} aspect="4/5" />
          <motion.div style={{ rotate }}>
            <AssetPlaceholder asset={section.assets[1]} aspect="1/1" />
          </motion.div>
        </div>
      </div>
    </SectionShell>
  );
}

function BirthdaySection({ section, idx }) {
  return (
    <SectionShell idx={idx} id={section.id}>
      <div className="grid md:grid-cols-12 gap-10 items-start">
        <div className="md:col-span-5">
          <span className="type-mono text-[10px] text-lavender">{section.date}</span>
          <h2 className="mt-4 font-editorial text-4xl md:text-6xl leading-[0.95] tracking-tight">
            {section.heading}
          </h2>
          <div className="mt-6 space-y-3">
            {section.copy.map((line, i) => (
              <p key={i} className="text-base md:text-lg text-text-secondary max-w-lg font-editorial">{line}</p>
            ))}
          </div>
        </div>
        <div className="md:col-span-7 relative">
          <AssetPlaceholder asset={section.assets[0]} aspect="4/5" />
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.span
                key={i}
                className="absolute w-2 h-2 rounded-full bg-bow"
                style={{
                  left: `${(i * 19 + 5) % 92}%`,
                  top: `${(i * 27 + 12) % 90}%`,
                }}
                animate={{ y: [-6, 6, -6], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 3 + i, repeat: Infinity, ease: "easeInOut" }}
              />
            ))}
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

function EditorialStripSection({ section, idx }) {
  const [selected, setSelected] = useState(section.versions[0].key);
  const active = section.versions.find((v) => v.key === selected);
  return (
    <SectionShell idx={idx} id={section.id}>
      <h2 className="font-editorial text-5xl md:text-7xl leading-[0.9] tracking-tight max-w-3xl">
        {section.heading}
      </h2>
      <div className="mt-10 grid md:grid-cols-12 gap-6 items-start">
        <div className="md:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-2">
          {section.versions.map((v) => (
            <button
              key={v.key}
              data-testid={`version-${v.key}`}
              onClick={() => setSelected(v.key)}
              className={`text-left rounded-xl border p-4 min-h-[110px] transition-colors ${
                selected === v.key
                  ? "border-lavender/60 bg-surface-2 text-text-primary"
                  : "border-white/10 bg-surface-1 hover:border-white/20"
              }`}
            >
              <span className="type-mono text-[9px] text-lavender/70">{v.key.toUpperCase()}</span>
              <p className="mt-2 font-editorial text-lg leading-tight">{v.label}</p>
            </button>
          ))}
        </div>
        <div className="md:col-span-4 rounded-2xl border border-white/10 bg-surface-1 p-6 min-h-[240px]">
          <span className="type-mono text-[9px] text-lavender/70">SELECTED</span>
          <p className="mt-3 font-editorial text-2xl leading-tight">{active.label}</p>
          <p className="mt-4 font-hand text-2xl text-lavender-soft">{active.tagline}</p>
        </div>
      </div>
      <div className="mt-10 max-w-3xl space-y-3">
        {section.closing.map((c, i) => (
          <p key={i} className="text-base md:text-lg text-text-secondary font-editorial">{c}</p>
        ))}
      </div>
    </SectionShell>
  );
}

function StripSection({ section, idx }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const x = useTransform(scrollYProgress, [0, 1], ["10%", "-40%"]);
  return (
    <SectionShell idx={idx} id={section.id}>
      <div ref={ref}>
        <h2 className="font-editorial text-4xl md:text-6xl leading-[0.95] tracking-tight max-w-3xl">
          {section.heading}
        </h2>
        <div className="mt-6 space-y-3 max-w-2xl">
          {section.copy.map((line, i) => (
            <p key={i} className="text-base md:text-lg text-text-secondary font-editorial">{line}</p>
          ))}
        </div>
        <div className="mt-12 overflow-hidden">
          <motion.div style={{ x }} className="flex gap-4 w-max">
            {section.assets.map((a) => (
              <div key={a.id} className="w-[70vw] md:w-[36vw] flex-shrink-0">
                <AssetPlaceholder asset={a} aspect="3/2" />
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </SectionShell>
  );
}

function MonolithSection({ section, idx }) {
  return (
    <SectionShell idx={idx} id={section.id}>
      <div className="flex flex-col items-start">
        <motion.p
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.4 }}
          className="font-editorial text-[28vw] md:text-[18vw] leading-[0.85] tracking-tighter text-lavender/85 select-none"
        >
          10
        </motion.p>
        <div className="mt-8 max-w-3xl space-y-3">
          <h2 className="font-editorial text-3xl md:text-5xl leading-tight tracking-tight mb-6">
            {section.heading}
          </h2>
          {section.copy.map((line, i) => (
            <p key={i} className="text-base md:text-lg text-text-secondary font-editorial">{line}</p>
          ))}
        </div>
        <div className="mt-10 w-full max-w-4xl">
          <AssetPlaceholder asset={section.assets[0]} aspect="3/2" />
        </div>
      </div>
    </SectionShell>
  );
}

function PortalSection({ section, idx }) {
  return (
    <SectionShell idx={idx} id={section.id}>
      <h2 className="font-editorial text-5xl md:text-7xl leading-[0.9] tracking-tight max-w-3xl">
        {section.heading}
      </h2>
      <div className="mt-6 space-y-3 max-w-2xl">
        {section.copy.map((line, i) => (
          <p key={i} className="text-base md:text-lg text-text-secondary font-editorial">{line}</p>
        ))}
      </div>
      <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-3">
        {section.portals.map((p, i) => (
          <motion.div
            key={p.key}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05, duration: 0.6 }}
          >
            <Link
              to={p.path}
              data-testid={`portal-${p.key}`}
              data-cursor="open"
              className="block rounded-xl border border-white/10 bg-surface-1 p-5 min-h-[130px] hover:border-lavender/40 transition-colors"
            >
              <span className="type-mono text-[9px] text-lavender/70">{String(i + 1).padStart(2, "0")}</span>
              <p className="mt-3 font-editorial text-xl leading-tight">{p.label}</p>
            </Link>
          </motion.div>
        ))}
      </div>
    </SectionShell>
  );
}

function LockedSection({ section, idx }) {
  return (
    <SectionShell idx={idx} id={section.id}>
      <div className="max-w-2xl">
        {section.copy.map((line, i) => (
          <p key={i} className="font-editorial text-3xl md:text-5xl leading-tight text-text-primary/85 mb-6">
            {line}
          </p>
        ))}
        <div className="mt-10 flex flex-col items-start gap-4">
          <div className="w-24 h-32 rounded-t-full border border-lavender/30 bg-surface-1 flex items-center justify-center">
            <div className="w-6 h-6 rounded-sm border border-lavender/60" />
          </div>
          <MagneticButton to="/home" variant="ghost" size="md" data-testid="story-return">
            return to the archive
          </MagneticButton>
        </div>
      </div>
    </SectionShell>
  );
}
