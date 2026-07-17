import React, { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors, closestCenter } from "@dnd-kit/core";
import { SortableContext, useSortable, arrayMove, horizontalListSortingStrategy, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GameShell, CompletionScreen } from "@/components/games/GameShell";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { TIMELINE_EVENTS } from "@/data/timelineEvents";
import { fetchGameSave, completeGame, startGame } from "@/lib/gamesApi";
import { useGameSave } from "@/hooks/useGameSave";
import { photoForAssetId } from "@/lib/realAssets";
import { photoForAyeshaAssetId } from "@/lib/ayeshaPhotos";

// Her birthday event gets a photo from Ayesha's own pool; everything else
// draws from the shared couple pool, keyed by event id so it's stable.
function photoForTimelineEvent(event) {
  if (event.id === "valentine") return photoForAyeshaAssetId(`TIMELINE-${event.id}`);
  return photoForAssetId(`TIMELINE-${event.id}`);
}

const MODES = {
  story: { key: "story", label: "Story Mode", count: 8, showDates: true },
  historian: { key: "historian", label: "Historian Mode", count: 10, showDates: false },
  chaos: { key: "chaos", label: "Chaos Mode", count: 12, showDates: false, decoys: true },
};

function pickEvents(mode) {
  const shuffled = [...TIMELINE_EVENTS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, mode.count);
}

export default function Timeline() {
  const [status, setStatus] = useState("choose");
  const [mode, setMode] = useState("story");
  const [order, setOrder] = useState([]);
  const [attempted, setAttempted] = useState(false);
  const [result, setResult] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [saving, setSaving] = useState(false);
  const [bestScore, setBestScore] = useState(0);
  const cfg = MODES[mode];

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor));

  // Load save
  useEffect(() => {
    (async () => {
      try {
        const save = await fetchGameSave("timeline");
        setBestScore(save?.best_score || 0);
        if (save?.state?.mode && save.status === "active" && save.state.order) {
          setMode(save.state.mode);
          setOrder(save.state.order);
          setElapsed(save.elapsed_seconds || 0);
          setStatus("playing");
        }
      } catch (e) {}
    })();
  }, []);

  useEffect(() => {
    if (status !== "playing") return;
    const iv = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(iv);
  }, [status]);

  const buildPayload = useCallback(() => {
    if (status !== "playing") return null;
    return {
      state: { mode, order },
      score: 0,
      elapsed_seconds: elapsed,
      status: "active",
    };
  }, [status, mode, order, elapsed]);

  useGameSave("timeline", buildPayload, { intervalMs: 15000, active: status === "playing" });

  function startNew(modeKey) {
    const m = MODES[modeKey];
    setMode(modeKey);
    setOrder(pickEvents(m));
    setElapsed(0);
    setAttempted(false);
    setResult(null);
    setHintsUsed(0);
    setStatus("playing");
    startGame("timeline").catch(() => {});
  }

  function onDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = order.findIndex((e) => e.id === active.id);
    const newIdx = order.findIndex((e) => e.id === over.id);
    setOrder((prev) => arrayMove(prev, oldIdx, newIdx));
  }

  function move(id, dir) {
    setOrder((prev) => {
      const i = prev.findIndex((e) => e.id === id);
      if (i < 0) return prev;
      const j = dir === "up" ? i - 1 : i + 1;
      if (j < 0 || j >= prev.length) return prev;
      return arrayMove(prev, i, j);
    });
  }

  async function submit() {
    setAttempted(true);
    // Ground truth ordering by sort
    const ground = [...order].sort((a, b) => a.sort - b.sort);
    const correctPos = order.filter((e, i) => e.id === ground[i].id).length;
    const accuracy = Math.round((correctPos / order.length) * 100);
    const score = Math.max(0, accuracy * 10 - hintsUsed * 30);
    const passed = accuracy >= 80;
    const r = {
      accuracy,
      correctPos,
      total: order.length,
      passed,
      score,
      elapsed,
    };
    setResult(r);
    if (passed) {
      setStatus("completed");
      setSaving(true);
      try {
        const res = await completeGame("timeline", {
          state: { mode, order, passed: true },
          score,
          elapsed_seconds: elapsed,
          metadata: { mode, accuracy },
        });
        setBestScore(res.best_score || score);
      } catch (e) {}
      setSaving(false);
    }
  }

  function useHint() {
    setHintsUsed((n) => n + 1);
    // Find one misplaced card and show its correct neighbour
    const ground = [...order].sort((a, b) => a.sort - b.sort);
    for (let i = 0; i < order.length; i++) {
      if (order[i].id !== ground[i].id) {
        alert(`Hint: "${ground[i].title}" should be in position ${i + 1}.`);
        return;
      }
    }
    alert("Everything looks correct. Submit it.");
  }

  return (
    <GameShell
      gameKey="timeline"
      title="Relationship Timeline"
      subtitle="Drag events into chronological order."
      onRestart={() => { setStatus("choose"); setOrder([]); setElapsed(0); setResult(null); }}
      instructions={[
        "Drag or use arrow buttons to reorder events.",
        "Story mode shows dates. Historian and Chaos hide most of them.",
        "Press Lock this history when you're done.",
        "You need 80% accuracy to complete.",
        "Hints reveal one misplaced card — they cost score.",
      ]}
      score={result?.score ?? 0}
      bestScore={bestScore}
      time={elapsed}
      savingLabel={saving ? "Saving…" : undefined}
    >
      {status === "choose" && (
        <div className="grid md:grid-cols-3 gap-4" data-testid="timeline-choose">
          {Object.values(MODES).map((m) => (
            <button
              key={m.key}
              onClick={() => startNew(m.key)}
              data-testid={`timeline-mode-${m.key}`}
              className="text-left rounded-2xl border border-white/10 bg-surface-1 p-6 hover:border-lavender/40 min-h-[160px] flex flex-col justify-between"
            >
              <span className="type-mono text-[9px] text-lavender/80">{m.count} events</span>
              <div>
                <h3 className="font-editorial text-2xl">{m.label}</h3>
                <p className="mt-1 text-sm text-text-secondary">
                  {m.key === "story" && "Dates visible. Contextual clues generous."}
                  {m.key === "historian" && "Most dates hidden. Some clues."}
                  {m.key === "chaos" && "Decoys, no dates on many cards, chaos."}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {status === "playing" && (
        <div className="flex flex-col gap-4" data-testid="timeline-play">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="type-mono text-[10px] text-text-muted">{cfg.label}</p>
            <div className="flex gap-2">
              <button onClick={useHint} className="type-mono text-[9px] border border-white/10 rounded-full px-3 py-1 text-lavender" data-testid="timeline-hint">
                hint · used {hintsUsed}
              </button>
              <MagneticButton variant="primary" size="sm" onClick={submit} data-testid="timeline-submit">
                lock this history
              </MagneticButton>
            </div>
          </div>

          <DndContext sensors={sensors} onDragEnd={onDragEnd} collisionDetection={closestCenter}>
            <SortableContext items={order.map((o) => o.id)} strategy={verticalListSortingStrategy}>
              <div className="grid gap-2">
                {order.map((event, idx) => (
                  <TimelineCard
                    key={event.id}
                    event={event}
                    idx={idx}
                    total={order.length}
                    showDate={cfg.showDates}
                    onMoveUp={() => move(event.id, "up")}
                    onMoveDown={() => move(event.id, "down")}
                    wrong={attempted && result && event.sort !== [...order].sort((a, b) => a.sort - b.sort)[idx]?.sort}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {result && !result.passed && (
            <div className="mt-4 rounded-xl border border-danger-red/40 bg-danger-red/5 p-4">
              <p className="font-hand text-2xl text-danger-red">Our relationship historian licence is under review.</p>
              <p className="text-sm text-text-secondary mt-2">
                Accuracy: {result.accuracy}%. Rearrange the misaligned cards (highlighted) and lock again.
              </p>
            </div>
          )}
        </div>
      )}

      {status === "completed" && (
        <CompletionScreen
          title="History restored. Embarrassing incidents preserved."
          subtitle={`Locked with ${result.accuracy}% accuracy.`}
          achievement="OFFICIAL RELATIONSHIP HISTORIAN"
          stats={[
            { label: "accuracy", value: `${result.accuracy}%` },
            { label: "time", value: `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}` },
            { label: "hints", value: hintsUsed },
            { label: "best score", value: bestScore },
          ]}
          onReplay={() => { setStatus("choose"); setResult(null); }}
          onExit={() => (window.location.href = "/games")}
        />
      )}
    </GameShell>
  );
}

function TimelineCard({ event, idx, total, showDate, onMoveUp, onMoveDown, wrong }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: event.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      animate={wrong ? { x: [0, -4, 4, -3, 0] } : { x: 0 }}
      transition={{ duration: 0.4 }}
      className={`flex items-center gap-3 rounded-xl border p-4 bg-surface-1 ${wrong ? "border-danger-red/40" : "border-white/10"} ${isDragging ? "ring-2 ring-lavender" : ""}`}
      data-testid={`timeline-card-${event.id}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-2 -ml-1 type-mono text-[10px] text-text-muted"
        aria-label="drag"
      >
        ⋮⋮
      </button>
      <span className="w-8 text-center type-mono text-[10px] text-lavender">{String(idx + 1).padStart(2, "0")}</span>
      <img
        src={photoForTimelineEvent(event)}
        alt=""
        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
      />
      <div className="flex-1">
        <h3 className="font-editorial text-lg leading-tight">{event.title}</h3>
        <p className="type-mono text-[9px] text-text-muted mt-1">
          {showDate ? event.date_label : "date hidden"} · {event.clue}
        </p>
      </div>
      <div className="flex flex-col gap-1">
        <button onClick={onMoveUp} disabled={idx === 0} className="w-8 h-6 border border-white/10 rounded text-xs text-text-secondary disabled:opacity-30" aria-label="move up" data-testid={`timeline-up-${event.id}`}>▲</button>
        <button onClick={onMoveDown} disabled={idx === total - 1} className="w-8 h-6 border border-white/10 rounded text-xs text-text-secondary disabled:opacity-30" aria-label="move down" data-testid={`timeline-down-${event.id}`}>▼</button>
      </div>
    </motion.div>
  );
}
