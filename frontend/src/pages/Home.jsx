import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useProgress } from "@/stores/progressStore";
import { SkullBow } from "@/components/mascot/SkullBow";
import { HandwrittenAccent } from "@/components/motion/HandwrittenAccent";
import { RELATIONSHIP_START } from "@/lib/config";
import { ArrowUpRight, Lock } from "lucide-react";

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Still awake, Ayeshi";
  if (h < 12) return "Good morning, Ayeshi";
  if (h < 17) return "Good afternoon, Ayeshi";
  if (h < 21) return "Good evening, Ayeshi";
  return "Good night, Ayeshi";
}

function daysTogether() {
  const start = new Date(RELATIONSHIP_START).getTime();
  return Math.max(0, Math.floor((Date.now() - start) / (1000 * 60 * 60 * 24)));
}

const CARDS = [
  {
    id: "our-story",
    to: "/our-story",
    label: "Our Story",
    tagline: "Ten months, told properly.",
    className: "md:col-span-8 md:row-span-2",
    tint: "story",
  },
  {
    id: "ayesha",
    to: "/ayesha",
    label: "Ayesha",
    tagline: "A medically necessary amount of Ayesha.",
    className: "md:col-span-4 md:row-span-3",
    tint: "editorial",
  },
  {
    id: "memories",
    to: "/memories",
    label: "Memory Vault",
    tagline: "Places, dates and evidence that we happened.",
    className: "md:col-span-4",
    tint: "archive",
  },
  {
    id: "why",
    to: "/why-i-love-you",
    label: "Why I Love You",
    tagline: "The long answer.",
    className: "md:col-span-4",
    tint: "romantic",
  },
  {
    id: "case",
    to: "/games/case-1709",
    label: "CASE 1709",
    tagline: "Ameen is missing. Recover him.",
    className: "md:col-span-6",
    tint: "detective",
  },
  {
    id: "wreck-room",
    to: "/wreck-room",
    label: "Wreck Room",
    tagline: "For professional Ameen destruction.",
    className: "md:col-span-3",
    tint: "comic",
  },
  {
    id: "our-song",
    to: "/our-song",
    label: "Our Song",
    tagline: "Some songs begin to feel like a person.",
    className: "md:col-span-3",
    tint: "song",
  },
  {
    id: "safe-space",
    to: "/safe-space",
    label: "Safe Space",
    tagline: "For whatever your heart is carrying.",
    className: "md:col-span-4",
    tint: "calm",
  },
  {
    id: "calendar",
    to: "/calendar",
    label: "Our Calendar",
    tagline: "Book your baby boy.",
    className: "md:col-span-4",
    tint: "calendar",
  },
  {
    id: "ameen",
    to: "/ameen",
    label: "Ameen",
    tagline: "Unfortunately, the boyfriend also exists.",
    className: "md:col-span-4",
    tint: "muted",
  },
];

const TINTS = {
  story: "from-lavender/8 via-transparent to-transparent",
  editorial: "from-bow/6 via-transparent to-transparent",
  archive: "from-surface-3/50 via-transparent to-transparent",
  romantic: "from-tulip/6 via-transparent to-transparent",
  detective: "from-kuromi/10 via-transparent to-transparent",
  comic: "from-red-500/6 via-transparent to-transparent",
  song: "from-lavender-soft/6 via-transparent to-transparent",
  calm: "from-lavender/6 via-transparent to-transparent",
  calendar: "from-bow/8 via-transparent to-transparent",
  muted: "from-white/5 via-transparent to-transparent",
};

export default function Home() {
  const {
    hiddenScrollEligible,
    hiddenScrollFound,
    finalRevealUnlocked,
    sectionsExplored,
  } = useProgress();

  const [tickIdx, setTickIdx] = useState(0);
  const rotatingLines = useMemo(
    () => [
      "Meku neened aari.",
      "Meku bhook lagri.",
      "Meku nahi padhna hai.",
      "I need me time.",
      "Hum toh aise hi hai.",
      "Pungun detected nearby.",
    ],
    []
  );
  useEffect(() => {
    const iv = setInterval(() => setTickIdx((i) => (i + 1) % rotatingLines.length), 4500);
    return () => clearInterval(iv);
  }, [rotatingLines.length]);

  const explored = sectionsExplored.length;
  const days = daysTogether();

  return (
    <div className="min-h-screen w-full pt-24 md:pt-28 pb-16 px-5 md:px-10 max-w-[1440px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
        <div>
          <span className="type-mono text-[10px] text-text-muted">
            PRIVATE ARCHIVE / 1709 · DAY {days}
          </span>
          <h1
            className="mt-3 font-editorial text-5xl md:text-7xl leading-[0.95] tracking-tight"
            data-testid="home-greeting"
          >
            {greeting()} <span className="text-lavender">♡</span>
          </h1>
          <p className="mt-3 font-editorial text-lg md:text-xl text-text-secondary max-w-md">
            Ten months. One private universe.
          </p>
        </div>

        <div className="flex flex-col items-start md:items-end gap-3">
          <ProgressRing value={Math.min(1, explored / 8)} />
          <motion.p
            key={rotatingLines[tickIdx]}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-hand text-2xl text-lavender-soft"
            data-testid="home-rotating-line"
          >
            {rotatingLines[tickIdx]}
          </motion.p>
        </div>
      </div>

      {/* Bento grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 auto-rows-[minmax(140px,auto)]">
        {CARDS.map((card, i) => (
          <BentoCard key={card.id} card={card} index={i} />
        ))}
        <LockedFinalCard unlocked={finalRevealUnlocked} />
      </div>

      {/* Hidden ink clue — appears once eligible */}
      {hiddenScrollEligible && !hiddenScrollFound && (
        <div className="fixed bottom-24 md:bottom-8 right-6 md:right-10 z-30 pointer-events-none">
          <motion.div
            className="apu-ink-clue"
            data-testid="ink-clue"
          >
            <Link
              to="/memories/sep-17-the-match"
              className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-lavender/40 bg-archive-soft/70 backdrop-blur px-3 py-1.5"
              data-cursor="open"
            >
              <span className="w-2 h-2 rounded-full bg-lavender animate-pulse" />
              <span className="type-mono text-[9px] text-lavender">
                the final message is hidden where the beginning is remembered
              </span>
            </Link>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function ProgressRing({ value }) {
  const size = 84;
  const stroke = 3;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - value * c;
  return (
    <div className="relative" data-testid="home-progress-ring">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} className="apu-ring-track" fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          className="apu-ring-fill"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="type-mono text-[9px] text-text-muted">explored</span>
        <span className="font-editorial text-lg leading-none">{Math.round(value * 100)}%</span>
      </div>
    </div>
  );
}

function BentoCard({ card, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.05 * index, ease: [0.22, 1, 0.36, 1] }}
      className={`relative overflow-hidden rounded-2xl border border-white/8 bg-surface-1 min-h-[160px] ${card.className} group`}
      data-testid={`bento-${card.id}`}
    >
      <Link
        to={card.to}
        className="block h-full w-full p-5 md:p-6 relative"
        data-cursor="open"
      >
        <div
          className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${TINTS[card.tint]} opacity-70`}
        />
        <div className="absolute inset-0 border border-transparent group-hover:border-lavender/25 transition-colors duration-500 rounded-2xl pointer-events-none" />

        {/* corner id */}
        <span className="type-mono text-[9px] text-text-muted absolute top-4 right-4">
          {String(index + 1).padStart(2, "0")}
        </span>

        <div className="relative z-10 h-full flex flex-col justify-between gap-6">
          <div>
            <span className="type-mono text-[9px] text-lavender/80">
              {card.tint.toUpperCase()}
            </span>
            <h3 className="mt-3 font-editorial text-2xl md:text-3xl leading-tight">
              {card.label}
            </h3>
            <p className="mt-2 text-sm text-text-secondary max-w-[24ch]">
              {card.tagline}
            </p>
          </div>
          <span className="inline-flex items-center gap-1 self-end type-mono text-[9px] text-lavender group-hover:gap-2 transition-all">
            open <ArrowUpRight className="w-3 h-3" />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

function LockedFinalCard({ unlocked }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.6 }}
      className={`relative overflow-hidden rounded-2xl border md:col-span-12 min-h-[140px] ${
        unlocked ? "border-lavender/30 bg-gradient-to-br from-surface-2 to-archive-soft" : "border-white/8 bg-surface-1"
      }`}
      data-testid="bento-final"
    >
      {unlocked ? (
        <Link to="/ten-months" data-cursor="open" className="block h-full w-full p-6 md:p-8">
          <span className="type-mono text-[9px] text-lavender">UNLOCKED</span>
          <div className="mt-2 flex items-center justify-between gap-6 flex-wrap">
            <h3 className="font-editorial text-3xl md:text-4xl">The tenth month is waiting.</h3>
            <HandwrittenAccent rotate={-1}>open, Ayeshi ♡</HandwrittenAccent>
          </div>
        </Link>
      ) : (
        <div className="p-6 md:p-8 flex items-center justify-between gap-6 flex-wrap">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full border border-white/12 flex items-center justify-center">
              <Lock className="w-4 h-4 text-text-muted" />
            </div>
            <div>
              <span className="type-mono text-[9px] text-text-muted">LOCKED FINAL FILE</span>
              <h3 className="mt-2 font-editorial text-2xl md:text-3xl text-text-primary/80">
                Requires the hidden scroll.
              </h3>
              <p className="mt-1 text-sm text-text-secondary">
                Explore the archive. Something is waiting to be discovered.
              </p>
            </div>
          </div>
          <SkullBow size={42} mood="sleepy" />
        </div>
      )}
    </motion.div>
  );
}
