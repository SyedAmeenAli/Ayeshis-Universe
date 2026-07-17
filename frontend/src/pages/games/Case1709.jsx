import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameShell, Modal, CompletionScreen } from "@/components/games/GameShell";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { PhoneOS } from "@/components/case1709/PhoneOS";
import {
  CASE_META, CASE_ACTS, ACT_I, ACT_II, ACT_III, ACT_IV, ACT_V,
  normaliseCaseAnswer, normaliseDateAnswer,
} from "@/data/caseData";
import { fetchGameSave, completeGame, startGame, putGameSave, putEvidence, fetchCaseContent } from "@/lib/gamesApi";
import { useGameSave } from "@/hooks/useGameSave";
import { DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors, closestCenter } from "@dnd-kit/core";
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Lightbulb, Pin, X as XIcon } from "lucide-react";

const ACT_KEYS = ["act-i", "act-ii", "act-iii", "act-iv", "act-v"];

export default function Case1709() {
  const [status, setStatus] = useState("intro"); // intro | playing | completed
  const [act, setAct] = useState("act-i");
  const [solvedPuzzles, setSolvedPuzzles] = useState([]);
  const [hintsUsed, setHintsUsed] = useState({});
  const [elapsed, setElapsed] = useState(0);
  const [openApp, setOpenApp] = useState(null);
  const [openPuzzle, setOpenPuzzle] = useState(null);
  const [evidence, setEvidence] = useState([]); // {key, meta, act}
  const [saving, setSaving] = useState(false);
  const [showBoard, setShowBoard] = useState(false);
  const [best, setBest] = useState(0);
  const [act1UnlockedApps, setAct1UnlockedApps] = useState(new Set([
    "messages", "phone", "contacts", "gallery", "camera", "files", "notes", "maps", "browser", "mail", "calculator", "settings", "notif", "terminal", "board", "logs",
  ]));
  const [sarahUnlocked, setSarahUnlocked] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const save = await fetchGameSave("case-1709");
        setBest(save?.best_score || 0);
        const s = save?.state || {};
        if (s.current_act && save.status !== "completed") {
          setStatus("playing");
          setAct(s.current_act);
          setSolvedPuzzles(s.solved_puzzles || []);
          setHintsUsed(s.hints_used || {});
          setEvidence(s.evidence || []);
          setElapsed(save.elapsed_seconds || 0);
          setSarahUnlocked(!!s.sarah_unlocked);
          if (s.ghost_unlocked) setAct1UnlockedApps(new Set([...act1UnlockedApps, "ghost"]));
        }
      } catch (e) {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (status !== "playing") return;
    const iv = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(iv);
  }, [status]);

  // Unlock Ghost app when we reach Act IV
  useEffect(() => {
    if (act === "act-iv" || act === "act-v") {
      setAct1UnlockedApps((s) => new Set([...s, "ghost"]));
    }
  }, [act]);

  const buildPayload = useCallback(() => {
    if (status !== "playing") return null;
    return {
      state: {
        current_act: act,
        solved_puzzles: solvedPuzzles,
        hints_used: hintsUsed,
        evidence,
        sarah_unlocked: sarahUnlocked,
        ghost_unlocked: act === "act-iv" || act === "act-v",
      },
      score: computeScore(solvedPuzzles, hintsUsed),
      elapsed_seconds: elapsed,
      status: "active",
    };
  }, [status, act, solvedPuzzles, hintsUsed, evidence, elapsed, sarahUnlocked]);

  useGameSave("case-1709", buildPayload, { intervalMs: 15000, active: status === "playing" });

  function beginCase() {
    setStatus("playing");
    startGame("case-1709").catch(() => {});
  }

  function markSolved(actKey, puzzleKey) {
    const key = `${actKey}:${puzzleKey}`;
    if (solvedPuzzles.includes(key)) return;
    setSolvedPuzzles((prev) => [...prev, key]);
    // Advance to next act when all puzzles in current act are solved
    const acts = { "act-i": ACT_I, "act-ii": ACT_II, "act-iii": ACT_III, "act-iv": ACT_IV, "act-v": ACT_V };
    const cur = acts[actKey];
    const puzzles = cur.puzzles || [];
    // We consider all puzzle keys solved
    setTimeout(() => {
      const allSolved = puzzles.every((p) => solvedPuzzles.includes(`${actKey}:${p.key}`) || p.key === puzzleKey);
      if (allSolved && actKey !== "act-v") {
        const idx = ACT_KEYS.indexOf(actKey);
        setAct(ACT_KEYS[idx + 1]);
      } else if (allSolved && actKey === "act-v") {
        onComplete();
      }
    }, 250);
  }

  function consumeHint(actKey, puzzleKey) {
    const k = `${actKey}:${puzzleKey}`;
    setHintsUsed((prev) => ({ ...prev, [k]: (prev[k] || 0) + 1 }));
  }

  function pinEvidence(key, meta) {
    if (evidence.find((e) => e.key === key)) return;
    const newEv = [...evidence, { key, meta, act }];
    setEvidence(newEv);
    putEvidence(key, { pinned: true, inspected: true, act: ACT_KEYS.indexOf(act) + 1 }).catch(() => {});
  }

  function unpinEvidence(key) {
    setEvidence((prev) => prev.filter((e) => e.key !== key));
    putEvidence(key, { pinned: false }).catch(() => {});
  }

  async function onComplete() {
    setStatus("completed");
    setSaving(true);
    try {
      const score = computeScore(solvedPuzzles, hintsUsed);
      const res = await completeGame("case-1709", {
        state: { current_act: "act-v", solved_puzzles: solvedPuzzles, evidence, completed: true },
        score,
        elapsed_seconds: elapsed,
        metadata: { hints_used: hintsUsed },
      });
      setBest(res.best_score || score);
    } catch (e) {}
    setSaving(false);
  }

  const activeData = CASE_ACTS[act];
  const activePuzzles = activeData.puzzles;
  const currentPuzzle = openPuzzle && activePuzzles.find((p) => p.key === openPuzzle);

  return (
    <GameShell
      gameKey="case-1709"
      title="CASE 1709"
      subtitle={CASE_META.acts.find((a) => a.key === act)?.label}
      onRestart={() => { setStatus("intro"); setSolvedPuzzles([]); setEvidence([]); setElapsed(0); setAct("act-i"); setSarahUnlocked(false); }}
      instructions={[
        "This is not a quiz. Investigate real evidence.",
        "Open apps on the phone. Pin evidence to the board.",
        "Solve puzzles in the investigation panel. Use hints if stuck.",
        "Each act unlocks the next. All five must be completed.",
        "Autosaves every 15 seconds and on tab hidden.",
      ]}
      score={computeScore(solvedPuzzles, hintsUsed)}
      bestScore={best}
      time={elapsed}
      savingLabel={saving ? "Saving…" : undefined}
      className="bg-[#08090D]"
    >
      {status === "intro" && (
        <Opening onStart={beginCase} />
      )}

      {status === "playing" && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Left — objectives */}
          <div className="md:col-span-3 order-2 md:order-1">
            <ObjectivesPanel
              act={act}
              solvedPuzzles={solvedPuzzles}
              onSelectPuzzle={(k) => setOpenPuzzle(k)}
              onSwitchAct={setAct}
              onOpenBoard={() => setShowBoard(true)}
            />
          </div>

          {/* Center — phone */}
          <div className="md:col-span-6 order-1 md:order-2">
            <PhoneOS
              openApp={openApp}
              onAppOpen={setOpenApp}
              onAppClose={() => setOpenApp(null)}
              pinEvidence={pinEvidence}
              pinnedEvidence={evidence}
              unlockedApps={Array.from(act1UnlockedApps)}
              act={ACT_KEYS.indexOf(act) + 1}
              actions={{
                act1: { sarahUnlocked },
                evidenceList: () => evidence.map((e) => e.key),
                terminalPhrase: (p) => {
                  if (openPuzzle === "pungun") {
                    handleSubmit("act-i", "pungun", p);
                  }
                  if (openPuzzle === "terminal" && act === "act-v") {
                    handleSubmit("act-v", "terminal", p);
                  }
                },
              }}
            />
          </div>

          {/* Right — evidence sidebar */}
          <div className="md:col-span-3 order-3">
            <EvidenceSidebar evidence={evidence} onUnpin={unpinEvidence} onOpenBoard={() => setShowBoard(true)} />
          </div>
        </div>
      )}

      {status === "completed" && (
        <CaseEnding score={computeScore(solvedPuzzles, hintsUsed)} elapsed={elapsed} best={best} onReplay={() => { setStatus("intro"); setSolvedPuzzles([]); setEvidence([]); setElapsed(0); setAct("act-i"); }} />
      )}

      {/* Puzzle modal */}
      <PuzzleModal
        act={act}
        puzzle={currentPuzzle}
        open={!!currentPuzzle}
        onClose={() => setOpenPuzzle(null)}
        hintsUsed={hintsUsed[`${act}:${currentPuzzle?.key}`] || 0}
        onHint={() => consumeHint(act, currentPuzzle.key)}
        onSubmit={(val) => handleSubmit(act, currentPuzzle.key, val)}
        solvedPuzzles={solvedPuzzles}
        onSolve={(sub) => markSolved(act, sub || currentPuzzle.key)}
        onUnlockSarah={() => setSarahUnlocked(true)}
      />

      {/* Evidence board */}
      <Modal open={showBoard} onClose={() => setShowBoard(false)} title="Evidence Board" testid="case-evidence-board">
        <EvidenceBoard evidence={evidence} onUnpin={unpinEvidence} />
      </Modal>
    </GameShell>
  );

  function handleSubmit(actKey, puzzleKey, raw) {
    // Return { ok, message }
    const puzzle = CASE_ACTS[actKey].puzzles.find((p) => p.key === puzzleKey);
    if (!puzzle) return { ok: false, message: "no-puzzle" };
    let ok = false;
    if (puzzle.kind === "date") {
      ok = normaliseDateAnswer(raw, puzzle.answer_target);
    } else if (puzzle.kind === "phrase" || puzzle.kind === "code") {
      ok = normaliseCaseAnswer(raw) === puzzle.answer_target;
    } else if (puzzle.kind === "password") {
      ok = normaliseCaseAnswer(raw) === puzzle.answer_target;
      if (ok) setSarahUnlocked(true);
    } else if (puzzle.kind === "choice") {
      ok = String(raw) === String(puzzle.answer_target);
    }
    if (ok) markSolved(actKey, puzzleKey);
    return { ok };
  }
}

function computeScore(solved, hintsUsed) {
  const base = solved.length * 500;
  const penalty = Object.values(hintsUsed || {}).reduce((s, n) => s + n * 40, 0);
  return Math.max(0, base - penalty);
}

// ---------------------------------------------------------------------------
// Opening
// ---------------------------------------------------------------------------
function Opening({ onStart }) {
  const [step, setStep] = useState(0);
  const lines = [
    { text: "Archive access request received.", cls: "text-danger-red" },
    { text: "11:47 PM", cls: "text-text-primary type-mono text-2xl" },
    { text: "01:47:09", cls: "text-lavender font-mono text-5xl" },
    ...CASE_META.archivist_hail.map((t) => ({ text: t, cls: "text-text-primary" })),
    { text: "— THE ARCHIVIST", cls: "text-danger-red uppercase font-mono" },
  ];
  useEffect(() => {
    if (step >= lines.length) return;
    const t = setTimeout(() => setStep((s) => s + 1), 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);
  return (
    <div className="min-h-[60vh] rounded-2xl border border-white/10 bg-black p-8 md:p-14" data-testid="case-opening">
      <div className="space-y-3 max-w-2xl">
        {lines.slice(0, step + 1).map((l, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className={`font-editorial text-lg ${l.cls}`}
          >
            {l.text}
          </motion.p>
        ))}
      </div>
      {step >= lines.length - 1 && (
        <div className="mt-8">
          <MagneticButton variant="danger" size="lg" onClick={onStart} data-testid="case-start">
            access compromised phone
          </MagneticButton>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Objectives panel
// ---------------------------------------------------------------------------
function ObjectivesPanel({ act, solvedPuzzles, onSelectPuzzle, onSwitchAct, onOpenBoard }) {
  const data = CASE_ACTS[act];
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0E1015] p-4 space-y-3" data-testid="case-objectives">
      <div>
        <span className="type-mono text-[9px] text-detective-blue">CURRENT ACT</span>
        <p className="mt-1 font-editorial text-lg">{CASE_META.acts.find((a) => a.key === act)?.label}</p>
      </div>
      <div className="space-y-1">
        {ACT_KEYS.map((k, i) => {
          const isCurrent = k === act;
          const done = (CASE_ACTS[k].puzzles || []).every((p) => solvedPuzzles.includes(`${k}:${p.key}`));
          const canSwitch = i === 0 || (CASE_ACTS[ACT_KEYS[i - 1]].puzzles || []).every((p) => solvedPuzzles.includes(`${ACT_KEYS[i - 1]}:${p.key}`));
          return (
            <button
              key={k}
              disabled={!canSwitch}
              onClick={() => onSwitchAct(k)}
              className={`w-full text-left rounded-lg px-3 py-2 text-xs border ${isCurrent ? "border-lavender/60 bg-lavender/5" : "border-white/10"} disabled:opacity-40`}
              data-testid={`case-act-${k}`}
            >
              <div className="flex justify-between items-center">
                <span>{CASE_META.acts.find((a) => a.key === k)?.label}</span>
                {done && <span className="type-mono text-[9px] text-success-mint">✓</span>}
              </div>
              <span className="type-mono text-[9px] text-text-muted">{CASE_META.acts.find((a) => a.key === k)?.est}</span>
            </button>
          );
        })}
      </div>

      <div>
        <span className="type-mono text-[9px] text-detective-blue">PUZZLES</span>
        <div className="mt-2 space-y-1">
          {data.puzzles.map((p) => {
            const done = solvedPuzzles.includes(`${act}:${p.key}`);
            return (
              <button
                key={p.key}
                onClick={() => onSelectPuzzle(p.key)}
                className={`w-full text-left rounded-lg px-3 py-2 text-xs border ${done ? "border-success-mint/40 bg-success-mint/5 text-success-mint" : "border-white/10 hover:border-lavender/40"}`}
                data-testid={`case-puzzle-${p.key}`}
              >
                {done ? "✓ " : "· "} {p.title}
              </button>
            );
          })}
        </div>
      </div>
      <button onClick={onOpenBoard} className="w-full type-mono text-[9px] border border-white/10 rounded-full px-3 py-1 text-lavender" data-testid="case-open-board">
        open evidence board
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Evidence sidebar + board
// ---------------------------------------------------------------------------
function EvidenceSidebar({ evidence, onUnpin, onOpenBoard }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0E1015] p-4">
      <div className="flex justify-between items-center mb-2">
        <span className="type-mono text-[9px] text-detective-blue">EVIDENCE · {evidence.length}</span>
        <button onClick={onOpenBoard} className="type-mono text-[9px] text-lavender" data-testid="case-sidebar-open-board">board →</button>
      </div>
      {evidence.length === 0 ? (
        <p className="type-mono text-[9px] text-text-muted">No evidence pinned. Explore apps and pin what matters.</p>
      ) : (
        <ul className="space-y-1 max-h-[420px] overflow-y-auto">
          {evidence.map((e) => (
            <li key={e.key} className="text-xs rounded-lg border border-white/10 bg-surface-2 p-2 flex justify-between items-start gap-2">
              <div>
                <p className="text-text-primary">{e.meta?.label || e.meta?.subject || e.meta?.name || e.key}</p>
                <p className="type-mono text-[9px] text-text-muted">{e.meta?.kind || "note"} · {e.act}</p>
              </div>
              <button onClick={() => onUnpin(e.key)} className="text-text-muted hover:text-danger-red" data-testid={`case-unpin-${e.key}`}>
                <XIcon className="w-3 h-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EvidenceBoard({ evidence, onUnpin }) {
  const [positions, setPositions] = useState(() => Object.fromEntries(evidence.map((e, i) => [e.key, { x: 40 + (i % 4) * 120, y: 40 + Math.floor(i / 4) * 100 }])));
  const containerRef = useRef(null);

  useEffect(() => {
    setPositions((prev) => {
      const p = { ...prev };
      evidence.forEach((e, i) => {
        if (!p[e.key]) p[e.key] = { x: 40 + (i % 4) * 120, y: 40 + Math.floor(i / 4) * 100 };
      });
      return p;
    });
  }, [evidence]);

  function onDrag(key, e) {
    const rect = containerRef.current.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const start = positions[key] || { x: 0, y: 0 };
    const onMove = (ev) => {
      setPositions((p) => ({ ...p, [key]: { x: start.x + (ev.clientX - startX), y: start.y + (ev.clientY - startY) } }));
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      // persist
      putEvidence(key, { board_position: positions[key] || start }).catch(() => {});
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  return (
    <div ref={containerRef} className="relative w-full h-[420px] rounded-xl border border-white/10 bg-black overflow-hidden" data-testid="case-board-canvas">
      {evidence.length === 0 && <p className="absolute inset-0 flex items-center justify-center type-mono text-[10px] text-text-muted">No evidence to arrange.</p>}
      {evidence.map((e) => {
        const p = positions[e.key] || { x: 20, y: 20 };
        return (
          <div
            key={e.key}
            onPointerDown={(ev) => onDrag(e.key, ev)}
            style={{ left: p.x, top: p.y, transform: "rotate(-1deg)" }}
            className="absolute cursor-grab active:cursor-grabbing rounded-md bg-ivory text-archive p-2 w-[110px] text-[10px] shadow-lg"
            data-testid={`case-board-item-${e.key}`}
          >
            <p className="font-medium truncate">{e.meta?.label || e.meta?.subject || e.meta?.name || e.key}</p>
            <p className="type-mono text-[8px] text-archive/70">{e.meta?.kind || "note"}</p>
            <button onClick={(ev) => { ev.stopPropagation(); onUnpin(e.key); }} className="mt-1 type-mono text-[8px] text-danger-red">remove</button>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Puzzle modal — dispatches by puzzle kind
// ---------------------------------------------------------------------------
function PuzzleModal({ act, puzzle, open, onClose, hintsUsed, onHint, onSubmit, solvedPuzzles, onSolve, onUnlockSarah }) {
  if (!puzzle) return null;
  const solved = solvedPuzzles.includes(`${act}:${puzzle.key}`);
  return (
    <Modal open={open} onClose={onClose} title={puzzle.title} testid={`case-puzzle-modal-${puzzle.key}`}>
      {solved ? (
        <p className="type-mono text-[10px] text-success-mint">This puzzle is already solved. Close to move on.</p>
      ) : (
        <PuzzleBody
          act={act}
          puzzle={puzzle}
          onHint={onHint}
          hintsUsed={hintsUsed}
          onSubmit={onSubmit}
          onSolve={onSolve}
          onClose={onClose}
          onUnlockSarah={onUnlockSarah}
        />
      )}
    </Modal>
  );
}

function PuzzleBody({ act, puzzle, onHint, hintsUsed, onSubmit, onSolve, onClose, onUnlockSarah }) {
  // sarah has a dedicated component (password unlock + contradiction follow-up)
  // and must be checked before the generic kind-based dispatch below, since its
  // kind is "password" and would otherwise be swallowed by that branch.
  if (puzzle.key === "sarah") return <SarahPuzzle puzzle={puzzle} onSolve={onSolve} onHint={onHint} hintsUsed={hintsUsed} onUnlockSarah={onUnlockSarah} />;
  // Simple prompt puzzles: firewall, pungun (phrase), cabinet (code), packet firewall
  if (["date", "phrase", "password", "code"].includes(puzzle.kind)) {
    return <TextPuzzle puzzle={puzzle} onSubmit={onSubmit} onHint={onHint} hintsUsed={hintsUsed} onClose={onClose} />;
  }
  if (puzzle.key === "notif") return <NotificationPuzzle puzzle={puzzle} onSolve={onSolve} onHint={onHint} hintsUsed={hintsUsed} />;
  if (puzzle.key === "cctv") return <CCTVPuzzle puzzle={puzzle} onSolve={onSolve} onHint={onHint} hintsUsed={hintsUsed} />;
  if (puzzle.key === "lift") return <ChoicePuzzle puzzle={puzzle} onSolve={onSolve} onHint={onHint} hintsUsed={hintsUsed} />;
  if (puzzle.key === "spectro") return <SpectroPuzzle puzzle={puzzle} onSolve={onSolve} onHint={onHint} hintsUsed={hintsUsed} />;
  if (puzzle.key === "receipt") return <ReceiptPuzzle puzzle={puzzle} onSolve={onSolve} onHint={onHint} hintsUsed={hintsUsed} />;
  if (puzzle.key === "toxidrome") return <ToxidromePuzzle puzzle={puzzle} onSolve={onSolve} onHint={onHint} hintsUsed={hintsUsed} />;
  if (puzzle.key === "willis") return <WillisPuzzle puzzle={puzzle} onSolve={onSolve} onHint={onHint} hintsUsed={hintsUsed} />;
  if (puzzle.key === "cranial") return <CranialPuzzle puzzle={puzzle} onSolve={onSolve} onHint={onHint} hintsUsed={hintsUsed} />;
  if (puzzle.key === "mechanism") return <MechanismPuzzle puzzle={puzzle} onSolve={onSolve} onHint={onHint} hintsUsed={hintsUsed} />;
  if (puzzle.key === "vehicle") return <VehiclePuzzle puzzle={puzzle} onSolve={onSolve} onHint={onHint} hintsUsed={hintsUsed} />;
  if (puzzle.key === "route") return <RoutePuzzle puzzle={puzzle} onSolve={onSolve} onHint={onHint} hintsUsed={hintsUsed} />;
  if (puzzle.key === "packet") return <PacketPuzzle puzzle={puzzle} onSolve={onSolve} onHint={onHint} hintsUsed={hintsUsed} />;
  if (puzzle.key === "steg") return <StegPuzzle puzzle={puzzle} onSolve={onSolve} onHint={onHint} hintsUsed={hintsUsed} />;
  if (puzzle.key === "cabinets") return <CabinetsPuzzle puzzle={puzzle} onSolve={onSolve} onHint={onHint} hintsUsed={hintsUsed} />;
  if (puzzle.key === "contradictions") return <ContradictionsPuzzle puzzle={puzzle} onSolve={onSolve} onHint={onHint} hintsUsed={hintsUsed} />;
  if (puzzle.key === "identity") return <IdentityPuzzle puzzle={puzzle} onSolve={onSolve} />;
  if (puzzle.key === "terminal") return <TerminalPuzzle puzzle={puzzle} onSolve={onSolve} onHint={onHint} hintsUsed={hintsUsed} />;
  return <p>Unsupported puzzle.</p>;
}

function HintTray({ puzzle, onHint, hintsUsed }) {
  const [visible, setVisible] = useState(0);
  useEffect(() => setVisible(hintsUsed || 0), [hintsUsed]);
  return (
    <div className="mt-4 rounded-lg bg-surface-2 border border-white/8 p-3">
      <div className="flex items-center gap-2 mb-2">
        <Lightbulb className="w-3 h-3 text-warning-gold" />
        <span className="type-mono text-[9px] text-warning-gold">HINTS · used {visible}</span>
      </div>
      <ul className="space-y-1">
        {(puzzle.hints || []).map((h, i) => (
          <li key={i} className={`text-xs ${i < visible ? "text-text-primary" : "text-text-muted"}`}>
            {i < visible ? h : "•••"}
          </li>
        ))}
      </ul>
      <button
        onClick={() => { onHint(); setVisible((v) => v + 1); }}
        disabled={visible >= (puzzle.hints || []).length}
        className="mt-2 type-mono text-[9px] text-lavender disabled:opacity-30"
        data-testid={`case-hint-${puzzle.key}`}
      >
        reveal next hint (-40 pts)
      </button>
    </div>
  );
}

// -------------------- Puzzle components --------------------
function TextPuzzle({ puzzle, onSubmit, onHint, hintsUsed, onClose }) {
  const [val, setVal] = useState("");
  const [error, setError] = useState("");
  function submit() {
    const res = onSubmit(val);
    if (res?.ok) {
      onClose();
    } else {
      setError("Not quite. Try again.");
      setTimeout(() => setError(""), 1500);
    }
  }
  return (
    <div>
      <p className="text-sm text-text-secondary">{puzzle.prompt}</p>
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="type your answer…"
        className="mt-3 w-full bg-surface-2 border border-white/10 rounded-lg px-3 py-2 text-sm"
        data-testid={`case-text-input-${puzzle.key}`}
        onKeyDown={(e) => e.key === "Enter" && submit()}
      />
      {error && <p className="mt-2 text-xs text-danger-red">{error}</p>}
      <div className="mt-3 flex gap-2">
        <MagneticButton variant="primary" size="sm" onClick={submit} data-testid={`case-submit-${puzzle.key}`}>submit</MagneticButton>
      </div>
      <HintTray puzzle={puzzle} onHint={onHint} hintsUsed={hintsUsed} />
    </div>
  );
}

function SarahPuzzle({ puzzle, onSolve, onHint, hintsUsed, onUnlockSarah }) {
  const [pwd, setPwd] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [inspected, setInspected] = useState([]);
  const [conclusion, setConclusion] = useState(null);
  const [error, setError] = useState("");

  function submitPwd() {
    if (normaliseCaseAnswer(pwd) === puzzle.answer_target) {
      setUnlocked(true);
      onUnlockSarah();
    } else {
      setError("Wrong password.");
      setTimeout(() => setError(""), 1500);
    }
  }

  function toggleInspect(key) {
    setInspected((prev) => prev.includes(key) ? prev : [...prev, key]);
  }

  function submitConclusion() {
    if (inspected.length < 3) {
      setError("Inspect at least three contradictions first.");
      setTimeout(() => setError(""), 1500);
      return;
    }
    if (conclusion === puzzle.followUp.correct) {
      onSolve();
    } else {
      setError("Reconsider.");
      setTimeout(() => setError(""), 1500);
    }
  }

  if (!unlocked) {
    return (
      <div>
        <p className="text-sm text-text-secondary">{puzzle.prompt}</p>
        <input value={pwd} onChange={(e) => setPwd(e.target.value)} className="mt-3 w-full bg-surface-2 border border-white/10 rounded-lg px-3 py-2 text-sm" data-testid="case-sarah-pwd" />
        {error && <p className="mt-2 text-xs text-danger-red">{error}</p>}
        <div className="mt-3"><MagneticButton variant="primary" size="sm" onClick={submitPwd} data-testid="case-sarah-submit">unlock</MagneticButton></div>
        <HintTray puzzle={puzzle} onHint={onHint} hintsUsed={hintsUsed} />
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-text-secondary">{puzzle.followUp.prompt}</p>
      <div className="mt-3 grid gap-2">
        {puzzle.followUp.contradictions.map((c) => (
          <button
            key={c.key}
            onClick={() => toggleInspect(c.key)}
            className={`text-left rounded-lg border p-2 text-xs ${inspected.includes(c.key) ? "border-success-mint/40 bg-success-mint/5 text-success-mint" : "border-white/10 hover:border-lavender/40"}`}
            data-testid={`case-contradiction-${c.key}`}
          >
            {inspected.includes(c.key) ? "✓ " : "· "}{c.label}
          </button>
        ))}
      </div>
      <p className="mt-4 type-mono text-[9px] text-text-muted">inspected {inspected.length}/{puzzle.followUp.contradictions.length}</p>
      <div className="mt-3 grid gap-2">
        {puzzle.followUp.options.map((o) => (
          <button
            key={o.id}
            onClick={() => setConclusion(o.id)}
            className={`text-left rounded-lg border p-2 text-xs ${conclusion === o.id ? "border-lavender bg-lavender/5" : "border-white/10"}`}
            data-testid={`case-sarah-conclusion-${o.id}`}
          >
            {o.label}
          </button>
        ))}
      </div>
      {error && <p className="mt-2 text-xs text-danger-red">{error}</p>}
      <div className="mt-3"><MagneticButton variant="primary" size="sm" onClick={submitConclusion} data-testid="case-sarah-conclude">conclude</MagneticButton></div>
    </div>
  );
}

function NotificationPuzzle({ puzzle, onSolve, onHint, hintsUsed }) {
  const [order, setOrder] = useState(() => [...puzzle.items].sort(() => Math.random() - 0.5));
  const [error, setError] = useState("");
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor));
  function submit() {
    const attempt = order.map((i) => i.id).join(",");
    const correct = puzzle.correctOrder.join(",");
    if (attempt === correct) onSolve();
    else { setError("Order looks off."); setTimeout(() => setError(""), 1500); }
  }
  return (
    <div>
      <p className="text-sm text-text-secondary">{puzzle.prompt}</p>
      <DndContext sensors={sensors} onDragEnd={(e) => {
        const { active, over } = e;
        if (!over || active.id === over.id) return;
        const from = order.findIndex((x) => x.id === active.id);
        const to = order.findIndex((x) => x.id === over.id);
        setOrder(arrayMove(order, from, to));
      }} collisionDetection={closestCenter}>
        <SortableContext items={order.map((o) => o.id)} strategy={verticalListSortingStrategy}>
          <div className="mt-3 space-y-2">
            {order.map((it) => <SortableRow key={it.id} id={it.id} label={`${it.ts} · ${it.label}`} />)}
          </div>
        </SortableContext>
      </DndContext>
      {error && <p className="mt-2 text-xs text-danger-red">{error}</p>}
      <div className="mt-3"><MagneticButton variant="primary" size="sm" onClick={submit} data-testid="case-notif-submit">lock order</MagneticButton></div>
      <HintTray puzzle={puzzle} onHint={onHint} hintsUsed={hintsUsed} />
    </div>
  );
}

function SortableRow({ id, label }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} {...attributes} {...listeners}
      className="rounded-lg border border-white/10 bg-surface-2 p-2 text-xs cursor-grab active:cursor-grabbing" data-testid={`case-sortable-${id}`}>
      {label}
    </div>
  );
}

function CCTVPuzzle({ puzzle, onSolve, onHint, hintsUsed }) {
  const [order, setOrder] = useState(() => [...puzzle.stills].sort(() => Math.random() - 0.5));
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor));
  const [error, setError] = useState("");
  function submit() {
    if (order.map((s) => s.id).join(",") === puzzle.correctOrder.join(",")) onSolve();
    else { setError("Not the right sequence."); setTimeout(() => setError(""), 1500); }
  }
  return (
    <div>
      <p className="text-sm text-text-secondary">{puzzle.prompt}</p>
      <DndContext sensors={sensors} onDragEnd={(e) => {
        const { active, over } = e;
        if (!over || active.id === over.id) return;
        setOrder(arrayMove(order, order.findIndex((x) => x.id === active.id), order.findIndex((x) => x.id === over.id)));
      }} collisionDetection={closestCenter}>
        <SortableContext items={order.map((o) => o.id)} strategy={verticalListSortingStrategy}>
          <div className="mt-3 space-y-1 max-h-[300px] overflow-y-auto">
            {order.map((s, i) => <SortableRow key={s.id} id={s.id} label={`${String(i+1).padStart(2,'0')} · ${s.label}`} />)}
          </div>
        </SortableContext>
      </DndContext>
      {error && <p className="mt-2 text-xs text-danger-red">{error}</p>}
      <div className="mt-3"><MagneticButton variant="primary" size="sm" onClick={submit} data-testid="case-cctv-submit">lock sequence</MagneticButton></div>
      <HintTray puzzle={puzzle} onHint={onHint} hintsUsed={hintsUsed} />
    </div>
  );
}

function ChoicePuzzle({ puzzle, onSolve, onHint, hintsUsed }) {
  const [pick, setPick] = useState(null);
  const [error, setError] = useState("");
  function submit() {
    if (String(pick) === String(puzzle.answer_target)) onSolve();
    else { setError("Wrong floor."); setTimeout(() => setError(""), 1500); }
  }
  return (
    <div>
      <p className="text-sm text-text-secondary">{puzzle.prompt}</p>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {puzzle.choices.map((c) => (
          <button key={c} onClick={() => setPick(c)} className={`rounded-lg border p-3 text-sm ${pick === c ? "border-lavender bg-lavender/5" : "border-white/10"}`} data-testid={`case-lift-${c}`}>
            {c}
          </button>
        ))}
      </div>
      {error && <p className="mt-2 text-xs text-danger-red">{error}</p>}
      <div className="mt-3"><MagneticButton variant="primary" size="sm" onClick={submit} data-testid="case-lift-submit">confirm</MagneticButton></div>
      {puzzle.reveal && <p className="mt-2 type-mono text-[9px] text-text-muted">Solving reveals: {puzzle.reveal}</p>}
      <HintTray puzzle={puzzle} onHint={onHint} hintsUsed={hintsUsed} />
    </div>
  );
}

function SpectroPuzzle({ puzzle, onSolve, onHint, hintsUsed }) {
  const [applied, setApplied] = useState([]);
  function apply(op) {
    setApplied((prev) => {
      // If undoing "invert", toggle
      const nxt = [...prev, op];
      return nxt;
    });
  }
  function reset() { setApplied([]); }
  function submit() {
    if (applied.join(",") === puzzle.sequence.join(",")) onSolve();
    else { alert("The image is still unreadable."); }
  }
  return (
    <div>
      <p className="text-sm text-text-secondary">{puzzle.prompt}</p>
      <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2">
        {["rotate90", "rotate180", "invert", "contrast", "frequency", "reset"].map((op) => (
          <button
            key={op}
            onClick={() => op === "reset" ? reset() : apply(op)}
            className={`rounded-lg border p-2 text-xs ${applied.includes(op) ? "border-lavender bg-lavender/5" : "border-white/10"}`}
            data-testid={`case-spectro-${op}`}
          >
            {op}
          </button>
        ))}
      </div>
      <p className="mt-2 type-mono text-[9px] text-text-muted">applied: {applied.join(" → ") || "none"}</p>
      <div className="mt-3"><MagneticButton variant="primary" size="sm" onClick={submit} data-testid="case-spectro-submit">read image</MagneticButton></div>
      <HintTray puzzle={puzzle} onHint={onHint} hintsUsed={hintsUsed} />
    </div>
  );
}

function ReceiptPuzzle({ puzzle, onSolve, onHint, hintsUsed }) {
  const [order, setOrder] = useState(() => [...puzzle.items].sort(() => Math.random() - 0.5));
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor));
  const [error, setError] = useState("");
  function submit() {
    if (order.map((i) => i.id).join(",") === puzzle.correctOrder.join(",")) onSolve();
    else { setError("Not chronological."); setTimeout(() => setError(""), 1500); }
  }
  return (
    <div>
      <p className="text-sm text-text-secondary">{puzzle.prompt}</p>
      <DndContext sensors={sensors} onDragEnd={(e) => {
        const { active, over } = e;
        if (!over || active.id === over.id) return;
        setOrder(arrayMove(order, order.findIndex((x) => x.id === active.id), order.findIndex((x) => x.id === over.id)));
      }} collisionDetection={closestCenter}>
        <SortableContext items={order.map((o) => o.id)} strategy={verticalListSortingStrategy}>
          <div className="mt-3 space-y-2">
            {order.map((it) => <SortableRow key={it.id} id={it.id} label={`${it.date} · reveals "${it.letter}"`} />)}
          </div>
        </SortableContext>
      </DndContext>
      {error && <p className="mt-2 text-xs text-danger-red">{error}</p>}
      <div className="mt-3"><MagneticButton variant="primary" size="sm" onClick={submit} data-testid="case-receipt-submit">read letters</MagneticButton></div>
      <HintTray puzzle={puzzle} onHint={onHint} hintsUsed={hintsUsed} />
    </div>
  );
}

function ToxidromePuzzle({ puzzle, onSolve, onHint, hintsUsed }) {
  const [selected, setSelected] = useState([]);
  const [choice, setChoice] = useState(null);
  const [error, setError] = useState("");
  function submit() {
    if (selected.length < puzzle.required_selection) { setError(`Select at least ${puzzle.required_selection} supporting symptoms.`); return; }
    if (choice === puzzle.correct) onSolve();
    else setError("Not the right toxidrome.");
    setTimeout(() => setError(""), 1500);
  }
  return (
    <div>
      <p className="text-sm text-text-secondary">{puzzle.prompt}</p>
      <div className="mt-3 grid gap-2">
        {puzzle.symptoms.map((s) => (
          <button key={s} onClick={() => setSelected((p) => p.includes(s) ? p.filter((x) => x !== s) : [...p, s])}
            className={`text-left rounded-lg border p-2 text-xs ${selected.includes(s) ? "border-success-mint/40 bg-success-mint/5 text-success-mint" : "border-white/10"}`}
            data-testid={`case-symptom-${s.replace(/\s+/g, '-')}`}
          >
            {selected.includes(s) ? "✓ " : "· "}{s}
          </button>
        ))}
      </div>
      <div className="mt-3 grid gap-2">
        {puzzle.choices.map((c) => (
          <button key={c.id} onClick={() => setChoice(c.id)} className={`text-left rounded-lg border p-2 text-xs ${choice === c.id ? "border-lavender bg-lavender/5" : "border-white/10"}`} data-testid={`case-tox-${c.id}`}>
            {c.label}
          </button>
        ))}
      </div>
      {error && <p className="mt-2 text-xs text-danger-red">{error}</p>}
      <div className="mt-3"><MagneticButton variant="primary" size="sm" onClick={submit} data-testid="case-tox-submit">diagnose</MagneticButton></div>
      <HintTray puzzle={puzzle} onHint={onHint} hintsUsed={hintsUsed} />
    </div>
  );
}

function WillisPuzzle({ puzzle, onSolve, onHint, hintsUsed }) {
  const [assignments, setAssignments] = useState({});
  const [error, setError] = useState("");
  function assign(slot, label) {
    setAssignments((prev) => ({ ...prev, [slot]: label }));
  }
  function submit() {
    const ok = puzzle.slots.every((s) => assignments[s] === puzzle.correct_map[s]);
    if (ok) onSolve();
    else { setError("Placement not quite right."); setTimeout(() => setError(""), 1500); }
  }
  return (
    <div>
      <p className="text-sm text-text-secondary">{puzzle.prompt}</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {puzzle.slots.map((s) => (
          <div key={s} className="rounded-lg border border-white/10 p-2 text-xs">
            <span className="type-mono text-[9px] text-lavender">SLOT {s}</span>
            <select value={assignments[s] || ""} onChange={(e) => assign(s, e.target.value)} className="w-full bg-surface-2 mt-1 rounded p-1 text-xs" data-testid={`case-willis-${s}`}>
              <option value="">—</option>
              {puzzle.labels.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        ))}
      </div>
      {error && <p className="mt-2 text-xs text-danger-red">{error}</p>}
      <div className="mt-3"><MagneticButton variant="primary" size="sm" onClick={submit} data-testid="case-willis-submit">confirm placement</MagneticButton></div>
      <HintTray puzzle={puzzle} onHint={onHint} hintsUsed={hintsUsed} />
    </div>
  );
}

function CranialPuzzle({ puzzle, onSolve, onHint, hintsUsed }) {
  const [pick, setPick] = useState(null);
  return (
    <div>
      <p className="text-sm text-text-secondary">{puzzle.prompt}</p>
      <div className="mt-3 grid gap-2">
        {puzzle.choices.map((c) => (
          <button key={c.id} onClick={() => setPick(c.id)} className={`text-left rounded-lg border p-2 text-xs ${pick === c.id ? "border-lavender bg-lavender/5" : "border-white/10"}`} data-testid={`case-cranial-${c.id}`}>{c.label}</button>
        ))}
      </div>
      <div className="mt-3"><MagneticButton variant="primary" size="sm" onClick={() => pick === puzzle.correct ? onSolve() : alert("Not that nerve.")} data-testid="case-cranial-submit">diagnose</MagneticButton></div>
      <HintTray puzzle={puzzle} onHint={onHint} hintsUsed={hintsUsed} />
    </div>
  );
}

function MechanismPuzzle({ puzzle, onSolve, onHint, hintsUsed }) {
  const drugs = puzzle.pairs.map((p) => p.drug);
  const mechs = [...puzzle.pairs.map((p) => p.mech)].sort(() => Math.random() - 0.5);
  const [assign, setAssign] = useState({});
  function submit() {
    const ok = puzzle.pairs.every((p) => assign[p.drug] === p.mech);
    if (ok) onSolve();
    else alert("Reconsider the pharmacology.");
  }
  return (
    <div>
      <p className="text-sm text-text-secondary">{puzzle.prompt}</p>
      <div className="mt-3 grid gap-2">
        {drugs.map((d) => (
          <div key={d} className="flex items-center gap-2">
            <span className="type-mono text-[10px] text-lavender w-24">{d}</span>
            <select value={assign[d] || ""} onChange={(e) => setAssign((p) => ({ ...p, [d]: e.target.value }))} className="flex-1 bg-surface-2 border border-white/10 rounded p-1 text-xs" data-testid={`case-mech-${d}`}>
              <option value="">—</option>
              {mechs.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        ))}
      </div>
      <div className="mt-3"><MagneticButton variant="primary" size="sm" onClick={submit} data-testid="case-mech-submit">match all</MagneticButton></div>
      <HintTray puzzle={puzzle} onHint={onHint} hintsUsed={hintsUsed} />
    </div>
  );
}

function VehiclePuzzle({ puzzle, onSolve, onHint, hintsUsed }) {
  const [selected, setSelected] = useState({ tail: false, bow: false, sleeve: false });
  const [pick, setPick] = useState(null);
  function submit() {
    if (!selected.tail || !selected.bow || !selected.sleeve) { alert("Select all three evidence traits first."); return; }
    if (pick === puzzle.correct) onSolve();
    else alert("That is a similar vehicle. Not the one.");
  }
  return (
    <div>
      <p className="text-sm text-text-secondary">{puzzle.prompt}</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {["tail", "bow", "sleeve"].map((t) => (
          <button key={t} onClick={() => setSelected((p) => ({ ...p, [t]: !p[t] }))} className={`rounded-lg border p-2 text-xs ${selected[t] ? "border-success-mint/40 bg-success-mint/5 text-success-mint" : "border-white/10"}`} data-testid={`case-veh-evi-${t}`}>
            {selected[t] ? "✓ " : "· "}{t === "tail" ? "broken tail-light" : t === "bow" ? "bow reflection" : "grey sleeve"}
          </button>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2">
        {puzzle.vehicles.map((v) => (
          <button key={v.id} onClick={() => setPick(v.id)} className={`rounded-lg border p-3 text-xs text-left ${pick === v.id ? "border-lavender bg-lavender/5" : "border-white/10"}`} data-testid={`case-veh-${v.id}`}>
            <p className="type-mono text-[9px] text-lavender">{v.plate}</p>
            <p className="mt-1">{v.note}</p>
            <p className="type-mono text-[8px] text-text-muted mt-1">
              {v.tail ? "· tail-light broken " : ""}
              {v.bow ? "· bow reflection " : ""}
              {v.sleeve ? "· grey sleeve" : ""}
            </p>
          </button>
        ))}
      </div>
      <div className="mt-3"><MagneticButton variant="primary" size="sm" onClick={submit} data-testid="case-veh-submit">identify</MagneticButton></div>
      <HintTray puzzle={puzzle} onHint={onHint} hintsUsed={hintsUsed} />
    </div>
  );
}

function RoutePuzzle({ puzzle, onSolve, onHint, hintsUsed }) {
  const [removed, setRemoved] = useState(null);
  function submit() {
    if (removed === puzzle.wrong) onSolve();
    else alert("That checkpoint is legitimate.");
  }
  return (
    <div>
      <p className="text-sm text-text-secondary">{puzzle.prompt}</p>
      <div className="mt-3 grid gap-2">
        {puzzle.checkpoints.map((c) => (
          <button key={c.id} onClick={() => setRemoved(c.id)} className={`rounded-lg border p-2 text-xs text-left ${removed === c.id ? "border-danger-red/50 bg-danger-red/5" : "border-white/10"}`} data-testid={`case-route-${c.id}`}>
            <span className="type-mono text-[10px] text-lavender">{c.time}</span> · {c.note}
          </button>
        ))}
      </div>
      <p className="mt-2 type-mono text-[9px] text-text-muted">selected to remove: {removed || "none"}</p>
      <div className="mt-3"><MagneticButton variant="primary" size="sm" onClick={submit} data-testid="case-route-submit">confirm</MagneticButton></div>
      <HintTray puzzle={puzzle} onHint={onHint} hintsUsed={hintsUsed} />
    </div>
  );
}

function PacketPuzzle({ puzzle, onSolve, onHint, hintsUsed }) {
  const [srcF, setSrcF] = useState("");
  const [statusF, setStatusF] = useState("");
  const [protoF, setProtoF] = useState("");
  const [decoded, setDecoded] = useState("");
  const [pwd, setPwd] = useState("");
  const filtered = puzzle.packets.filter((p) =>
    (!srcF || p.src === srcF) && (!statusF || p.status === statusF) && (!protoF || p.proto === protoF)
  );
  function decode(p) {
    try {
      const t = atob(p.payload);
      setDecoded(t);
    } catch (e) { setDecoded("(cannot decode)"); }
  }
  function submitPwd() {
    if (normaliseDateAnswer(pwd, puzzle.answer_target)) onSolve();
    else alert("Firewall rejects.");
  }
  return (
    <div>
      <p className="text-sm text-text-secondary">{puzzle.prompt}</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <select value={srcF} onChange={(e) => setSrcF(e.target.value)} className="bg-surface-2 border border-white/10 rounded p-1 text-xs" data-testid="case-packet-src">
          <option value="">source: any</option>
          <option value="AMEEN_PHONE">AMEEN_PHONE</option>
          <option value="ARCHIVIST_NODE">ARCHIVIST_NODE</option>
          <option value="SARAH_PHONE">SARAH_PHONE</option>
        </select>
        <select value={statusF} onChange={(e) => setStatusF(e.target.value)} className="bg-surface-2 border border-white/10 rounded p-1 text-xs" data-testid="case-packet-status">
          <option value="">status: any</option>
          <option value="failed">failed</option>
          <option value="success">success</option>
        </select>
        <select value={protoF} onChange={(e) => setProtoF(e.target.value)} className="bg-surface-2 border border-white/10 rounded p-1 text-xs" data-testid="case-packet-proto">
          <option value="">protocol: any</option>
          <option value="archive">archive</option>
          <option value="http">http</option>
          <option value="sms">sms</option>
        </select>
      </div>
      <div className="mt-3 space-y-1 max-h-[200px] overflow-y-auto">
        {filtered.map((p) => (
          <div key={p.id} className="rounded-lg border border-white/10 bg-surface-2 p-2 text-[10px] font-mono flex items-center justify-between gap-2">
            <span>{p.src} · {p.proto} · {p.status}</span>
            {p.payload ? (
              <button onClick={() => decode(p)} className="type-mono text-[9px] text-lavender" data-testid={`case-packet-decode-${p.id}`}>decode</button>
            ) : (
              <span className="type-mono text-[8px] text-text-muted">empty</span>
            )}
          </div>
        ))}
      </div>
      {decoded && (
        <div className="mt-3 rounded-lg bg-surface-3 p-2 text-xs">
          <pre className="whitespace-pre-wrap font-mono text-lavender-soft">{decoded}</pre>
        </div>
      )}
      <div className="mt-3">
        <p className="type-mono text-[9px] text-warning-gold">{puzzle.firewall_prompt}</p>
        <input value={pwd} onChange={(e) => setPwd(e.target.value)} className="mt-1 w-full bg-surface-2 border border-white/10 rounded-lg px-3 py-2 text-sm" data-testid="case-packet-pwd" />
        <div className="mt-2"><MagneticButton variant="primary" size="sm" onClick={submitPwd} data-testid="case-packet-submit">submit firewall</MagneticButton></div>
      </div>
      <HintTray puzzle={puzzle} onHint={onHint} hintsUsed={hintsUsed} />
    </div>
  );
}

function StegPuzzle({ puzzle, onSolve, onHint, hintsUsed }) {
  const [applied, setApplied] = useState([]);
  function submit() {
    if (applied.join(",") === puzzle.steps.join(",")) onSolve();
    else alert("Still nothing hidden.");
  }
  return (
    <div>
      <p className="text-sm text-text-secondary">{puzzle.prompt}</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {["red", "green", "blue", "invert", "edge", "contrast", "reset"].map((op) => (
          <button key={op} onClick={() => op === "reset" ? setApplied([]) : setApplied((p) => [...p, op])} className={`rounded-lg border p-2 text-xs ${applied.includes(op) ? "border-lavender bg-lavender/5" : "border-white/10"}`} data-testid={`case-steg-${op}`}>
            {op}
          </button>
        ))}
      </div>
      <p className="mt-2 type-mono text-[9px] text-text-muted">applied: {applied.join(" → ") || "none"}</p>
      <div className="mt-3"><MagneticButton variant="primary" size="sm" onClick={submit} data-testid="case-steg-submit">read</MagneticButton></div>
      <HintTray puzzle={puzzle} onHint={onHint} hintsUsed={hintsUsed} />
    </div>
  );
}

function CabinetsPuzzle({ puzzle, onSolve, onHint, hintsUsed }) {
  const [vals, setVals] = useState({});
  const [errors, setErrors] = useState({});
  function submitOne(k, target) {
    const raw = vals[k] || "";
    const ok = target === "humtohaisehihai" ? normaliseCaseAnswer(raw) === target : normaliseDateAnswer(raw, target);
    if (ok) {
      setErrors((p) => ({ ...p, [k]: "ok" }));
      const solvedCount = Object.entries(vals).filter(([kk, v]) => {
        const t = puzzle.cabinets.find((c) => c.key === kk)?.answer_target;
        if (!t) return false;
        return t === "humtohaisehihai" ? normaliseCaseAnswer(v) === t : normaliseDateAnswer(v, t);
      }).length + (errors[k] === "ok" ? 0 : 1);
      if (solvedCount >= puzzle.cabinets.length) onSolve();
    } else {
      setErrors((p) => ({ ...p, [k]: "err" }));
    }
  }
  const allOk = puzzle.cabinets.every((c) => {
    const raw = vals[c.key] || "";
    return c.answer_target === "humtohaisehihai" ? normaliseCaseAnswer(raw) === c.answer_target : normaliseDateAnswer(raw, c.answer_target);
  });
  useEffect(() => { if (allOk) onSolve(); }, [allOk, onSolve]);
  return (
    <div>
      <p className="text-sm text-text-secondary">Solve each cabinet. All four must be correct to open the room.</p>
      <div className="mt-3 space-y-3">
        {puzzle.cabinets.map((c) => (
          <div key={c.key} className="rounded-lg border border-white/10 p-3">
            <span className="type-mono text-[9px] text-lavender">CABINET {c.key}</span>
            <p className="mt-1 text-xs">{c.prompt}</p>
            <div className="mt-2 flex gap-2">
              <input value={vals[c.key] || ""} onChange={(e) => setVals((p) => ({ ...p, [c.key]: e.target.value }))} className="flex-1 bg-surface-2 border border-white/10 rounded px-2 py-1 text-xs" data-testid={`case-cabinet-${c.key}`} />
              <button onClick={() => submitOne(c.key, c.answer_target)} className="type-mono text-[9px] text-lavender border border-white/10 rounded-full px-3" data-testid={`case-cabinet-submit-${c.key}`}>open</button>
            </div>
            {errors[c.key] === "ok" && <p className="mt-1 type-mono text-[9px] text-success-mint">opened</p>}
            {errors[c.key] === "err" && <p className="mt-1 type-mono text-[9px] text-danger-red">wrong</p>}
          </div>
        ))}
      </div>
      <HintTray puzzle={puzzle} onHint={onHint} hintsUsed={hintsUsed} />
    </div>
  );
}

function ContradictionsPuzzle({ puzzle, onSolve, onHint, hintsUsed }) {
  const [assign, setAssign] = useState({});
  function submit() {
    const ok = puzzle.cards.every((c) => assign[c.id] === c.correct);
    if (ok) onSolve();
    else alert("Some classifications are wrong.");
  }
  return (
    <div>
      <p className="text-sm text-text-secondary">Classify each piece of evidence.</p>
      <div className="mt-3 space-y-2 max-h-[280px] overflow-y-auto">
        {puzzle.cards.map((c) => (
          <div key={c.id} className="rounded-lg border border-white/10 p-2 flex items-center gap-2">
            <span className="text-xs flex-1">{c.label}</span>
            <select value={assign[c.id] || ""} onChange={(e) => setAssign((p) => ({ ...p, [c.id]: e.target.value }))} className="bg-surface-2 border border-white/10 rounded p-1 text-xs" data-testid={`case-contra-${c.id}`}>
              <option value="">—</option>
              {puzzle.classes.map((cls) => <option key={cls.key} value={cls.key}>{cls.label}</option>)}
            </select>
          </div>
        ))}
      </div>
      <div className="mt-3"><MagneticButton variant="primary" size="sm" onClick={submit} data-testid="case-contra-submit">submit conclusions</MagneticButton></div>
      <HintTray puzzle={puzzle} onHint={onHint} hintsUsed={hintsUsed} />
    </div>
  );
}

function IdentityPuzzle({ puzzle, onSolve }) {
  const [pick, setPick] = useState(null);
  return (
    <div>
      <p className="text-sm text-text-secondary">{puzzle.prompt}</p>
      <div className="mt-3 grid gap-2">
        {puzzle.choices.map((c) => (
          <button key={c.id} onClick={() => setPick(c.id)} className={`text-left rounded-lg border p-2 text-xs ${pick === c.id ? "border-lavender bg-lavender/5" : "border-white/10"}`} data-testid={`case-identity-${c.id}`}>
            {c.label}
          </button>
        ))}
      </div>
      <div className="mt-3"><MagneticButton variant="primary" size="sm" onClick={() => pick === puzzle.correct ? onSolve() : alert("Not the Archivist.")} data-testid="case-identity-submit">accuse</MagneticButton></div>
    </div>
  );
}

function TerminalPuzzle({ puzzle, onSolve, onHint, hintsUsed }) {
  const [input, setInput] = useState("");
  const [stage, setStage] = useState(0); // 0=freetext expected first, 1=ghost prompt visible, 2=solved
  const [log, setLog] = useState([]);
  function submit() {
    if (!input.trim()) return;
    if (stage === 0) {
      setLog((l) => [...l, `> ${input}`, puzzle.first_rejection, "", puzzle.ghost_prompt]);
      setStage(1);
      setInput("");
      return;
    }
    if (stage === 1) {
      if (normaliseCaseAnswer(input) === puzzle.answer_target) {
        setLog((l) => [...l, `> ${input}`, ...puzzle.final_response]);
        setStage(2);
        setTimeout(() => onSolve(), 900);
      } else {
        setLog((l) => [...l, `> ${input}`, "STILL LOGICAL. REJECTED."]);
      }
      setInput("");
    }
  }
  return (
    <div>
      <p className="text-sm text-text-secondary">{puzzle.prompt}</p>
      <div className="mt-3 rounded-lg bg-black border border-white/10 p-3 font-mono text-[10px] text-lavender-soft h-56 overflow-y-auto space-y-1" data-testid="case-terminal-output">
        {log.map((l, i) => <p key={i} className="whitespace-pre-wrap">{l}</p>)}
      </div>
      <div className="mt-2 flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} className="flex-1 bg-surface-2 border border-white/10 rounded px-2 py-1 text-xs font-mono" data-testid="case-terminal-input" />
        <MagneticButton variant="primary" size="sm" onClick={submit} data-testid="case-terminal-submit">enter</MagneticButton>
      </div>
      <HintTray puzzle={puzzle} onHint={onHint} hintsUsed={hintsUsed} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Ending
// ---------------------------------------------------------------------------
function CaseEnding({ score, elapsed, best, onReplay }) {
  return (
    <div className="rounded-2xl border border-lavender/30 bg-gradient-to-br from-archive-soft to-surface-1 p-8 md:p-12" data-testid="case-ending">
      <span className="type-mono text-[10px] text-lavender">CONTAINMENT OPEN</span>
      <h2 className="mt-3 font-editorial text-4xl md:text-5xl leading-tight">
        You found me.
      </h2>
      <div className="mt-6 space-y-3 max-w-2xl">
        <p className="font-editorial text-lg text-text-secondary">Hi, Detective.</p>
        <p className="font-editorial text-lg text-text-secondary">And no, Sarah did not kidnap me. Unfortunately, she remains innocent of this specific crime.</p>
        <p className="font-editorial text-lg text-text-secondary">
          The Archivist simply knew that a believable name is more dangerous than an unbelievable story.
        </p>
        <p className="font-editorial text-lg text-text-secondary">
          Everything you just solved was made because I know how much you love difficult mysteries. I wanted to build something that
          did not treat you like a child, did not give you easy answers and did not end in five minutes.
        </p>
        <p className="font-editorial text-lg text-lavender">CASE 1709: Closed.</p>
      </div>

      <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-lavender/40 bg-lavender/5 px-4 py-2">
        <span className="type-mono text-[9px] text-lavender">ACHIEVEMENT</span>
        <span className="font-editorial text-sm">MASTER DETECTIVE — AYESHA</span>
      </div>

      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl">
        <div className="border-t border-white/15 pt-3"><div className="type-mono text-[9px] text-text-muted">score</div><div className="font-editorial text-2xl">{score}</div></div>
        <div className="border-t border-white/15 pt-3"><div className="type-mono text-[9px] text-text-muted">time</div><div className="font-editorial text-2xl">{Math.floor(elapsed/60)}:{String(elapsed%60).padStart(2,"0")}</div></div>
        <div className="border-t border-white/15 pt-3"><div className="type-mono text-[9px] text-text-muted">best</div><div className="font-editorial text-2xl text-lavender">{best}</div></div>
      </div>

      <div className="mt-8 flex gap-3 flex-wrap">
        <MagneticButton variant="primary" size="md" onClick={onReplay} data-testid="case-replay">replay case</MagneticButton>
        <MagneticButton variant="ghost" size="md" to="/games" data-testid="case-back-games">back to games</MagneticButton>
      </div>
    </div>
  );
}
