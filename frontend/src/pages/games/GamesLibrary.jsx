import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { fetchGames, fetchStats } from "@/lib/gamesApi";
import { SkullBow } from "@/components/mascot/SkullBow";
import { ArrowUpRight } from "lucide-react";
import { COVER_IMAGES } from "@/lib/coverImages";

const GAMES = [
  { key: "case-1709", label: "CASE 1709", tagline: "Ameen is missing. Recover him.", difficulty: "Very Hard", est: "90–120 min", to: "/games/case-1709", size: "featured", theme: "detective", cover: COVER_IMAGES["case-1709"] },
  { key: "jigsaw", label: "Us, But Broken", tagline: "A jigsaw of us. Somehow, we still fit.", difficulty: "Adjustable", est: "5–20 min", to: "/games/jigsaw", theme: "romantic", cover: COVER_IMAGES.jigsaw },
  { key: "timeline", label: "Relationship Timeline", tagline: "Arrange our history without cheating.", difficulty: "Medium", est: "5–10 min", to: "/games/timeline", theme: "archive", cover: COVER_IMAGES.timeline },
  { key: "ameen-quiz", label: "How Well Do You Know Baby Boy?", tagline: "Cute, questionable, competitive.", difficulty: "Easy → Hard", est: "3–8 min", to: "/games/ameen-quiz", theme: "quiz", cover: COVER_IMAGES["ameen-quiz"] },
  { key: "sushi-stack", label: "Sushi Stack", tagline: "Build a tower with real physics.", difficulty: "Chaotic", est: "2–10 min", to: "/games/sushi-stack", theme: "sushi", cover: COVER_IMAGES["sushi-stack"] },
  { key: "find-koko", label: "Find Chota Koko", tagline: "Twelve hidden things. Do not miss dignity.", difficulty: "Cozy", est: "4–15 min", to: "/games/find-koko", theme: "hidden", cover: COVER_IMAGES["find-koko"] },
];

const ACHIEVEMENTS = {
  "jigsaw": "WE STILL FIT",
  "timeline": "OFFICIAL RELATIONSHIP HISTORIAN",
  "ameen-quiz": "CERTIFIED AYESHI",
  "sushi-stack": "CERTIFIED SUSHI ENGINEER",
  "find-koko": "CHOTA KOKO RECOVERY SPECIALIST",
  "case-1709": "MASTER DETECTIVE — AYESHA",
};

export default function GamesLibrary() {
  const [games, setGames] = useState({});
  const [stats, setStats] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [g, s] = await Promise.all([fetchGames(), fetchStats()]);
        if (!cancelled) {
          setGames(g.games || {});
          setStats(s);
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

  return (
    <div className="min-h-screen w-full pt-28 pb-24 px-6 md:px-10 max-w-[1440px] mx-auto">
      <div className="flex flex-col gap-3 mb-10">
        <span className="type-mono text-[10px] text-text-muted">PRIVATE ARCHIVE / PLAYGROUND</span>
        <h1 className="font-editorial text-5xl md:text-7xl leading-[0.95] tracking-tight">
          Playground
        </h1>
        <p className="text-base md:text-lg text-text-secondary max-w-2xl font-editorial">
          Cute, stupid, unnecessarily competitive. One serious detective case. All save automatically.
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          <StatCard label="games completed" value={stats.games_completed} testid="stat-completed" />
          <StatCard label="highest quiz" value={`${stats.highest_quiz_score}`} testid="stat-quiz" />
          <StatCard label="best sushi" value={`${stats.best_sushi_score}`} testid="stat-sushi" />
          <StatCard label="hidden objects" value={`${stats.hidden_objects_found}/12`} testid="stat-koko" />
        </div>
      )}

      {status === "loading" && <p className="type-mono text-[10px] text-text-muted animate-pulse">loading playground…</p>}
      {status === "error" && <p className="type-mono text-[10px] text-danger-red">Could not reach playground.</p>}

      {status === "ready" && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 auto-rows-[minmax(180px,auto)]">
          {GAMES.map((g, i) => (
            <GameCard key={g.key} game={g} save={games[g.key]} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, testid }) {
  return (
    <div className="rounded-xl border border-white/10 bg-surface-1 p-4" data-testid={testid}>
      <span className="type-mono text-[9px] text-text-muted">{label}</span>
      <p className="mt-2 font-editorial text-2xl">{value}</p>
    </div>
  );
}

function GameCard({ game, save, index }) {
  const isFeatured = game.size === "featured";
  const status = save?.status || "not_started";
  const bestScore = save?.best_score || 0;
  const completed = status === "completed";

  const classes = isFeatured ? "md:col-span-12" : "md:col-span-4";

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.05 * index, ease: [0.22, 1, 0.36, 1] }}
      className={`relative overflow-hidden rounded-2xl border ${completed ? "border-lavender/40" : "border-white/10"} bg-surface-1 min-h-[180px] ${classes}`}
      data-testid={`game-card-${game.key}`}
    >
      <Link to={game.to} className="block h-full w-full p-6 relative group" data-cursor="open">
        {game.cover && (
          <>
            <img
              src={game.cover}
              alt=""
              className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-40 group-hover:opacity-55 transition-opacity duration-500"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-archive via-archive/45 to-archive/15" />
          </>
        )}
        {isFeatured && <CaseFeaturedBg />}
        {game.theme === "sushi" && !game.cover && <SushiPreviewBg />}
        {game.theme === "hidden" && !game.cover && <KokoPreviewBg />}
        {game.theme === "quiz" && !game.cover && <QuizPreviewBg />}
        {game.theme === "romantic" && !game.cover && <JigsawPreviewBg />}
        {game.theme === "archive" && !game.cover && <TimelinePreviewBg />}

        <div className="relative z-10 h-full flex flex-col justify-between gap-6">
          <div>
            <div className="flex items-start justify-between">
              <span className="type-mono text-[9px] text-lavender/80">{game.difficulty}</span>
              <span className="type-mono text-[9px] text-text-muted">{game.est}</span>
            </div>
            <h3 className={`mt-3 font-editorial ${isFeatured ? "text-4xl md:text-6xl" : "text-2xl md:text-3xl"} leading-tight`}>
              {game.label}
            </h3>
            <p className="mt-2 text-sm text-text-secondary max-w-[36ch]">{game.tagline}</p>
            {completed && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-lavender/40 px-3 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-lavender" />
                <span className="type-mono text-[9px] text-lavender">{ACHIEVEMENTS[game.key]}</span>
              </div>
            )}
          </div>

          <div className="flex items-end justify-between">
            <div className="flex items-center gap-4">
              {bestScore > 0 && (
                <div>
                  <span className="type-mono text-[9px] text-text-muted">best</span>
                  <p className="font-editorial text-lg">{bestScore}</p>
                </div>
              )}
              {save?.elapsed_seconds > 0 && (
                <div>
                  <span className="type-mono text-[9px] text-text-muted">played</span>
                  <p className="font-editorial text-lg">{formatShort(save.elapsed_seconds)}</p>
                </div>
              )}
            </div>
            <span className="inline-flex items-center gap-1 type-mono text-[9px] text-lavender group-hover:gap-2 transition-all">
              {status === "active" || status === "paused" ? "resume" : completed ? "play again" : "start"}
              <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function CaseFeaturedBg() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-kuromi/15 via-transparent to-transparent" />
      <div className="pointer-events-none absolute inset-0 opacity-30" style={{
        backgroundImage: "repeating-linear-gradient(0deg, rgba(184,156,255,0.08) 0px, rgba(184,156,255,0.08) 1px, transparent 1px, transparent 3px)"
      }} />
      <div className="pointer-events-none absolute top-6 right-6 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-danger-red animate-pulse" />
        <span className="type-mono text-[9px] text-danger-red">SIGNAL LIVE</span>
      </div>
    </>
  );
}
function SushiPreviewBg() {
  return (
    <div className="pointer-events-none absolute bottom-4 right-4 flex flex-col gap-1 opacity-70">
      <div className="w-12 h-3 rounded-sm bg-bow" />
      <div className="w-10 h-3 rounded-sm bg-warning-gold" />
      <div className="w-14 h-3 rounded-sm bg-danger-red/70" />
    </div>
  );
}
function KokoPreviewBg() {
  return (
    <div className="pointer-events-none absolute inset-0 opacity-40">
      <SkullBow size={40} className="absolute top-4 right-8" />
    </div>
  );
}
function QuizPreviewBg() {
  return (
    <div className="pointer-events-none absolute bottom-4 right-6 opacity-70">
      <span className="font-editorial text-6xl text-lavender/25 italic">?</span>
    </div>
  );
}
function JigsawPreviewBg() {
  return (
    <div className="pointer-events-none absolute bottom-4 right-4 grid grid-cols-3 gap-1 opacity-30">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="w-6 h-6 border border-lavender/40 rounded-sm" style={{ transform: `rotate(${(i * 7) % 20}deg)` }} />
      ))}
    </div>
  );
}
function TimelinePreviewBg() {
  return (
    <div className="pointer-events-none absolute bottom-6 left-6 right-6 opacity-40">
      <div className="h-px bg-white/20 relative">
        {[0, 25, 50, 75, 100].map((p) => (
          <span key={p} className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-lavender" style={{ left: `${p}%` }} />
        ))}
      </div>
    </div>
  );
}

function formatShort(seconds) {
  if (!seconds) return "0m";
  const m = Math.floor(seconds / 60);
  if (m < 1) return `${seconds}s`;
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}
