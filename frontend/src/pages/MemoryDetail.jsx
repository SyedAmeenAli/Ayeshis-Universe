import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { apiGet, apiPost } from "@/lib/api";
import { AssetPlaceholder } from "@/components/media/AssetPlaceholder";
import { HandwrittenAccent } from "@/components/motion/HandwrittenAccent";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { useProgress } from "@/stores/progressStore";
import { Heart, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { photoForAssetId } from "@/lib/realAssets";
import { photoForAyeshaAssetId } from "@/lib/ayeshaPhotos";

const LONG_PRESS_MS = 3000;

export default function MemoryDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [memory, setMemory] = useState(null);
  const [status, setStatus] = useState("loading");

  const hiddenScrollEligible = useProgress((s) => s.hiddenScrollEligible);
  const hiddenScrollFound = useProgress((s) => s.hiddenScrollFound);
  const unlockHiddenScroll = useProgress((s) => s.unlockHiddenScroll);
  const finalRevealUnlocked = useProgress((s) => s.finalRevealUnlocked);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    (async () => {
      try {
        const data = await apiGet(`/memories/${slug}`);
        if (!cancelled) {
          setMemory(data);
          setStatus("ready");
        }
      } catch (e) {
        if (!cancelled) setStatus("not-found");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  async function toggleFav() {
    if (!memory) return;
    const next = !memory.favourite;
    setMemory({ ...memory, favourite: next });
    try {
      await apiPost(`/memories/${memory.slug}/favourite`, { favourite: next });
    } catch (e) {
      setMemory({ ...memory, favourite: !next });
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <span className="type-mono text-[10px] text-text-muted animate-pulse">
          retrieving memory…
        </span>
      </div>
    );
  }
  if (status === "not-found" || !memory) {
    return (
      <div className="min-h-screen w-full pt-28 px-6">
        <p className="type-mono text-[10px] text-text-muted">memory not found</p>
        <MagneticButton to="/memories" variant="ghost" className="mt-4" data-testid="memory-back">
          back to vault
        </MagneticButton>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full pt-24 pb-24 px-6 md:px-10 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate("/memories")}
          data-testid="memory-back"
          className="inline-flex items-center gap-2 type-mono text-[10px] text-text-muted hover:text-lavender transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          back to the vault
        </button>
        <button
          onClick={toggleFav}
          data-testid="memory-favourite"
          className={`inline-flex items-center gap-2 type-mono text-[10px] transition-colors ${
            memory.favourite ? "text-bow" : "text-text-muted hover:text-bow"
          }`}
        >
          <Heart className="w-3 h-3" fill={memory.favourite ? "currentColor" : "none"} />
          {memory.favourite ? "favourited" : "mark favourite"}
        </button>
      </div>

      <div className="grid md:grid-cols-12 gap-8 md:gap-14 items-start">
        <div className="md:col-span-6 relative">
          <AssetPlaceholder asset={memory.cover_asset} aspect="4/5" />

          {/* Gallery strip — a mix of "her and I" couple photos plus solo
              shots of Ayesha, all real, none from the cover slot above */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <img
                key={`couple-${i}`}
                src={photoForAssetId(`MEM-GALLERY-${memory.slug}-${i}`)}
                alt=""
                className="w-full aspect-square rounded-lg object-cover"
                data-testid={`memory-gallery-couple-${i}`}
              />
            ))}
            {Array.from({ length: 3 }).map((_, i) => (
              <img
                key={`solo-${i}`}
                src={photoForAyeshaAssetId(`MEM-GALLERY-${memory.slug}-${i}`)}
                alt=""
                className="w-full aspect-square rounded-lg object-cover"
                data-testid={`memory-gallery-solo-${i}`}
              />
            ))}
          </div>

          {memory.hidden_bow && (
            <HiddenBow
              eligible={hiddenScrollEligible}
              alreadyFound={hiddenScrollFound}
              onFound={async () => {
                const ok = await unlockHiddenScroll();
                if (ok) {
                  toast("You found what was never meant to be obvious.");
                }
              }}
            />
          )}
        </div>

        <div className="md:col-span-6">
          <span className="type-mono text-[10px] text-lavender">
            {memory.memory_date} · {memory.category?.replace(/_/g, " ")}
          </span>
          <h1 className="mt-4 font-editorial text-5xl md:text-6xl leading-[0.95] tracking-tight">
            {memory.title}
          </h1>
          <p className="mt-4 font-editorial text-xl md:text-2xl text-text-secondary italic">
            {memory.short_caption}
          </p>
          <div className="mt-8 space-y-3 max-w-lg">
            <p className="text-base md:text-lg text-text-secondary font-editorial">
              {memory.body}
            </p>
          </div>
          {memory.annotation && (
            <HandwrittenAccent className="mt-8 block" rotate={-2}>
              {memory.annotation}
            </HandwrittenAccent>
          )}
          <div className="mt-8 flex flex-wrap gap-2">
            {(memory.tags || []).map((t) => (
              <span
                key={t}
                className="type-mono text-[9px] text-text-muted border border-white/10 px-2 py-0.5 rounded-full"
              >
                {t}
              </span>
            ))}
          </div>

          {memory.hidden_bow && finalRevealUnlocked && (
            <div className="mt-10 rounded-xl border border-lavender/30 bg-lavender/5 p-5">
              <p className="type-mono text-[10px] text-lavender">FINAL FILE UNLOCKED</p>
              <p className="mt-2 font-editorial text-xl">The tenth month is waiting.</p>
              <MagneticButton to="/ten-months" variant="primary" className="mt-4" data-testid="memory-open-final">
                open ten months
              </MagneticButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function HiddenBow({ eligible, alreadyFound, onFound }) {
  const [progress, setProgress] = useState(0);
  const [holding, setHolding] = useState(false);
  const [revealed, setRevealed] = useState(alreadyFound);
  const [status, setStatus] = useState("idle");
  const startRef = useRef(0);
  const rafRef = useRef(0);

  function begin() {
    if (revealed) return;
    if (!eligible) {
      setStatus("not-eligible");
      return;
    }
    startRef.current = performance.now();
    setHolding(true);
    setStatus("holding");
    const step = () => {
      const elapsed = performance.now() - startRef.current;
      const pct = Math.min(1, elapsed / LONG_PRESS_MS);
      setProgress(pct);
      if (pct < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        cancelAnimationFrame(rafRef.current);
        setHolding(false);
        setRevealed(true);
        setStatus("done");
        onFound?.();
      }
    };
    rafRef.current = requestAnimationFrame(step);
  }

  function end() {
    cancelAnimationFrame(rafRef.current);
    if (!revealed) {
      setProgress(0);
      setHolding(false);
      if (status !== "not-eligible") setStatus("idle");
    }
  }

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const size = 68;
  const stroke = 3;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dashOffset = c - progress * c;

  return (
    <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 z-10">
      <button
        onMouseDown={begin}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={begin}
        onTouchEnd={end}
        onContextMenu={(e) => e.preventDefault()}
        className="relative w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-lavender/50"
        data-testid="hidden-bow"
        aria-label="Long press the hidden bow"
      >
        <svg className="absolute inset-0" width="100%" height="100%" viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            className="apu-ring-track"
            strokeWidth={stroke}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            className="apu-ring-fill"
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>
        {/* tiny bow */}
        <svg width="24" height="16" viewBox="0 0 40 24" fill="none">
          <path d="M 8 12 Q -2 4 12 4 Q 18 6 20 12" fill="#F3A7C4" />
          <path d="M 32 12 Q 42 4 28 4 Q 22 6 20 12" fill="#F3A7C4" />
          <circle cx="20" cy="12" r="3" fill="#B89CFF" />
        </svg>
      </button>

      <AnimatePresence>
        {status === "not-eligible" && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute -top-14 right-0 whitespace-nowrap"
          >
            <span className="type-mono text-[9px] text-text-muted bg-archive-soft/80 backdrop-blur px-3 py-1 rounded-full border border-white/10">
              explore more of the archive first
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {revealed && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute -top-4 right-full mr-3 w-64 rounded-xl border border-lavender/40 bg-archive-soft/90 backdrop-blur p-4"
            data-testid="hidden-scroll"
          >
            <p className="font-hand text-xl text-lavender-soft leading-tight">
              You found what was never meant to be obvious.
            </p>
            <MagneticButton
              to="/ten-months"
              variant="primary"
              size="sm"
              className="mt-3"
              data-testid="hidden-scroll-open"
            >
              unlock the tenth month
            </MagneticButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
