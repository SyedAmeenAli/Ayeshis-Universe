import React, { useCallback, useEffect, useRef, useState } from "react";
import Matter from "matter-js";
import { motion, AnimatePresence } from "framer-motion";
import { GameShell, CompletionScreen } from "@/components/games/GameShell";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { SUSHI_PIECES, SUSHI_REACTIONS } from "@/data/sushiPieces";
import { fetchGameSave, completeGame, startGame } from "@/lib/gamesApi";

/**
 * Sushi Stack — Matter.js physics tower stacking.
 * Piece hovers at the top, pointer moves it horizontally, click/tap drops it.
 * Increasing wobble via applied forces + subtle platform narrowing.
 */

const CANVAS_W = 480;
const CANVAS_H = 720;
const PLATFORM_START_W = 220;
const COLLAPSE_TILT_DEG = 55;

export default function SushiStack() {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const runnerRef = useRef(null);
  const worldRef = useRef(null);
  const platformRef = useRef(null);
  const pieceHoverRef = useRef(null);
  const pointerXRef = useRef(CANVAS_W / 2);
  const nextPieceRef = useRef(null);
  const placedBodiesRef = useRef([]);
  const [status, setStatus] = useState("idle"); // idle | playing | gameover
  const [pieces, setPieces] = useState(0);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [maxHeight, setMaxHeight] = useState(0);
  const [reaction, setReaction] = useState(null);
  const [saving, setSaving] = useState(false);
  const [paused, setPaused] = useState(false);
  const [goldenCollected, setGoldenCollected] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const save = await fetchGameSave("sushi-stack");
        setBestScore(save?.best_score || 0);
      } catch (e) {}
    })();
  }, []);

  const pickNextPiece = useCallback(() => {
    // 10% chance golden
    if (Math.random() < 0.1) return SUSHI_PIECES.find((p) => p.rare) || SUSHI_PIECES[0];
    const normal = SUSHI_PIECES.filter((p) => !p.rare);
    return normal[Math.floor(Math.random() * normal.length)];
  }, []);

  const spawnHoverPiece = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const type = pickNextPiece();
    nextPieceRef.current = type;
    // Represent hover piece as a static reference, not a body yet
    pieceHoverRef.current = { type, x: pointerXRef.current, y: 60 };
  }, [pickNextPiece]);

  function startNew() {
    setPieces(0);
    setScore(0);
    setMaxHeight(0);
    setStatus("playing");
    setReaction(null);
    setGoldenCollected(0);
    startGame("sushi-stack").catch(() => {});
    initEngine();
  }

  function initEngine() {
    // Clean previous
    if (runnerRef.current) Matter.Runner.stop(runnerRef.current);
    if (engineRef.current) Matter.Engine.clear(engineRef.current);
    placedBodiesRef.current = [];

    const engine = Matter.Engine.create({ gravity: { x: 0, y: 1.0 } });
    const world = engine.world;
    engineRef.current = engine;
    worldRef.current = world;

    // Platform
    const platform = Matter.Bodies.rectangle(
      CANVAS_W / 2,
      CANVAS_H - 30,
      PLATFORM_START_W,
      12,
      { isStatic: true, label: "platform", render: { fillStyle: "#8B5CF6" } }
    );
    platformRef.current = platform;
    // Walls: only floor for game-over detection
    const floor = Matter.Bodies.rectangle(CANVAS_W / 2, CANVAS_H + 60, CANVAS_W * 3, 60, { isStatic: true, label: "floor" });
    Matter.Composite.add(world, [platform, floor]);

    // Runner
    const runner = Matter.Runner.create();
    runnerRef.current = runner;
    Matter.Runner.run(runner, engine);

    spawnHoverPiece();

    // Render loop
    let raf;
    const draw = () => {
      renderCanvas();
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    // cleanup handled in effect
  }

  useEffect(() => {
    return () => {
      if (runnerRef.current) Matter.Runner.stop(runnerRef.current);
      if (engineRef.current) Matter.Engine.clear(engineRef.current);
    };
  }, []);

  function renderCanvas() {
    const canvas = canvasRef.current;
    if (!canvas || !engineRef.current) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // background gradient
    const g = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    g.addColorStop(0, "#14141B");
    g.addColorStop(1, "#0B0B0F");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // platform
    const platform = platformRef.current;
    if (platform) {
      const w = platform.bounds.max.x - platform.bounds.min.x;
      ctx.fillStyle = "#8B5CF6";
      ctx.fillRect(platform.position.x - w / 2, platform.position.y - 6, w, 12);
      ctx.fillStyle = "rgba(139,92,246,0.15)";
      ctx.fillRect(platform.position.x - w / 2, platform.position.y + 6, w, 40);
    }

    // placed sushi
    placedBodiesRef.current.forEach((b) => {
      const type = b.plugin?.sushi;
      if (!type) return;
      ctx.save();
      ctx.translate(b.position.x, b.position.y);
      ctx.rotate(b.angle);
      drawSushi(ctx, type);
      ctx.restore();
    });

    // hover piece
    const hover = pieceHoverRef.current;
    if (hover && status === "playing" && !paused) {
      const y = 80;
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.translate(pointerXRef.current, y);
      drawSushi(ctx, hover.type);
      ctx.restore();
      // guideline
      ctx.strokeStyle = "rgba(184,156,255,0.3)";
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(pointerXRef.current, y + 20);
      ctx.lineTo(pointerXRef.current, CANVAS_H - 40);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Highest y among placed
    const highest = placedBodiesRef.current.reduce((acc, b) => Math.min(acc, b.position.y), CANVAS_H);
    const h = Math.max(0, Math.round(CANVAS_H - 40 - highest));
    setMaxHeight((prev) => Math.max(prev, h));

    // Collapse detection: any placed body angle > threshold or below floor
    for (const b of placedBodiesRef.current) {
      const tilt = Math.abs((b.angle * 180) / Math.PI) % 360;
      const outOfBounds = b.position.y > CANVAS_H + 30 || b.position.x < -50 || b.position.x > CANVAS_W + 50;
      if (outOfBounds || tilt > COLLAPSE_TILT_DEG) {
        onCollapse();
        return;
      }
    }
  }

  function drawSushi(ctx, type) {
    ctx.fillStyle = type.color;
    ctx.beginPath();
    const w = type.width, h = type.height;
    const r = Math.min(w, h) * 0.35;
    // rounded rect
    ctx.moveTo(-w / 2 + r, -h / 2);
    ctx.lineTo(w / 2 - r, -h / 2);
    ctx.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    ctx.lineTo(w / 2, h / 2 - r);
    ctx.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    ctx.lineTo(-w / 2 + r, h / 2);
    ctx.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
    ctx.lineTo(-w / 2, -h / 2 + r);
    ctx.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
    ctx.closePath();
    ctx.fill();
    // accent stripe on top
    ctx.fillStyle = type.accent;
    ctx.fillRect(-w / 2 + 4, -h / 2 + 3, w - 8, Math.max(4, h * 0.28));
    if (type.rare) {
      ctx.strokeStyle = "#FFD86A";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-w / 2 + r, -h / 2);
      ctx.lineTo(w / 2 - r, -h / 2);
      ctx.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
      ctx.stroke();
    }
  }

  function onPointerMove(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * CANVAS_W;
    pointerXRef.current = Math.max(30, Math.min(CANVAS_W - 30, x));
  }

  function onDrop() {
    if (status !== "playing" || paused) return;
    const hover = pieceHoverRef.current;
    if (!hover) return;
    const type = hover.type;
    const body = Matter.Bodies.rectangle(pointerXRef.current, 80, type.width, type.height, {
      restitution: 0.05,
      friction: 0.8,
      frictionStatic: 1.2,
      density: 0.0018 * type.weight,
      angle: (Math.random() - 0.5) * 0.05,
    });
    body.plugin = { sushi: type };
    Matter.Composite.add(worldRef.current, body);
    placedBodiesRef.current.push(body);
    // Increase wobble subtly after a few pieces
    const total = placedBodiesRef.current.length;
    if (total > 4) {
      Matter.Body.applyForce(body, body.position, { x: (Math.random() - 0.5) * 0.002 * Math.min(3, total / 3), y: 0 });
    }
    // Narrow platform every 5 pieces
    if (total % 5 === 0 && platformRef.current) {
      const p = platformRef.current;
      const currentW = p.bounds.max.x - p.bounds.min.x;
      const newW = Math.max(120, currentW - 12);
      Matter.Body.scale(p, newW / currentW, 1);
    }
    setPieces(total);
    setScore((s) => s + type.score);
    if (type.rare) {
      setGoldenCollected((g) => g + 1);
      setReaction({ text: "Golden sushi acquired.", ts: Date.now() });
    } else {
      // random reaction sometimes
      if (Math.random() < 0.35) {
        setReaction({ text: SUSHI_REACTIONS[Math.floor(Math.random() * SUSHI_REACTIONS.length)], ts: Date.now() });
      }
    }
    setTimeout(() => setReaction((r) => (r && Date.now() - r.ts > 1400 ? null : r)), 1500);
    spawnHoverPiece();
  }

  useEffect(() => {
    if (status !== "playing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onMove = (e) => onPointerMove(e);
    const onDown = () => onDrop();
    const onKey = (e) => {
      if (e.key === "ArrowLeft") pointerXRef.current = Math.max(30, pointerXRef.current - 20);
      if (e.key === "ArrowRight") pointerXRef.current = Math.min(CANVAS_W - 30, pointerXRef.current + 20);
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); onDrop(); }
    };
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, paused]);

  async function onCollapse() {
    if (status !== "playing") return;
    setStatus("gameover");
    setSaving(true);
    try {
      const res = await completeGame("sushi-stack", {
        state: { pieces: pieces, height: maxHeight, golden: goldenCollected },
        score,
        elapsed_seconds: 0,
        metadata: { pieces, height: maxHeight, golden: goldenCollected },
      });
      setBestScore(res.best_score || score);
    } catch (e) {}
    setSaving(false);
  }

  return (
    <GameShell
      gameKey="sushi-stack"
      title="Sushi Stack"
      subtitle="Build a tower with real physics."
      paused={paused}
      onTogglePause={status === "playing" ? () => setPaused((p) => !p) : null}
      onRestart={() => { setStatus("idle"); }}
      instructions={[
        "The piece hovers at the top. Move it left/right.",
        "Click or tap to drop. Arrow keys and Space also work.",
        "Stack collapses if any piece tilts too far or falls off the platform.",
        "Golden sushi is rare and worth extra points.",
      ]}
      score={score}
      bestScore={bestScore}
      savingLabel={saving ? "Saving…" : undefined}
    >
      {status === "idle" && (
        <div className="flex flex-col items-start gap-4" data-testid="sushi-idle">
          <p className="font-editorial text-lg text-text-secondary">
            Build the highest, most stable sushi tower Ayesha has ever built.
          </p>
          <MagneticButton variant="primary" size="lg" onClick={startNew} data-testid="sushi-start">
            begin stacking
          </MagneticButton>
        </div>
      )}

      {status !== "idle" && (
        <div className="grid md:grid-cols-12 gap-4">
          <div className="md:col-span-8 relative">
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              className="w-full rounded-2xl border border-white/10 bg-surface-1 touch-none"
              style={{ aspectRatio: `${CANVAS_W}/${CANVAS_H}`, maxHeight: "70vh" }}
              data-testid="sushi-canvas"
            />
            <AnimatePresence>
              {reaction && (
                <motion.div
                  key={reaction.ts}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full border border-white/12 bg-archive-soft/80 backdrop-blur"
                >
                  <span className="font-hand text-xl text-lavender-soft">{reaction.text}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="md:col-span-4 flex flex-col gap-3">
            <StatBox label="height" value={`${maxHeight}px`} />
            <StatBox label="pieces" value={pieces} />
            <StatBox label="golden" value={goldenCollected} />
            <StatBox label="best" value={bestScore} accent />

            {status === "gameover" && (
              <CompletionScreen
                title="The sushi has lost faith in structural engineering."
                subtitle={pieces >= 8 ? "Excellent. You may now demand sushi from Ameen." : "Try again. The tower knows."}
                achievement={pieces >= 8 ? "CERTIFIED SUSHI ENGINEER" : null}
                stats={[
                  { label: "pieces", value: pieces },
                  { label: "score", value: score },
                  { label: "golden", value: goldenCollected },
                  { label: "best", value: bestScore },
                ]}
                onReplay={startNew}
                onExit={() => (window.location.href = "/games")}
                testid="sushi-completion"
              />
            )}
          </div>
        </div>
      )}
    </GameShell>
  );
}

function StatBox({ label, value, accent }) {
  return (
    <div className={`rounded-xl border ${accent ? "border-lavender/30" : "border-white/10"} bg-surface-1 p-4`}>
      <span className="type-mono text-[9px] text-text-muted">{label}</span>
      <p className={`mt-1 font-editorial text-2xl ${accent ? "text-lavender" : ""}`}>{value}</p>
    </div>
  );
}
