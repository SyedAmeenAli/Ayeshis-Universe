import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameShell, CompletionScreen } from "@/components/games/GameShell";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { KOKO_OBJECTS } from "@/data/kokoScene";
import { fetchGameSave, completeGame, startGame, putGameSave } from "@/lib/gamesApi";
import { useGameSave } from "@/hooks/useGameSave";
import { photoForAssetId } from "@/lib/realAssets";

/**
 * Find Chota Koko — normalized coord hidden-object hunt with pan/zoom.
 * Scene backdrop is a real photo; every hidden object renders as a small,
 * dim marker at its coordinate so it's actually findable, plus a slow
 * circling ring so the eye has something to catch.
 */

const KOKO_SCENE_PHOTO = photoForAssetId("KOKO-ROOM-SCENE");

const OBJECT_EMOJI = {
  bow: "🎀",
  tulip: "🌷",
  ring: "💍",
  "lift-button": "🛗",
  sushi: "🍣",
  "hinge-icon": "📱",
  "grey-dress": "👗",
  "orr-sign": "🛣️",
  "cravery-receipt": "🧾",
  potty: "🚽",
  "pungun-cassette": "📼",
  dignity: "❓",
};

const MODES = {
  relaxed: { key: "relaxed", label: "Relaxed", timer: 0, hintLimit: 999, decoys: 0 },
  detective: { key: "detective", label: "Detective", timer: 180, hintLimit: 4, decoys: 0 },
  chaos: { key: "chaos", label: "Chota Koko Chaos", timer: 120, hintLimit: 2, decoys: 8 },
};

export default function FindKoko() {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const [status, setStatus] = useState("idle");
  const [mode, setMode] = useState("relaxed");
  const [found, setFound] = useState([]);
  const [attempts, setAttempts] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [hintsUsed, setHintsUsed] = useState(0);
  const [activeHint, setActiveHint] = useState(null);
  const [pulseKey, setPulseKey] = useState(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [best, setBest] = useState(0);
  const [showList, setShowList] = useState(true);

  const cfg = MODES[mode];

  // Load save
  useEffect(() => {
    (async () => {
      try {
        const save = await fetchGameSave("find-koko");
        setBest(save?.best_score || 0);
        if (save?.state?.found && save.status === "active") {
          setFound(save.state.found);
          setMode(save.state.mode || "relaxed");
          setStatus("playing");
        }
      } catch (e) {}
    })();
  }, []);

  // Timer
  useEffect(() => {
    if (status !== "playing" || cfg.timer === 0) return;
    const iv = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(iv);
          onTimeOut();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, mode]);

  const buildPayload = useCallback(() => {
    if (status !== "playing") return null;
    return {
      state: { mode, found },
      score: found.length * 100 - hintsUsed * 25,
      elapsed_seconds: cfg.timer ? cfg.timer - timeLeft : 0,
      status: "active",
    };
  }, [status, mode, found, timeLeft, hintsUsed, cfg.timer]);

  useGameSave("find-koko", buildPayload, { intervalMs: 12000, active: status === "playing" });

  function startNew(modeKey) {
    const m = MODES[modeKey];
    setMode(modeKey);
    setFound([]);
    setAttempts(0);
    setHintsUsed(0);
    setActiveHint(null);
    setPulseKey(null);
    setTimeLeft(m.timer);
    setStatus("playing");
    startGame("find-koko").catch(() => {});
  }

  function onTimeOut() {
    setStatus("gameover");
  }

  function onSceneClick(e) {
    if (status !== "playing") return;
    const rect = sceneRef.current.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    // Convert to normalized coordinates in scene (accounts for pan/zoom)
    const nx = ((cx - pan.x) / (rect.width * scale));
    const ny = ((cy - pan.y) / (rect.height * scale));

    // Check each unfound object
    for (const obj of KOKO_OBJECTS) {
      if (found.includes(obj.key)) continue;
      const dx = nx - obj.x;
      const dy = ny - obj.y;
      const dist = Math.hypot(dx, dy);
      if (dist < obj.radius) {
        const nextFound = [...found, obj.key];
        setFound(nextFound);
        setFeedback({ ok: true, text: obj.found_reaction, ts: Date.now() });
        setActiveHint(null);
        if (nextFound.length >= KOKO_OBJECTS.length) {
          onWin(nextFound);
        }
        return;
      }
    }
    setAttempts((n) => n + 1);
    setFeedback({ ok: false, text: "Not there.", ts: Date.now() });
    setTimeout(() => setFeedback(null), 900);
  }

  async function onWin(finalFound) {
    setStatus("won");
    setSaving(true);
    const score = finalFound.length * 100 - hintsUsed * 25;
    try {
      const res = await completeGame("find-koko", {
        state: { mode, found: finalFound, done: true },
        score,
        elapsed_seconds: cfg.timer ? cfg.timer - timeLeft : 0,
        metadata: { mode, hints: hintsUsed },
      });
      setBest(res.best_score || score);
    } catch (e) {}
    setSaving(false);
  }

  function useHint() {
    if (hintsUsed >= cfg.hintLimit) return;
    const remaining = KOKO_OBJECTS.filter((o) => !found.includes(o.key));
    if (remaining.length === 0) return;
    const target = remaining[Math.floor(Math.random() * remaining.length)];
    setHintsUsed((n) => n + 1);
    setActiveHint(target);
    setPulseKey(target.key);
    setTimeout(() => setPulseKey(null), 3500);
  }

  function selectFromList(key) {
    const obj = KOKO_OBJECTS.find((o) => o.key === key);
    if (!obj) return;
    setActiveHint(obj);
  }

  function zoomIn() { setScale((s) => Math.min(3, s + 0.25)); }
  function zoomOut() { setScale((s) => Math.max(1, s - 0.25)); setPan({ x: 0, y: 0 }); }
  function resetView() { setScale(1); setPan({ x: 0, y: 0 }); }

  return (
    <GameShell
      gameKey="find-koko"
      title="Find Chota Koko"
      subtitle="Twelve hidden things. Do not miss dignity."
      onRestart={() => { setStatus("idle"); setFound([]); }}
      instructions={[
        "Tap or click the object in the scene.",
        "Pinch or use +/- to zoom, drag to pan.",
        "Wrong taps do not punish heavily. Hints cost score.",
        "Detective and Chaos modes have timers and hint limits.",
        "Ameen's dignity is the smallest object. That is on-brand.",
      ]}
      score={found.length * 100 - hintsUsed * 25}
      bestScore={best}
      time={cfg.timer ? cfg.timer - timeLeft : 0}
      savingLabel={saving ? "Saving…" : undefined}
    >
      {status === "idle" && (
        <div className="grid md:grid-cols-3 gap-4" data-testid="koko-choose">
          {Object.values(MODES).map((m) => (
            <button
              key={m.key}
              onClick={() => startNew(m.key)}
              data-testid={`koko-mode-${m.key}`}
              className="text-left rounded-2xl border border-white/10 bg-surface-1 p-6 hover:border-lavender/40 min-h-[160px] flex flex-col justify-between"
            >
              <span className="type-mono text-[9px] text-lavender/80">
                {m.timer ? `${Math.round(m.timer/60)}m timer` : "no timer"} · {m.hintLimit >= 99 ? "unlimited hints" : `${m.hintLimit} hints`}
              </span>
              <h3 className="font-editorial text-2xl">{m.label}</h3>
            </button>
          ))}
        </div>
      )}

      {status !== "idle" && (
        <div className="grid md:grid-cols-12 gap-4">
          <div className="md:col-span-8">
            <div className="relative w-full rounded-2xl border border-white/10 bg-surface-1 overflow-hidden">
              <div
                ref={containerRef}
                className="relative w-full touch-none select-none"
                style={{ aspectRatio: "16/10", overflow: "hidden" }}
                onClick={onSceneClick}
                data-testid="koko-scene"
              >
                <div
                  ref={sceneRef}
                  className="absolute inset-0 origin-top-left"
                  style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`, transformOrigin: "top left" }}
                >
                  <SceneArt />

                  {/* Object markers — dim but visible, so the scene is actually
                      findable instead of pure blind-click guessing */}
                  {KOKO_OBJECTS.map((o) => {
                    const isFound = found.includes(o.key);
                    if (isFound) return null;
                    return (
                      <motion.div
                        key={o.key}
                        className="absolute flex items-center justify-center pointer-events-none"
                        style={{
                          left: `${o.x * 100}%`,
                          top: `${o.y * 100}%`,
                          width: `${o.radius * 200}%`,
                          height: `${o.radius * 200}%`,
                          transform: "translate(-50%, -50%)",
                        }}
                      >
                        <span className="text-[min(3vw,22px)] opacity-40 drop-shadow-md" style={{ filter: "grayscale(0.3)" }}>
                          {OBJECT_EMOJI[o.key] || "•"}
                        </span>
                        {/* slow ambient circling ring so the eye has something to catch */}
                        <motion.span
                          className="absolute inset-0 rounded-full border border-dashed border-lavender/25"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
                        />
                      </motion.div>
                    );
                  })}

                  {/* Hint pulse — stronger circling ring, tighter + faster */}
                  {pulseKey && (() => {
                    const o = KOKO_OBJECTS.find((x) => x.key === pulseKey);
                    if (!o) return null;
                    return (
                      <motion.span
                        className="absolute rounded-full border-2 border-lavender/70"
                        style={{ left: `${o.x * 100}%`, top: `${o.y * 100}%`, width: `${o.radius * 260}%`, height: `${o.radius * 260}%`, transform: "translate(-50%, -50%)" }}
                        animate={{ scale: [1, 1.7, 1], opacity: [0.95, 0.25, 0.95], rotate: [0, 180] }}
                        transition={{ duration: 1.6, repeat: 2, ease: "easeInOut" }}
                      />
                    );
                  })()}

                  {/* Found highlights — a ring that circles in, then settles */}
                  {found.map((k) => {
                    const o = KOKO_OBJECTS.find((x) => x.key === k);
                    if (!o) return null;
                    return (
                      <motion.span
                        key={k}
                        className="absolute rounded-full border-2 border-success-mint/70 bg-success-mint/10 flex items-center justify-center"
                        style={{ left: `${o.x * 100}%`, top: `${o.y * 100}%`, width: `${o.radius * 200}%`, height: `${o.radius * 200}%`, transform: "translate(-50%, -50%)" }}
                        initial={{ scale: 2.2, opacity: 0, rotate: -90 }}
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
                        data-testid={`koko-found-${k}`}
                      >
                        <span className="text-[min(3vw,22px)]">{OBJECT_EMOJI[k] || "✓"}</span>
                      </motion.span>
                    );
                  })}
                </div>

                <AnimatePresence>
                  {feedback && (
                    <motion.div
                      key={feedback.ts}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full border border-white/12 bg-archive-soft/80 backdrop-blur"
                    >
                      <span className={`font-hand text-xl ${feedback.ok ? "text-lavender-soft" : "text-danger-red"}`}>{feedback.text}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex items-center justify-between p-3 border-t border-white/8">
                <div className="flex gap-2">
                  <ControlBtn onClick={zoomOut} label="−" testid="koko-zoom-out" />
                  <ControlBtn onClick={zoomIn} label="+" testid="koko-zoom-in" />
                  <ControlBtn onClick={resetView} label="reset" testid="koko-reset" />
                </div>
                <div className="flex gap-2">
                  <button onClick={useHint} disabled={hintsUsed >= cfg.hintLimit} className="type-mono text-[10px] border border-white/10 rounded-full px-3 py-1 text-lavender disabled:opacity-30" data-testid="koko-hint">
                    hint · {hintsUsed}/{cfg.hintLimit >= 99 ? "∞" : cfg.hintLimit}
                  </button>
                  <button onClick={() => setShowList((v) => !v)} className="type-mono text-[10px] border border-white/10 rounded-full px-3 py-1 text-text-secondary" data-testid="koko-toggle-list">
                    {showList ? "hide list" : "show list"}
                  </button>
                </div>
              </div>
            </div>

            {activeHint && (
              <div className="mt-3 rounded-xl border border-lavender/20 bg-lavender/5 p-3">
                <span className="type-mono text-[9px] text-lavender">HINT · {activeHint.label}</span>
                <p className="mt-1 font-editorial text-lg">{activeHint.hint}</p>
              </div>
            )}
          </div>

          <div className="md:col-span-4">
            {showList && (
              <div className="rounded-2xl border border-white/10 bg-surface-1 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="type-mono text-[9px] text-text-muted">objects · {found.length}/{KOKO_OBJECTS.length}</span>
                  <span className="type-mono text-[9px] text-text-muted">attempts {attempts}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {KOKO_OBJECTS.map((obj) => {
                    const isFound = found.includes(obj.key);
                    return (
                      <button
                        key={obj.key}
                        onClick={() => !isFound && selectFromList(obj.key)}
                        className={`text-left text-xs p-2 rounded-lg border ${isFound ? "border-success-mint/40 bg-success-mint/5 text-success-mint" : "border-white/10 hover:border-lavender/40"}`}
                        data-testid={`koko-list-${obj.key}`}
                      >
                        {isFound ? "✓ " : "· "}
                        {obj.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {status === "won" && (
              <div className="mt-4">
                <CompletionScreen
                  title="Chota Koko has been retrieved."
                  subtitle="Ameen's dignity was here the entire time."
                  achievement="CHOTA KOKO RECOVERY SPECIALIST"
                  stats={[
                    { label: "objects", value: `${found.length}/${KOKO_OBJECTS.length}` },
                    { label: "hints", value: hintsUsed },
                    { label: "attempts", value: attempts },
                    { label: "best", value: best },
                  ]}
                  onReplay={() => { setStatus("idle"); }}
                  onExit={() => (window.location.href = "/games")}
                  testid="koko-completion"
                />
              </div>
            )}

            {status === "gameover" && (
              <div className="mt-4 rounded-2xl border border-danger-red/40 bg-danger-red/5 p-6">
                <h3 className="font-editorial text-2xl">Time up.</h3>
                <p className="text-sm text-text-secondary mt-2">Chota Koko escaped. Found {found.length} of {KOKO_OBJECTS.length}.</p>
                <MagneticButton variant="primary" size="sm" className="mt-4" onClick={() => setStatus("idle")} data-testid="koko-retry">
                  try again
                </MagneticButton>
              </div>
            )}
          </div>
        </div>
      )}
    </GameShell>
  );
}

function ControlBtn({ onClick, label, testid }) {
  return (
    <button
      onClick={onClick}
      data-testid={testid}
      className="min-w-[36px] h-9 rounded-full border border-white/10 text-text-secondary hover:border-lavender/40 hover:text-lavender type-mono text-[10px] px-3"
    >
      {label}
    </button>
  );
}

/**
 * Real photo backdrop for the hidden-object hunt, replacing the old
 * abstract-shapes SVG that had no actual searchable content in it.
 */
function SceneArt() {
  if (!KOKO_SCENE_PHOTO) return <div className="absolute inset-0 bg-surface-2" />;
  return (
    <div className="absolute inset-0">
      <img src={KOKO_SCENE_PHOTO} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-archive/35" />
    </div>
  );
}
