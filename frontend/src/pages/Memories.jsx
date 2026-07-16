import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { apiGet } from "@/lib/api";
import { AssetPlaceholder } from "@/components/media/AssetPlaceholder";
import { useProgress } from "@/stores/progressStore";
import { Search, Heart } from "lucide-react";

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "our_firsts", label: "Our Firsts" },
  { key: "months", label: "Months" },
  { key: "photos", label: "Photos" },
  { key: "things_only_we_understand", label: "Things Only We Understand" },
];

export default function Memories() {
  const [memories, setMemories] = useState([]);
  const [status, setStatus] = useState("loading");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [showFavourites, setShowFavourites] = useState(false);
  const hiddenScrollEligible = useProgress((s) => s.hiddenScrollEligible);
  const hiddenScrollFound = useProgress((s) => s.hiddenScrollFound);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiGet("/memories");
        if (!cancelled) {
          setMemories(data);
          setStatus("ready");
        }
      } catch (e) {
        if (!cancelled) setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    return memories.filter((m) => {
      if (category !== "all" && m.category !== category) return false;
      if (showFavourites && !m.favourite) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        m.title?.toLowerCase().includes(q) ||
        m.short_caption?.toLowerCase().includes(q) ||
        (m.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [memories, category, showFavourites, query]);

  return (
    <div className="min-h-screen w-full pt-28 pb-24 px-6 md:px-10 max-w-[1440px] mx-auto">
      <div className="flex flex-col gap-3 mb-10">
        <span className="type-mono text-[10px] text-text-muted">PRIVATE ARCHIVE / MEMORIES</span>
        <h1 className="font-editorial text-5xl md:text-7xl leading-[0.95] tracking-tight">
          Memory Vault
        </h1>
        <p className="text-base md:text-lg text-text-secondary max-w-2xl font-editorial">
          Places, dates and evidence that we happened. Long-press a memory to inspect it — some
          of them are holding something else.
        </p>
      </div>

      {hiddenScrollEligible && !hiddenScrollFound && (
        <div className="mb-6 rounded-xl border border-lavender/25 bg-lavender/5 p-3 flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-lavender animate-pulse" />
          <p className="font-hand text-xl text-lavender-soft">
            the final message is hidden where the beginning is remembered
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 md:items-center mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            data-testid="memories-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="search for a moment…"
            className="w-full bg-surface-1 border border-white/10 rounded-full pl-10 pr-4 py-3 text-sm outline-none focus:border-lavender/50 transition-colors"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              data-testid={`memories-filter-${c.key}`}
              className={`px-4 py-2 rounded-full text-xs uppercase tracking-wider border transition-colors ${
                category === c.key
                  ? "bg-lavender text-archive border-lavender"
                  : "border-white/12 text-text-secondary hover:border-white/30"
              }`}
            >
              {c.label}
            </button>
          ))}
          <button
            onClick={() => setShowFavourites((v) => !v)}
            data-testid="memories-filter-fav"
            className={`px-4 py-2 rounded-full text-xs uppercase tracking-wider border transition-colors flex items-center gap-2 ${
              showFavourites
                ? "bg-bow text-archive border-bow"
                : "border-white/12 text-text-secondary hover:border-white/30"
            }`}
          >
            <Heart className="w-3 h-3" fill={showFavourites ? "currentColor" : "none"} />
            favourites
          </button>
        </div>
      </div>

      {/* Timeline rail */}
      <div className="hidden md:block relative pl-4 mb-8">
        <div className="absolute left-0 top-1 bottom-1 w-px bg-white/12" />
        <div className="flex gap-4 flex-wrap">
          {memories.slice(0, 8).map((m) => (
            <a
              key={m.id}
              href={`#memory-${m.slug}`}
              className="type-mono text-[9px] text-text-muted hover:text-lavender transition-colors"
            >
              {m.memory_date}
            </a>
          ))}
        </div>
      </div>

      {status === "loading" && (
        <p className="type-mono text-[10px] text-text-muted animate-pulse">retrieving archive…</p>
      )}
      {status === "error" && (
        <p className="type-mono text-[10px] text-danger-red">
          The archive could not reach the server. Progress remains safe on this device.
        </p>
      )}

      {status === "ready" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m, i) => (
            <MemoryCard key={m.id} memory={m} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function MemoryCard({ memory, index }) {
  return (
    <motion.div
      id={`memory-${memory.slug}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.7, delay: (index % 6) * 0.05, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        to={`/memories/${memory.slug}`}
        data-testid={`memory-card-${memory.slug}`}
        data-cursor="open"
        className="block rounded-2xl border border-white/10 bg-surface-1 overflow-hidden hover:border-lavender/40 transition-colors"
      >
        <AssetPlaceholder asset={memory.cover_asset} aspect="3/4" minimal />
        <div className="p-5">
          <div className="flex items-center justify-between">
            <span className="type-mono text-[9px] text-lavender/80">
              {memory.memory_date}
            </span>
            {memory.favourite && (
              <Heart className="w-3 h-3 text-bow" fill="currentColor" />
            )}
          </div>
          <h3 className="mt-2 font-editorial text-2xl leading-tight">{memory.title}</h3>
          <p className="mt-2 text-sm text-text-secondary">{memory.short_caption}</p>
          <div className="mt-3 flex flex-wrap gap-1">
            {(memory.tags || []).slice(0, 3).map((t) => (
              <span
                key={t}
                className="type-mono text-[9px] text-text-muted border border-white/10 px-2 py-0.5 rounded-full"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
