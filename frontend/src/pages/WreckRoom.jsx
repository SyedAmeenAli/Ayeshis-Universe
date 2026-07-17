import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Stage, Layer, Line, Rect, Group, Text, Image as KonvaImage } from "react-konva";
import useImage from "use-image";

const AMEEN_FACE_URL = "/assets/real/wreck-ameen-face.jpeg";
import { GameShell } from "@/components/games/GameShell";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { WRECK_REACTIONS, WRECK_TOOLS } from "@/data/wreckReactions";
import { fetchGameSave, putGameSave, startGame } from "@/lib/gamesApi";
import { useGameSave } from "@/hooks/useGameSave";

const STAGE_W = 720;
const STAGE_H = 720;
const THROW_DURATION_MS = 480;
const TOOL_EMOJI = {
  pillow: "☁️",
  tomato: "🍅",
  slipper: "🩴",
  textbook: "📕",
  sushi: "🍣",
  hammer: "🔨",
  balloon: "🎈",
  "hit-hard": "💥",
};

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export default function WreckRoom() {
  const stageRef = useRef(null);
  const [ameenFace] = useImage(AMEEN_FACE_URL);
  const [tool, setTool] = useState("marker");
  const [health, setHealth] = useState(100);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [bubble, setBubble] = useState(null);
  const [lines, setLines] = useState([]); // {tool, color, points}
  const [projectiles, setProjectiles] = useState([]); // in-flight
  const [decals, setDecals] = useState([]); // final positions where projectile hit
  const [drawing, setDrawing] = useState(false);
  const [ko, setKo] = useState(false);
  const [aim, setAim] = useState(null);
  const [totalHits, setTotalHits] = useState(0);
  const [, forceTick] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const save = await fetchGameSave("wreck-room");
        setBestCombo(save?.best_score || 0);
        if (save?.state) {
          setLines(save.state.lines || []);
          setDecals(save.state.decals || []);
          setHealth(save.state.health ?? 100);
          setKo((save.state.health ?? 100) <= 0);
        }
      } catch (e) {}
      try { await startGame("wreck-room"); } catch (e) {}
    })();
  }, []);

  const buildPayload = useCallback(() => ({
    state: { lines, decals, health, bestCombo },
    score: bestCombo,
    elapsed_seconds: 0,
    status: ko ? "paused" : "active",
  }), [lines, decals, health, bestCombo, ko]);

  useGameSave("wreck-room", buildPayload, { intervalMs: 10000, active: true });

  // Drive in-flight thrown projectiles: interpolate position along an arc,
  // then resolve (damage/decal or miss) once each one lands.
  useEffect(() => {
    if (projectiles.length === 0) return;
    let raf;
    const tick = () => {
      const now = performance.now();
      const landed = projectiles.filter((p) => now - p.startedAt >= p.duration);
      if (landed.length > 0) {
        setProjectiles((prev) => prev.filter((p) => now - p.startedAt < p.duration));
        landed.forEach((p) => resolveProjectile(p));
      } else {
        forceTick((n) => n + 1);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectiles]);

  function resolveProjectile(p) {
    if (p.inHit) {
      applyDamage(p.damage);
      setDecals((prev) => [...prev, { x: p.x1, y: p.y1, color: p.color, size: p.damage * 3 + 6, tool: p.tool }]);
    } else {
      setBubble({ text: "Missed. Ameen breathes.", kind: "miss", ts: Date.now() });
      setTimeout(() => setBubble(null), 1200);
      setCombo(0);
    }
  }

  const activeTool = WRECK_TOOLS.find((t) => t.key === tool);

  function reactionForHit(damage) {
    if (damage >= 10) return WRECK_REACTIONS.heavy[Math.floor(Math.random() * WRECK_REACTIONS.heavy.length)];
    if (damage >= 4) return WRECK_REACTIONS.medium[Math.floor(Math.random() * WRECK_REACTIONS.medium.length)];
    return WRECK_REACTIONS.light[Math.floor(Math.random() * WRECK_REACTIONS.light.length)];
  }

  function applyDamage(damage) {
    if (ko) return;
    const nextHealth = Math.max(0, health - damage);
    const nextCombo = combo + 1;
    setHealth(nextHealth);
    setCombo(nextCombo);
    setBestCombo((b) => Math.max(b, nextCombo));
    setTotalHits((n) => n + 1);
    setBubble({ text: reactionForHit(damage), kind: "hit", ts: Date.now() });
    setTimeout(() => setBubble(null), 1800);
    if (nextHealth <= 0) {
      setKo(true);
      setTimeout(() => setBubble({ text: WRECK_REACTIONS.ko[Math.floor(Math.random() * WRECK_REACTIONS.ko.length)], kind: "ko", ts: Date.now() }), 400);
    }
  }

  function onScribble(damage) {
    if (ko) return;
    setBubble({ text: WRECK_REACTIONS.scribble[Math.floor(Math.random() * WRECK_REACTIONS.scribble.length)], kind: "scribble", ts: Date.now() });
    setTimeout(() => setBubble(null), 1600);
    const nextHealth = Math.max(0, health - damage);
    setHealth(nextHealth);
    setTotalHits((n) => n + 1);
    if (nextHealth <= 0) setKo(true);
  }

  function pointerPos(e) {
    const stage = e.target.getStage();
    const p = stage.getPointerPosition();
    return p ? { x: p.x, y: p.y } : null;
  }

  function onMouseDown(e) {
    if (ko) return;
    const p = pointerPos(e);
    if (!p) return;
    if (activeTool.kind === "draw") {
      setDrawing(true);
      setLines((prev) => [...prev, { tool, color: activeTool.color, points: [p.x, p.y], damage: activeTool.damage }]);
    } else if (activeTool.kind === "throw") {
      setAim({ startX: p.x, startY: p.y, x: p.x, y: p.y });
    }
  }

  function onMouseMove(e) {
    if (ko) return;
    const p = pointerPos(e);
    if (!p) return;
    if (drawing && activeTool.kind === "draw") {
      setLines((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last) last.points = [...last.points, p.x, p.y];
        return copy;
      });
    }
    if (aim) {
      setAim((a) => ({ ...a, x: p.x, y: p.y }));
    }
  }

  function onMouseUp(e) {
    if (ko) return;
    if (drawing) {
      setDrawing(false);
      onScribble(activeTool.damage);
    }
    if (aim) {
      const dx = aim.x - aim.startX;
      const dy = aim.y - aim.startY;
      const power = Math.min(1, Math.hypot(dx, dy) / 300);
      // Target zone: the big photo card itself
      const target = { x: STAGE_W * 0.5, y: STAGE_H * 0.48 };
      const finalX = target.x + dx * (0.6 + power);
      const finalY = target.y + dy * (0.6 + power);
      const inHit = Math.abs(finalX - target.x) < 230 && Math.abs(finalY - target.y) < 260;
      setProjectiles((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random()}`,
          tool,
          color: activeTool.color,
          damage: activeTool.damage,
          x0: aim.startX,
          y0: STAGE_H + 40,
          x1: finalX,
          y1: finalY,
          startedAt: performance.now(),
          duration: THROW_DURATION_MS,
          inHit,
        },
      ]);
      setAim(null);
    }
  }

  function undo() {
    setLines((prev) => prev.slice(0, -1));
  }
  function clearAll() {
    setLines([]);
    setDecals([]);
    setBubble(null);
  }
  function revive() {
    setHealth(100);
    setKo(false);
    setDecals([]);
    setBubble({ text: WRECK_REACTIONS.revive[Math.floor(Math.random() * WRECK_REACTIONS.revive.length)], kind: "revive", ts: Date.now() });
    setTimeout(() => setBubble(null), 1800);
  }

  function hitMeHard() {
    if (ko) return;
    const finalX = STAGE_W * 0.5 + (Math.random() - 0.5) * 80;
    const finalY = STAGE_H * 0.48 + (Math.random() - 0.5) * 80;
    setProjectiles((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        tool: "hit-hard",
        color: "#FF405C",
        damage: 18,
        x0: STAGE_W * 0.5,
        y0: STAGE_H + 60,
        x1: finalX,
        y1: finalY,
        startedAt: performance.now(),
        duration: THROW_DURATION_MS,
        inHit: true,
      },
    ]);
  }

  return (
    <GameShell
      gameKey="wreck-room"
      title="Wreck Room"
      subtitle="For professional Ameen destruction."
      onRestart={() => { clearAll(); setHealth(100); setKo(false); setCombo(0); }}
      instructions={[
        "Pick a tool. Draw with markers or drag to throw.",
        "Reactions are comic bubbles, not audio.",
        "Combo grows with consecutive hits. Missing resets combo.",
        "At zero health, revive baby boy.",
      ]}
      score={combo}
      bestScore={bestCombo}
    >
      <div className="grid md:grid-cols-12 gap-4">
        {/* Toolbox */}
        <div className="md:col-span-3 md:order-1 order-2 flex flex-col gap-2" data-testid="wreck-toolbox">
          <div className="rounded-2xl border border-white/10 bg-surface-1 p-3">
            <span className="type-mono text-[9px] text-text-muted">tools</span>
            <div className="mt-2 grid grid-cols-2 md:grid-cols-1 gap-1">
              {WRECK_TOOLS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTool(t.key)}
                  data-testid={`wreck-tool-${t.key}`}
                  className={`text-left rounded-lg border p-2 text-xs flex items-center gap-2 ${tool === t.key ? "border-lavender bg-lavender/8" : "border-white/10 hover:border-lavender/40"}`}
                >
                  <span className="w-3 h-3 rounded-full" style={{ background: t.color }} />
                  <span>{t.label}</span>
                  <span className="ml-auto type-mono text-[9px] text-text-muted">{t.damage}%</span>
                </button>
              ))}
            </div>
          </div>
          <button onClick={undo} className="rounded-lg border border-white/10 py-2 type-mono text-[9px] text-text-secondary" data-testid="wreck-undo">undo</button>
          <button onClick={clearAll} className="rounded-lg border border-white/10 py-2 type-mono text-[9px] text-text-secondary" data-testid="wreck-clear">clear</button>
          <MagneticButton variant="danger" size="sm" onClick={hitMeHard} data-testid="wreck-hit-hard">hit me hard (-18%)</MagneticButton>
        </div>

        {/* Stage */}
        <div className="md:col-span-9 md:order-2 order-1">
          <div className="relative rounded-2xl border border-white/10 bg-surface-1 overflow-hidden" data-testid="wreck-stage">
            <div className="flex items-center justify-between p-3 border-b border-white/8">
              <div className="flex items-center gap-3 flex-1">
                <span className="type-mono text-[9px] text-text-muted">health</span>
                <div className="flex-1 max-w-md h-2 bg-white/8 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full ${health > 40 ? "bg-success-mint" : health > 15 ? "bg-warning-gold" : "bg-danger-red"}`}
                    animate={{ width: `${health}%` }}
                    transition={{ duration: 0.4 }}
                    data-testid="wreck-health-bar"
                  />
                </div>
                <span className="type-mono text-[10px] text-text-primary min-w-[3ch]">{health}%</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="type-mono text-[9px] text-text-muted">combo {combo}</span>
                <span className="type-mono text-[9px] text-lavender">best {bestCombo}</span>
              </div>
            </div>

            <Stage
              ref={stageRef}
              width={STAGE_W}
              height={STAGE_H}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onTouchStart={onMouseDown}
              onTouchMove={onMouseMove}
              onTouchEnd={onMouseUp}
              style={{ width: "100%", height: "auto", aspectRatio: "1/1", background: "#0E0E13", touchAction: "none" }}
            >
              <Layer>
                {/* Backdrop */}
                <Rect x={0} y={0} width={STAGE_W} height={STAGE_H} fill="#141419" />
                {/* Comic target — one big photo card, the whole hit box */}
                <Group x={STAGE_W * 0.5} y={STAGE_H * 0.48}>
                  <Group
                    clipFunc={(ctx) => {
                      ctx.beginPath();
                      const w = 460, h = 520, r = 36;
                      ctx.moveTo(-w / 2 + r, -h / 2);
                      ctx.arcTo(w / 2, -h / 2, w / 2, h / 2, r);
                      ctx.arcTo(w / 2, h / 2, -w / 2, h / 2, r);
                      ctx.arcTo(-w / 2, h / 2, -w / 2, -h / 2, r);
                      ctx.arcTo(-w / 2, -h / 2, w / 2, -h / 2, r);
                      ctx.closePath();
                    }}
                  >
                    {ameenFace ? (
                      <KonvaImage image={ameenFace} x={-230} y={-260} width={460} height={520} opacity={ko ? 0.55 : 1} />
                    ) : (
                      <Rect x={-230} y={-260} width={460} height={520} fill={ko ? "#7F7885" : "#F7F4F6"} />
                    )}
                    {ko && <Rect x={-230} y={-260} width={460} height={520} fill="#0B0B0F" opacity={0.35} />}
                  </Group>
                  {ko && <Text x={-60} y={-30} text="X X" fontSize={48} fill="#F7F4F6" />}
                  {/* label */}
                  <Text x={-40} y={280} text="AMEEN" fontSize={16} fill="#F7F4F6" letterSpacing={5} />
                </Group>

                {/* Draw lines */}
                {lines.map((l, i) => (
                  <Line
                    key={i}
                    points={l.points}
                    stroke={l.color}
                    strokeWidth={4}
                    tension={0.3}
                    lineCap="round"
                    lineJoin="round"
                  />
                ))}

                {/* Decals (impact marks) */}
                {decals.map((d, i) => (
                  <Group key={i} x={d.x} y={d.y}>
                    {d.tool === "tomato" ? (
                      <Rect x={-d.size / 2} y={-d.size / 2} width={d.size} height={d.size} cornerRadius={d.size / 2} fill={d.color} opacity={0.7} />
                    ) : (
                      <Group>
                        <Line points={[-d.size, 0, d.size, 0]} stroke={d.color} strokeWidth={3} />
                        <Line points={[0, -d.size, 0, d.size]} stroke={d.color} strokeWidth={3} />
                        <Line points={[-d.size * 0.7, -d.size * 0.7, d.size * 0.7, d.size * 0.7]} stroke={d.color} strokeWidth={3} />
                        <Line points={[-d.size * 0.7, d.size * 0.7, d.size * 0.7, -d.size * 0.7]} stroke={d.color} strokeWidth={3} />
                      </Group>
                    )}
                  </Group>
                ))}

                {/* In-flight thrown objects — arc from launch point to impact */}
                {projectiles.map((p) => {
                  const progress = Math.min(1, (performance.now() - p.startedAt) / p.duration);
                  const x = lerp(p.x0, p.x1, progress);
                  const arcLift = 160 * Math.sin(Math.PI * progress);
                  const y = lerp(p.y0, p.y1, progress) - arcLift;
                  const spin = progress * 540;
                  return (
                    <Text
                      key={p.id}
                      x={x - 18}
                      y={y - 18}
                      text={TOOL_EMOJI[p.tool] || "●"}
                      fontSize={36}
                      rotation={spin}
                      offsetX={18}
                      offsetY={18}
                    />
                  );
                })}

                {/* Aim indicator */}
                {aim && (
                  <Line points={[aim.startX, aim.startY, aim.x, aim.y]} stroke="#B89CFF" strokeWidth={2} dash={[6, 8]} />
                )}
              </Layer>
            </Stage>

            <AnimatePresence>
              {bubble && (
                <motion.div
                  key={bubble.ts}
                  initial={{ opacity: 0, scale: 0.6, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                  className={`absolute top-14 right-4 max-w-xs rounded-2xl px-4 py-2 ${bubble.kind === "ko" ? "bg-danger-red text-white" : "bg-white text-archive"} shadow-xl`}
                  data-testid="wreck-bubble"
                >
                  <p className="font-editorial text-lg leading-tight">{bubble.text}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {ko && (
              <div className="absolute inset-x-0 bottom-4 flex flex-col items-center gap-2" data-testid="wreck-ko">
                <p className="font-editorial text-2xl text-danger-red">Ameen has been professionally destroyed.</p>
                <MagneticButton variant="primary" size="md" onClick={revive} data-testid="wreck-revive">revive baby boy</MagneticButton>
              </div>
            )}
          </div>
          <p className="mt-3 text-xs text-text-muted">Hits: {totalHits} · Tool: {activeTool.label} ({activeTool.damage}%)</p>
        </div>
      </div>
    </GameShell>
  );
}
