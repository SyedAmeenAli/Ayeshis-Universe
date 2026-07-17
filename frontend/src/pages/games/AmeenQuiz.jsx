import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameShell, CompletionScreen } from "@/components/games/GameShell";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { fetchGameSave, completeGame, startGame } from "@/lib/gamesApi";
import { SkullBow } from "@/components/mascot/SkullBow";
import { useGameSave } from "@/hooks/useGameSave";
import {
  EXAM_INTRO,
  EXAM_ROUNDS,
  EXAM_QUESTION_COUNT,
  EXAM_MAX_POINTS,
  ratingFor,
  PERFECT_SCORE_LINES,
  PERFECT_VOICE_LINE,
} from "@/data/ameenExam";

// Flatten rounds into one ordered list, each question tagged with its round.
const FLAT_QUESTIONS = EXAM_ROUNDS.flatMap((round) =>
  round.questions.map((q) => ({ ...q, roundKey: round.key, roundLabel: round.label, timerSeconds: round.timerSeconds || 0 }))
);

export default function AmeenQuiz() {
  const [status, setStatus] = useState("intro"); // intro | playing | finished
  const [scaredNote, setScaredNote] = useState(false);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState([]); // {id, chosenId, correct, points}
  const [reaction, setReaction] = useState(null); // {ok, text}
  const [timeLeft, setTimeLeft] = useState(0);
  const [hintUsedFor, setHintUsedFor] = useState(new Set());
  const [best, setBest] = useState(0);
  const [saving, setSaving] = useState(false);
  const audioRef = useRef(null);

  const q = FLAT_QUESTIONS[idx];
  const points = answers.reduce((s, a) => s + a.points, 0);

  useEffect(() => {
    fetchGameSave("ameen-quiz")
      .then((save) => setBest(save?.best_score || 0))
      .catch(() => {});
  }, []);

  // Timer only runs on rounds that define one (the final boss round)
  useEffect(() => {
    if (status !== "playing" || !q || !q.timerSeconds || reaction) return;
    const iv = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(iv);
          submitAnswer(null);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, idx, reaction]);

  function begin(buttonId) {
    if (buttonId === "scared") setScaredNote(true);
    setStatus("playing");
    setIdx(0);
    setAnswers([]);
    setReaction(null);
    setTimeLeft(FLAT_QUESTIONS[0]?.timerSeconds || 0);
    startGame("ameen-quiz").catch(() => {});
  }

  function useHint() {
    if (!q) return;
    setHintUsedFor((prev) => new Set(prev).add(q.id));
  }

  function submitAnswer(chosenId) {
    if (reaction || !q) return;
    const correct = chosenId === q.correct;
    const gained = correct ? q.points || 1 : 0;
    const text = correct
      ? q.reactionCorrect
      : (chosenId && q.perOptionWrong?.[chosenId]) || q.reactionWrong;
    setAnswers((prev) => [...prev, { id: q.id, chosenId, correct, points: gained }]);
    setReaction({ ok: correct, text });
    setTimeout(() => {
      setReaction(null);
      if (idx + 1 >= FLAT_QUESTIONS.length) {
        onFinish();
      } else {
        setIdx((i) => i + 1);
        setTimeLeft(FLAT_QUESTIONS[idx + 1]?.timerSeconds || 0);
      }
    }, 1400);
  }

  async function onFinish() {
    setStatus("finished");
    setSaving(true);
    const finalPoints = answers.reduce((s, a) => s + a.points, 0) + (FLAT_QUESTIONS[idx] ? 0 : 0);
    try {
      const res = await completeGame("ameen-quiz", {
        state: { answers },
        score: finalPoints,
        elapsed_seconds: 0,
        metadata: { max_points: EXAM_MAX_POINTS },
      });
      setBest(res.best_score || finalPoints);
    } catch (e) {}
    setSaving(false);
    if (finalPoints >= EXAM_MAX_POINTS) {
      setTimeout(() => audioRef.current?.play().catch(() => {}), 400);
    }
  }

  // Keyboard 1-4 during play
  useEffect(() => {
    if (status !== "playing") return;
    const onKey = (e) => {
      const map = { "1": "a", "2": "b", "3": "c", "4": "d" };
      if (map[e.key] && q) submitAnswer(map[e.key]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, idx, reaction]);

  const finalPoints = answers.reduce((s, a) => s + a.points, 0);
  const rating = useMemo(() => ratingFor(finalPoints, EXAM_MAX_POINTS), [finalPoints]);
  const isPerfect = status === "finished" && finalPoints >= EXAM_MAX_POINTS;

  return (
    <GameShell
      gameKey="ameen-quiz"
      title="Confidential Boyfriend Assessment"
      subtitle="This examination measures your knowledge of Ameen."
      onRestart={() => { setStatus("intro"); setAnswers([]); setIdx(0); }}
      instructions={[
        "One question at a time. Four answer cards each.",
        "Keyboard: press 1–4 to answer.",
        "The Final Boss Round is timed — 12 seconds per question.",
        "One hint per question, eliminating one wrong option.",
      ]}
      score={finalPoints}
      bestScore={best}
      savingLabel={saving ? "Saving…" : undefined}
    >
      {status === "intro" && (
        <div className="max-w-xl mx-auto text-center py-8" data-testid="exam-intro">
          <span className="type-mono text-[10px] text-lavender/80">{EXAM_INTRO.title}</span>
          <p className="mt-4 text-text-secondary">{EXAM_INTRO.body}</p>
          <p className="mt-2 text-xs text-warning-gold">{EXAM_INTRO.warning}</p>

          {scaredNote && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 font-hand text-xl text-lavender-soft"
              data-testid="exam-scared-note"
            >
              {EXAM_INTRO.scaredResponse}
            </motion.p>
          )}

          <div className="mt-8 flex flex-col items-center gap-3">
            {EXAM_INTRO.buttons.map((b) => (
              <MagneticButton
                key={b.id}
                onClick={() => begin(b.id)}
                variant={b.id === "begin" ? "primary" : "ghost"}
                size="md"
                data-testid={`exam-start-${b.id}`}
              >
                {b.label}
              </MagneticButton>
            ))}
          </div>
        </div>
      )}

      {status === "playing" && q && (
        <div className="grid md:grid-cols-12 gap-6" data-testid="exam-play">
          <div className="md:col-span-4 rounded-2xl border border-white/10 bg-surface-1 p-6 flex flex-col items-start gap-4">
            <SkullBow size={80} mood={reaction?.ok ? "mischief" : reaction ? "sleepy" : "alert"} />
            <AnimatePresence>
              {reaction && (
                <motion.p
                  key={reaction.text}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`font-hand text-2xl ${reaction.ok ? "text-lavender-soft" : "text-danger-red"}`}
                  data-testid="exam-reaction"
                >
                  {reaction.text}
                </motion.p>
              )}
            </AnimatePresence>

            {q.timerSeconds > 0 && (
              <div className="w-full">
                <span className="type-mono text-[9px] text-text-muted">time left</span>
                <div className="h-1 bg-white/8 relative mt-1 rounded-full overflow-hidden">
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-danger-red"
                    style={{ width: `${(timeLeft / q.timerSeconds) * 100}%` }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
                <p className="type-mono text-[9px] text-text-muted mt-1">{timeLeft}s</p>
              </div>
            )}

            <div className="w-full">
              <div className="h-1 bg-white/8 rounded-full overflow-hidden">
                <div className="h-full bg-lavender" style={{ width: `${((idx + 1) / FLAT_QUESTIONS.length) * 100}%` }} />
              </div>
              <p className="type-mono text-[9px] text-text-muted mt-1">
                question {idx + 1} / {FLAT_QUESTIONS.length}
              </p>
            </div>

            <button
              onClick={useHint}
              disabled={hintUsedFor.has(q.id)}
              className="type-mono text-[9px] border border-white/10 rounded-full px-3 py-1 text-lavender disabled:opacity-30"
              data-testid="exam-hint"
            >
              hint · eliminate one wrong option
            </button>
          </div>

          <div className="md:col-span-8">
            <div className="rounded-2xl border border-white/10 bg-surface-1 p-6 md:p-8">
              <span className="type-mono text-[9px] text-lavender/70">{q.roundLabel}</span>
              <h2 className="mt-2 font-editorial text-2xl md:text-3xl leading-tight" data-testid="exam-question">
                {q.prompt}
              </h2>
              <div className="mt-6 grid gap-3">
                {q.options.map((a, i) => {
                  const eliminated = hintUsedFor.has(q.id) && a.id !== q.correct && i === (q.options.findIndex((o) => o.id !== q.correct));
                  return (
                    <button
                      key={a.id}
                      onClick={() => submitAnswer(a.id)}
                      data-testid={`exam-answer-${a.id}`}
                      disabled={!!reaction || eliminated}
                      className={`text-left rounded-xl border p-4 hover:border-lavender/50 transition-colors flex items-center gap-3 ${
                        reaction && a.id === q.correct ? "border-lavender bg-lavender/8" : "border-white/10"
                      } ${eliminated ? "opacity-30 line-through" : ""}`}
                    >
                      <span className="w-8 h-8 rounded-full border border-white/12 flex items-center justify-center type-mono text-[10px] text-lavender">
                        {i + 1}
                      </span>
                      <span className="text-base">{a.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {status === "finished" && (
        <div className="flex flex-col gap-6" data-testid="exam-finished">
          {isPerfect ? (
            <div className="rounded-2xl border border-lavender/40 bg-gradient-to-br from-archive-soft to-surface-1 p-10 text-center" data-testid="exam-perfect">
              <span className="type-mono text-[10px] text-lavender">AMEEN EXPERT — 100%</span>
              <div className="mt-6 space-y-2">
                {PERFECT_SCORE_LINES.map((line) => (
                  <p key={line} className="font-editorial text-xl text-text-secondary">{line}</p>
                ))}
              </div>
              <p className="mt-6 font-hand text-2xl text-lavender-soft">"{PERFECT_VOICE_LINE}"</p>
              <audio ref={audioRef} src="/assets/real/ameen-perfect-score-voice.mp3" preload="none" />
              <p className="mt-2 type-mono text-[9px] text-text-muted">
                Voice plays if a recording exists at frontend/public/assets/real/ameen-perfect-score-voice.mp3
              </p>
            </div>
          ) : (
            <CompletionScreen
              title={rating.label}
              subtitle={rating.note}
              achievement={rating.tier === "top" ? "SHE KNOWS TOO MUCH" : null}
              stats={[
                { label: "points", value: `${finalPoints}/${EXAM_MAX_POINTS}` },
                { label: "percent", value: `${Math.round((finalPoints / EXAM_MAX_POINTS) * 100)}%` },
                { label: "best", value: best },
              ]}
              onReplay={() => { setStatus("intro"); }}
              onExit={() => (window.location.href = "/games")}
            />
          )}

          <div className="rounded-2xl border border-white/10 bg-surface-1 p-6">
            <h3 className="font-editorial text-2xl mb-4">Answer review</h3>
            <div className="grid gap-3">
              {FLAT_QUESTIONS.map((qq, i) => {
                const a = answers[i];
                return (
                  <div key={qq.id} className={`rounded-xl border p-4 ${a?.correct ? "border-success-mint/40" : "border-danger-red/40"}`}>
                    <p className="text-sm font-editorial">{qq.prompt}</p>
                    <p className="type-mono text-[9px] mt-2 text-text-muted">
                      you: {a ? qq.options.find((x) => x.id === a.chosenId)?.label || "no answer" : "no answer"} · correct:{" "}
                      {qq.options.find((x) => x.id === qq.correct)?.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </GameShell>
  );
}
