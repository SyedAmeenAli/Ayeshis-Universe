import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { GameShell, CompletionScreen } from "@/components/games/GameShell";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { fetchGameSave, completeGame, startGame, putGameSave } from "@/lib/gamesApi";
import { useGameSave } from "@/hooks/useGameSave";
import { photoForAssetId } from "@/lib/realAssets";

/**
 * Us, But Broken — a real jigsaw with three difficulties. Pieces are sliced
 * from an actual couple photo via CSS background-position, not colored
 * placeholder blocks.
 */

const JIGSAW_PHOTO = photoForAssetId("JIGSAW-COUPLE-PHOTO");

const DIFFICULTIES = {
  "cute-baby": { key: "cute-baby", label: "Cute Baby", cols: 4, rows: 3, rotate: false, outline: true, snap: 32 },
  "serious": { key: "serious", label: "Serious Girlfriend", cols: 6, rows: 5, rotate: true, outline: false, snap: 22 },
  "mbbs": { key: "mbbs", label: "MBBS Torture", cols: 9, rows: 7, rotate: true, outline: false, snap: 16 },
};

const BOARD_W = 720;
const BOARD_H = 480;
const TRAY_GAP = 24;

export default function Jigsaw() {
  const [status, setStatus] = useState("choose"); // choose | playing | completed
  const [difficulty, setDifficulty] = useState("cute-baby");
  const [pieces, setPieces] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [showOutline, setShowOutline] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bestSeconds, setBestSeconds] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const boardRef = useRef(null);

  const cfg = DIFFICULTIES[difficulty];
  const pieceW = BOARD_W / cfg.cols;
  const pieceH = BOARD_H / cfg.rows;

  // Load save
  useEffect(() => {
    (async () => {
      try {
        const save = await fetchGameSave("jigsaw");
        if (save?.state?.difficulty && save.status === "active") {
          setDifficulty(save.state.difficulty);
          setPieces(save.state.pieces || []);
          setElapsed(save.elapsed_seconds || 0);
          setStatus("playing");
        }
        setBestSeconds(save?.best_score || null);
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  // Timer
  useEffect(() => {
    if (status !== "playing" || paused) return;
    const iv = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(iv);
  }, [status, paused]);

  const buildPayload = useCallback(() => {
    if (status !== "playing") return null;
    return {
      state: { difficulty, pieces },
      score: elapsed,
      elapsed_seconds: elapsed,
      status: "active",
    };
  }, [status, difficulty, pieces, elapsed]);

  useGameSave("jigsaw", buildPayload, { intervalMs: 12000, active: status === "playing" });

  function startNew(diffKey) {
    const c = DIFFICULTIES[diffKey];
    const pW = BOARD_W / c.cols;
    const pH = BOARD_H / c.rows;
    const list = [];
    for (let r = 0; r < c.rows; r++) {
      for (let cIdx = 0; cIdx < c.cols; cIdx++) {
        const id = `${r}-${cIdx}`;
        // Scramble into a tray directly below the board, sized to the same
        // grid — this always fits inside the container regardless of
        // difficulty, unlike the old fixed side-tray math which overflowed
        // past the visible/interactive area for anything above 4x3.
        const idx = list.length;
        const trayCol = idx % c.cols;
        const trayRow = Math.floor(idx / c.cols);
        list.push({
          id,
          r,
          c: cIdx,
          x: trayCol * pW,
          y: BOARD_H + TRAY_GAP + trayRow * pH,
          rotation: c.rotate ? Math.floor(Math.random() * 4) * 90 : 0,
          placed: false,
        });
      }
    }
    // Fisher-Yates shuffle
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i].x, list[j].x] = [list[j].x, list[i].x];
      [list[i].y, list[j].y] = [list[j].y, list[i].y];
      [list[i].rotation, list[j].rotation] = [list[j].rotation, list[i].rotation];
    }
    setDifficulty(diffKey);
    setPieces(list);
    setElapsed(0);
    setAttempts((a) => a + 1);
    setStatus("playing");
    setShowOutline(c.outline);
    startGame("jigsaw").catch(() => {});
  }

  function movePiece(id, dx, dy) {
    setPieces((prev) =>
      prev.map((p) => (p.id === id ? { ...p, x: p.x + dx, y: p.y + dy } : p))
    );
  }

  function rotatePiece(id) {
    if (!cfg.rotate) return;
    setPieces((prev) =>
      prev.map((p) => (p.id === id ? { ...p, rotation: (p.rotation + 90) % 360 } : p))
    );
  }

  function trySnap(id) {
    setPieces((prev) => {
      const next = prev.map((p) => {
        if (p.id !== id) return p;
        const targetX = p.c * pieceW;
        const targetY = p.r * pieceH;
        const dist = Math.hypot(p.x - targetX, p.y - targetY);
        const rotOK = !cfg.rotate || p.rotation % 360 === 0;
        if (dist < cfg.snap && rotOK) {
          return { ...p, x: targetX, y: targetY, rotation: 0, placed: true };
        }
        return p;
      });
      // check completion
      if (next.every((p) => p.placed)) {
        setTimeout(() => onComplete(next), 400);
      }
      return next;
    });
  }

  async function onComplete(final) {
    setStatus("completed");
    setPaused(true);
    setSaving(true);
    try {
      const res = await completeGame("jigsaw", {
        state: { difficulty, pieces: final, completed: true },
        score: elapsed,
        elapsed_seconds: elapsed,
        metadata: { difficulty, cols: cfg.cols, rows: cfg.rows },
      });
      setBestSeconds(res.best_score || elapsed);
    } catch (e) {
      // ignore
    }
    setSaving(false);
  }

  function onPointerDown(id, e) {
    const el = boardRef.current;
    if (!el) return;
    const scale = el.getBoundingClientRect().width / BOARD_W;
    const startX = e.clientX;
    const startY = e.clientY;
    setSelectedId(id);

    const onMove = (ev) => {
      const dx = (ev.clientX - startX) / scale;
      const dy = (ev.clientY - startY) / scale;
      movePiece(id, dx, dy);
    };
    const onUp = (ev) => {
      const dx = (ev.clientX - startX) / scale;
      const dy = (ev.clientY - startY) / scale;
      movePiece(id, dx, dy);
      trySnap(id);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function moveWithKeys(dir) {
    if (!selectedId) return;
    const step = 12;
    const delta = { ArrowUp: [0, -step], ArrowDown: [0, step], ArrowLeft: [-step, 0], ArrowRight: [step, 0] }[dir];
    if (delta) movePiece(selectedId, delta[0], delta[1]);
    if (dir === "Enter" || dir === " ") trySnap(selectedId);
    if (dir === "r") rotatePiece(selectedId);
  }

  useEffect(() => {
    const onKey = (e) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        moveWithKeys(e.key);
      }
      if (e.key === "r" || e.key === "Enter" || e.key === " ") moveWithKeys(e.key);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, pieces]);

  return (
    <GameShell
      gameKey="jigsaw"
      title="Us, But Broken"
      subtitle="A jigsaw of us. Somehow, we still fit."
      paused={paused}
      onTogglePause={status === "playing" ? () => setPaused((p) => !p) : null}
      onRestart={() => { setStatus("choose"); setPieces([]); setElapsed(0); }}
      instructions={[
        "Drag pieces onto the board. They snap when placed correctly.",
        "Cute Baby mode shows an outline. Higher difficulties do not.",
        "Rotation: click a piece to select, press R (desktop) or the rotate button.",
        "Keyboard: arrow keys move, Enter attempts snap, R rotates.",
        "Progress saves automatically every ~12 seconds.",
      ]}
      score={elapsed}
      bestScore={bestSeconds || 0}
      savingLabel={saving ? "Saving…" : undefined}
    >
      {status === "choose" && (
        <ChooseDifficulty onPick={startNew} />
      )}

      {status === "playing" && (
        <PlayBoard
          boardRef={boardRef}
          cfg={cfg}
          pieces={pieces}
          selectedId={selectedId}
          onPointerDown={onPointerDown}
          onTap={setSelectedId}
          onRotate={rotatePiece}
          showOutline={showOutline}
          toggleOutline={() => setShowOutline((v) => !v)}
          pieceW={pieceW}
          pieceH={pieceH}
        />
      )}

      {status === "completed" && (
        <CompletionScreen
          title="Even when everything is scrambled, we somehow still fit."
          subtitle="Board locked. Memory-card saved."
          achievement="WE STILL FIT"
          stats={[
            { label: "time", value: `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}` },
            { label: "pieces", value: `${cfg.cols * cfg.rows}` },
            { label: "difficulty", value: cfg.label },
            { label: "best", value: bestSeconds ? `${Math.floor(bestSeconds / 60)}:${String(bestSeconds % 60).padStart(2, "0")}` : "—" },
          ]}
          onReplay={() => { setStatus("choose"); setPieces([]); setElapsed(0); }}
          onExit={() => (window.location.href = "/games")}
        />
      )}
    </GameShell>
  );
}

function ChooseDifficulty({ onPick }) {
  return (
    <div className="grid md:grid-cols-3 gap-4" data-testid="jigsaw-choose">
      {Object.values(DIFFICULTIES).map((d) => (
        <button
          key={d.key}
          onClick={() => onPick(d.key)}
          data-testid={`jigsaw-diff-${d.key}`}
          className="text-left rounded-2xl border border-white/10 bg-surface-1 p-6 hover:border-lavender/40 transition-colors min-h-[180px] flex flex-col justify-between"
        >
          <span className="type-mono text-[9px] text-lavender/80">{d.cols * d.rows} pieces</span>
          <div>
            <h3 className="font-editorial text-2xl">{d.label}</h3>
            <p className="mt-1 text-sm text-text-secondary">
              {d.key === "cute-baby" && "Outline visible. No rotation. Snap generously."}
              {d.key === "serious" && "Rotation enabled. Outline optional."}
              {d.key === "mbbs" && "No outline. Tighter snap. May involve tears."}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}

function PlayBoard({ boardRef, cfg, pieces, selectedId, onPointerDown, onTap, onRotate, showOutline, toggleOutline, pieceW, pieceH }) {
  const placed = pieces.filter((p) => p.placed).length;
  const total = pieces.length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="type-mono text-[10px] text-text-muted">
          placed {placed}/{total}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleOutline} className="type-mono text-[9px] text-lavender border border-white/10 rounded-full px-3 py-1" data-testid="jigsaw-outline">
            {showOutline ? "hide outline" : "show outline"}
          </button>
          {cfg.rotate && selectedId && (
            <button onClick={() => onRotate(selectedId)} className="type-mono text-[9px] text-lavender border border-white/10 rounded-full px-3 py-1" data-testid="jigsaw-rotate">
              rotate 90°
            </button>
          )}
        </div>
      </div>

      <div
        ref={boardRef}
        className="relative w-full rounded-2xl border border-white/10 bg-surface-1 overflow-hidden touch-none select-none"
        style={{ aspectRatio: `${BOARD_W / (BOARD_H * 2 + TRAY_GAP)}` }}
        data-testid="jigsaw-board"
      >
        {/* Board zone */}
        <div className="absolute" style={{ left: 0, top: 0, width: BOARD_W, height: BOARD_H }}>
          {showOutline && JIGSAW_PHOTO && (
            <img
              src={JIGSAW_PHOTO}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none"
            />
          )}
          {showOutline && (
            <svg width={BOARD_W} height={BOARD_H} className="absolute inset-0 pointer-events-none">
              {Array.from({ length: cfg.cols + 1 }).map((_, i) => (
                <line key={`v${i}`} x1={i * pieceW} y1={0} x2={i * pieceW} y2={BOARD_H} stroke="rgba(184,156,255,0.25)" strokeDasharray="4 6" />
              ))}
              {Array.from({ length: cfg.rows + 1 }).map((_, i) => (
                <line key={`h${i}`} x1={0} y1={i * pieceH} x2={BOARD_W} y2={i * pieceH} stroke="rgba(184,156,255,0.25)" strokeDasharray="4 6" />
              ))}
            </svg>
          )}
          <div className="absolute inset-0 border border-lavender/30 rounded-md" />
          <span className="absolute bottom-2 right-2 type-mono text-[8px] text-lavender/50">JIGSAW BOARD</span>
        </div>

        {/* Tray zone — directly below the board, same width, always in bounds */}
        <div
          className="absolute border-t border-dashed border-white/10"
          style={{ left: 0, top: BOARD_H + TRAY_GAP / 2, width: BOARD_W, height: BOARD_H + TRAY_GAP / 2 }}
        >
          <span className="absolute -top-2 left-2 bg-surface-1 px-2 type-mono text-[9px] text-text-muted">TRAY</span>
        </div>

        {/* Pieces */}
        {pieces.map((p) => (
          <PieceRect
            key={p.id}
            piece={p}
            pieceW={pieceW}
            pieceH={pieceH}
            selected={selectedId === p.id}
            onPointerDown={(e) => onPointerDown(p.id, e)}
            onClick={() => onTap(p.id)}
          />
        ))}
      </div>
    </div>
  );
}

function PieceRect({ piece, pieceW, pieceH, selected, onPointerDown, onClick }) {
  const { r, c, x, y, rotation, placed } = piece;
  const bgStyle = JIGSAW_PHOTO
    ? {
        backgroundImage: `url(${JIGSAW_PHOTO})`,
        backgroundSize: `${BOARD_W}px ${BOARD_H}px`,
        backgroundPosition: `-${c * pieceW}px -${r * pieceH}px`,
      }
    : { background: `hsl(${(r * 47 + c * 83) % 360}, 50%, 45%)` };
  return (
    <div
      onPointerDown={(e) => { e.preventDefault(); onPointerDown(e); }}
      onClick={onClick}
      className={`absolute rounded-md shadow-lg cursor-grab active:cursor-grabbing transition-shadow ${selected ? "ring-2 ring-lavender" : ""} ${placed ? "opacity-100" : "opacity-95"}`}
      style={{
        left: x,
        top: y,
        width: pieceW,
        height: pieceH,
        ...bgStyle,
        transform: `rotate(${rotation}deg)`,
        transformOrigin: "center",
        boxShadow: selected ? "0 0 0 2px rgba(184,156,255,0.6), 0 10px 30px rgba(0,0,0,0.4)" : "0 6px 18px rgba(0,0,0,0.35)",
        userSelect: "none",
        touchAction: "none",
      }}
      data-testid={`jigsaw-piece-${piece.id}`}
    >
      <div className="absolute inset-0 rounded-md" style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.25)" }} />
    </div>
  );
}
