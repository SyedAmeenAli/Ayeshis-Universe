import React, { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameShell, CompletionScreen } from "@/components/games/GameShell";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { fetchQuizQuestions, fetchGameSave, completeGame, startGame } from "@/lib/gamesApi";
import { SkullBow } from "@/components/mascot/SkullBow";
import { useGameSave } from "@/hooks/useGameSave";

const MODES = {
  cute: { key: "cute", label: "Cute Mode", count: 8, timer: 0 },
  certified: { key: "certified", label: "Certified Girlfriend", count: 10, timer: 20 },
  too_much: { key: "too_much", label: "She Knows Too Much", count: 10, timer: 12 },
};

export default function AmeenQuiz() {
  const [status, setStatus] = useState("choose"); // choose | playing | reviewing
  const [mode, setMode] = useState("cute");
  const [questions, setQuestions] = useState([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState([]); // {questionKey, chosenId, correct, timeMs}
  const [reaction, setReaction] = useState(null); // {ok, text}
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [saving, setSaving] = useState(false);
  const [questionStart, setQuestionStart] = useState(0);

  const cfg = MODES[mode];

  useEffect(() => {
    (async () => {
      try {
        const [save, qs] = await Promise.all([fetchGameSave("ameen-quiz"), fetchQuizQuestions()]);
        setBest(save?.best_score || 0);
        // We don't restore mid-quiz to keep it fair
        setQuestions(qs);
      } catch (e) {}
    })();
  }, []);

  // Timer
  useEffect(() => {
    if (status !== "playing" || cfg.timer === 0) return;
    if (reaction) return; // paused during reaction
    const iv = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(iv);
          answer(null); // time out
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, idx, reaction, mode]);

  function startNew(modeKey) {
    const m = MODES[modeKey];
    setMode(modeKey);
    const shuffled = [...questions].sort(() => Math.random() - 0.5).slice(0, m.count);
    setQuestions((prev) => prev); // keep all; use shuffled below
    const q = shuffled;
    setIdx(0);
    setAnswers([]);
    setScore(0);
    setStreak(0);
    setLongestStreak(0);
    setTimeLeft(m.timer);
    setStatus("playing");
    setReaction(null);
    setQuestionStart(Date.now());
    startGame("ameen-quiz").catch(() => {});
    // Store the selected set as questions for this run
    setTimeout(() => setQuestions(q), 0);
  }

  function answer(chosenId) {
    if (reaction) return;
    const q = questions[idx];
    if (!q) return;
    const correct = chosenId === q.correct_answer_id;
    const timeMs = Date.now() - questionStart;
    const base = correct ? 100 : 0;
    const timeBonus = correct && cfg.timer ? Math.max(0, Math.round(50 * (timeLeft / cfg.timer))) : 0;
    const streakBonus = correct ? Math.min(50, streak * 10) : 0;
    const gained = base + timeBonus + streakBonus;
    setScore((s) => s + gained);
    setAnswers((prev) => [...prev, { questionKey: q.question_key, chosenId, correct, timeMs, gained }]);
    if (correct) {
      const next = streak + 1;
      setStreak(next);
      setLongestStreak((l) => Math.max(l, next));
      setReaction({ ok: true, text: q.reaction_correct });
    } else {
      setStreak(0);
      setReaction({ ok: false, text: q.reaction_wrong });
    }
    setTimeout(() => {
      setReaction(null);
      if (idx + 1 >= questions.length) {
        onFinish();
      } else {
        setIdx(idx + 1);
        setTimeLeft(cfg.timer);
        setQuestionStart(Date.now());
      }
    }, 1400);
  }

  async function onFinish() {
    setStatus("reviewing");
    setSaving(true);
    const total = questions.length;
    const correctCount = answers.filter((a) => a.correct).length + (0); // reaction path already updated
    try {
      const res = await completeGame("ameen-quiz", {
        state: { mode, answers, questions: questions.map((q) => q.question_key) },
        score,
        elapsed_seconds: Math.round(answers.reduce((s, a) => s + a.timeMs / 1000, 0)),
        metadata: { mode, longest_streak: longestStreak, total },
      });
      setBest(res.best_score || score);
    } catch (e) {}
    setSaving(false);
  }

  // Keyboard 1-4
  useEffect(() => {
    if (status !== "playing") return;
    const onKey = (e) => {
      const map = { "1": "a", "2": "b", "3": "c", "4": "d" };
      if (map[e.key]) {
        const q = questions[idx];
        const ans = q?.answers?.find((a) => a.id === map[e.key]);
        if (ans) answer(ans.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, idx, reaction, questions]);

  const q = questions[idx];
  const totalCorrect = answers.filter((a) => a.correct).length;
  const percent = questions.length ? Math.round((totalCorrect / questions.length) * 100) : 0;

  return (
    <GameShell
      gameKey="ameen-quiz"
      title="How Well Do You Know Baby Boy?"
      subtitle="Cute, questionable, competitive."
      onRestart={() => { setStatus("choose"); setAnswers([]); setScore(0); }}
      instructions={[
        "One question at a time.",
        "Keyboard: press 1–4 to answer.",
        "Cute mode has no timer. Certified is 20s, She Knows Too Much is 12s.",
        "Streaks and speed give bonus points.",
      ]}
      score={score}
      bestScore={best}
      savingLabel={saving ? "Saving…" : undefined}
    >
      {status === "choose" && (
        <div className="grid md:grid-cols-3 gap-4" data-testid="quiz-choose">
          {Object.values(MODES).map((m) => (
            <button
              key={m.key}
              onClick={() => startNew(m.key)}
              data-testid={`quiz-mode-${m.key}`}
              className="text-left rounded-2xl border border-white/10 bg-surface-1 p-6 hover:border-lavender/40 min-h-[160px] flex flex-col justify-between"
            >
              <span className="type-mono text-[9px] text-lavender/80">{m.count} questions · {m.timer ? `${m.timer}s each` : "no timer"}</span>
              <h3 className="font-editorial text-2xl">{m.label}</h3>
            </button>
          ))}
        </div>
      )}

      {status === "playing" && q && (
        <div className="grid md:grid-cols-12 gap-6" data-testid="quiz-play">
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
                  data-testid="quiz-reaction"
                >
                  {reaction.text}
                </motion.p>
              )}
            </AnimatePresence>
            {cfg.timer > 0 && (
              <div className="w-full">
                <span className="type-mono text-[9px] text-text-muted">time left</span>
                <div className="h-1 bg-white/8 relative mt-1 rounded-full overflow-hidden">
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-lavender"
                    style={{ width: `${(timeLeft / cfg.timer) * 100}%` }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
                <p className="type-mono text-[9px] text-text-muted mt-1">{timeLeft}s</p>
              </div>
            )}
            <div className="type-mono text-[9px] text-text-muted">
              question {idx + 1} / {questions.length} · streak {streak}
            </div>
          </div>

          <div className="md:col-span-8">
            <div className="rounded-2xl border border-white/10 bg-surface-1 p-6 md:p-8">
              <h2 className="font-editorial text-2xl md:text-3xl leading-tight" data-testid="quiz-question">
                {q.question}
              </h2>
              <div className="mt-6 grid gap-3">
                {q.answers.map((a, i) => (
                  <button
                    key={a.id}
                    onClick={() => answer(a.id)}
                    data-testid={`quiz-answer-${a.id}`}
                    disabled={!!reaction}
                    className={`text-left rounded-xl border p-4 hover:border-lavender/50 transition-colors flex items-center gap-3 ${reaction && a.id === q.correct_answer_id ? "border-lavender bg-lavender/8" : "border-white/10"}`}
                  >
                    <span className="w-8 h-8 rounded-full border border-white/12 flex items-center justify-center type-mono text-[10px] text-lavender">{i + 1}</span>
                    <span className="text-base">{a.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {status === "reviewing" && (
        <div className="flex flex-col gap-6" data-testid="quiz-review">
          <CompletionScreen
            title={rating(percent)}
            subtitle={`${totalCorrect} of ${questions.length} correct · ${percent}%`}
            achievement={percent >= 100 ? "SHE KNOWS TOO MUCH" : percent >= 90 ? "CERTIFIED AYESHI" : null}
            stats={[
              { label: "score", value: score },
              { label: "percent", value: `${percent}%` },
              { label: "longest streak", value: longestStreak },
              { label: "best score", value: best },
            ]}
            onReplay={() => { setStatus("choose"); }}
            onExit={() => (window.location.href = "/games")}
          />

          <div className="rounded-2xl border border-white/10 bg-surface-1 p-6">
            <h3 className="font-editorial text-2xl mb-4">Answer review</h3>
            <div className="grid gap-3">
              {questions.map((qq, i) => {
                const a = answers[i];
                const correct = a?.correct;
                return (
                  <div key={qq.question_key} className={`rounded-xl border p-4 ${correct ? "border-success-mint/40" : "border-danger-red/40"}`}>
                    <p className="text-sm font-editorial">{qq.question}</p>
                    <p className="type-mono text-[9px] mt-2 text-text-muted">
                      you: {a ? qq.answers.find((x) => x.id === a.chosenId)?.label || "no answer" : "no answer"} · correct: {qq.answers.find((x) => x.id === qq.correct_answer_id)?.label}
                    </p>
                    <p className="text-xs italic text-text-secondary mt-1">{qq.explanation}</p>
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

function rating(p) {
  if (p >= 91) return "She knows too much. Delete the archive.";
  if (p >= 71) return "Certified Ayeshi.";
  if (p >= 41) return "Girlfriend trial version.";
  return "Suspicious stranger.";
}
