import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Lock } from "lucide-react";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  studioLogin,
  studioLogout,
  fetchStudioMe,
  fetchStudioDashboard,
  fetchFeatureFlagsPublic,
  updateFeatureFlags,
  fetchStudioQuiz,
  updateStudioQuizQuestion,
} from "@/lib/studioApi";
import { fetchCalendarSlots } from "@/lib/calendarApi";
import { studioApi } from "@/lib/studioApi";
import { STATUS_LABELS } from "@/data/calendar";
import { REAL_PHOTOS } from "@/lib/realAssets";

const TABS = ["dashboard", "calendar", "quiz", "media", "flags"];

export default function Studio() {
  const [authed, setAuthed] = useState(null);

  useEffect(() => {
    fetchStudioMe()
      .then(() => setAuthed(true))
      .catch(() => setAuthed(false));
  }, []);

  if (authed === null) return <div className="min-h-screen w-full bg-archive" />;

  return (
    <div className="min-h-screen w-full bg-archive text-text-primary">
      {!authed ? <StudioLogin onAuthed={() => setAuthed(true)} /> : <StudioPanel onLogout={() => setAuthed(false)} />}
    </div>
  );
}

function StudioLogin({ onAuthed }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await studioLogin(pin.trim());
      onAuthed();
    } catch {
      setError("Wrong PIN.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6" data-testid="studio-login">
      <Lock className="w-8 h-8 text-lavender mb-6" />
      <h1 className="font-editorial text-4xl">Studio</h1>
      <p className="mt-2 text-text-secondary text-sm">Ameen only. Separate from Ayesha's gateway.</p>
      <form onSubmit={submit} className="mt-8 flex flex-col items-center gap-3">
        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className="w-56 text-center type-mono bg-surface-1 border border-white/12 rounded-xl px-4 py-3 outline-none focus:border-lavender/50"
          placeholder="Studio PIN"
          data-testid="studio-pin-input"
          autoFocus
        />
        {error && <p className="text-xs text-danger-red">{error}</p>}
        <MagneticButton type="submit" disabled={submitting} variant="primary" size="md" data-testid="studio-pin-submit">
          {submitting ? "checking…" : "enter studio"}
        </MagneticButton>
      </form>
    </div>
  );
}

function StudioPanel({ onLogout }) {
  const [tab, setTab] = useState("dashboard");

  async function logout() {
    await studioLogout();
    onLogout();
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <span className="type-mono text-[10px] text-text-muted">STUDIO / AMEEN ONLY</span>
          <h1 className="mt-2 font-editorial text-4xl">Backstage</h1>
        </div>
        <button onClick={logout} className="type-mono text-[9px] text-text-muted border border-white/12 rounded-full px-4 py-2" data-testid="studio-logout">
          logout
        </button>
      </div>

      <div className="flex gap-2 mb-8 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full border px-4 py-2 text-xs capitalize ${
              tab === t ? "border-lavender text-lavender bg-lavender/10" : "border-white/12 text-text-secondary"
            }`}
            data-testid={`studio-tab-${t}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "dashboard" && <DashboardTab />}
      {tab === "calendar" && <CalendarTab />}
      {tab === "quiz" && <QuizTab />}
      {tab === "media" && <MediaTab />}
      {tab === "flags" && <FlagsTab />}
    </div>
  );
}

function DashboardTab() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchStudioDashboard().then(setStats).catch(() => {});
  }, []);

  if (!stats) return <p className="text-xs text-text-muted">Loading…</p>;

  const cards = [
    ["Memories", stats.memories_count],
    ["Upcoming bookings", stats.upcoming_bookings],
    ["Diary entries", stats.diary_entries],
    ["Achievements unlocked", stats.achievements_unlocked],
    ["Real photos configured", stats.real_photos_configured],
  ];

  return (
    <div data-testid="studio-dashboard">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-surface-1 p-5">
            <span className="type-mono text-[9px] text-text-muted">{label}</span>
            <p className="mt-2 font-editorial text-3xl text-lavender">{value}</p>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-white/10 bg-surface-1 p-5">
        <span className="type-mono text-[9px] text-text-muted">FINAL REVEAL</span>
        <p className="mt-2 text-sm">
          Hidden scroll found: {stats.hidden_scroll_found ? "yes" : "not yet"} · Unlocked:{" "}
          {stats.final_reveal_unlocked ? "yes" : "not yet"} · Viewed: {stats.final_reveal_viewed ? "yes" : "not yet"}
        </p>
      </div>
    </div>
  );
}

function CalendarTab() {
  const [slots, setSlots] = useState([]);

  useEffect(() => {
    refresh();
  }, []);

  function refresh() {
    fetchCalendarSlots().then(setSlots);
  }

  async function setStatus(slotId, status) {
    await studioApi.put(`/calendar/slots/${slotId}`, { status });
    refresh();
  }

  return (
    <div className="grid gap-3" data-testid="studio-calendar">
      {slots.map((slot) => (
        <div key={slot.id} className="rounded-xl border border-white/10 bg-surface-1 p-4 flex items-center justify-between gap-4">
          <div>
            <span className="type-mono text-[10px] text-text-muted">{slot.date} · {slot.time_label}</span>
            <p className="text-xs mt-1">{STATUS_LABELS[slot.status]}{slot.booking ? ` — booked (${slot.booking.activity})` : ""}</p>
          </div>
          <div className="flex gap-1.5">
            {["available", "maybe", "busy", "surprise"].map((s) => (
              <button
                key={s}
                onClick={() => setStatus(slot.id, s)}
                className={`type-mono text-[9px] rounded-full border px-2.5 py-1 ${slot.status === s ? "border-lavender text-lavender" : "border-white/12 text-text-muted"}`}
                data-testid={`studio-slot-${slot.id}-${s}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function QuizTab() {
  const [questions, setQuestions] = useState([]);
  const [savingKey, setSavingKey] = useState(null);

  useEffect(() => {
    fetchStudioQuiz().then(setQuestions);
  }, []);

  async function save(q, patch) {
    setSavingKey(q.question_key);
    try {
      const updated = await updateStudioQuizQuestion(q.question_key, patch);
      setQuestions((prev) => prev.map((x) => (x.question_key === q.question_key ? updated : x)));
      toast("Question updated.");
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <div className="flex flex-col gap-3" data-testid="studio-quiz">
      {questions.map((q) => (
        <div key={q.question_key} className="rounded-xl border border-white/10 bg-surface-1 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="type-mono text-[9px] text-text-muted">{q.question_key}</span>
            <label className="flex items-center gap-2 text-xs">
              <Switch checked={q.enabled} onCheckedChange={(v) => save(q, { enabled: v })} />
              enabled
            </label>
          </div>
          <Textarea
            defaultValue={q.question}
            rows={2}
            onBlur={(e) => e.target.value !== q.question && save(q, { question: e.target.value })}
            data-testid={`studio-quiz-question-${q.question_key}`}
          />
          {savingKey === q.question_key && <span className="type-mono text-[9px] text-lavender">saving…</span>}
        </div>
      ))}
    </div>
  );
}

function MediaTab() {
  return (
    <div data-testid="studio-media">
      <p className="text-sm text-text-secondary mb-4">
        {REAL_PHOTOS.length} real photos live in <code className="type-mono">frontend/public/assets/real/</code>.
        Every <code className="type-mono">AssetPlaceholder</code> across the app auto-fills from this pool by
        hashing its asset id — drop more files in that folder using the same{" "}
        <code className="type-mono">photo-NN.jpeg</code> naming and bump the count in{" "}
        <code className="type-mono">lib/realAssets.js</code> to add more.
      </p>
      <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
        {REAL_PHOTOS.slice(0, 16).map((src) => (
          <div key={src} className="aspect-square rounded-lg overflow-hidden bg-surface-2">
            <img src={src} alt="" className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
}

function FlagsTab() {
  const [flags, setFlags] = useState(null);

  useEffect(() => {
    fetchFeatureFlagsPublic().then(setFlags);
  }, []);

  async function toggle(key) {
    const updated = await updateFeatureFlags({ [key]: !flags[key] });
    setFlags(updated);
  }

  if (!flags) return <p className="text-xs text-text-muted">Loading…</p>;

  return (
    <div className="flex flex-col gap-3" data-testid="studio-flags">
      {Object.entries(flags).map(([key, value]) => (
        <label key={key} className="flex items-center justify-between rounded-xl border border-white/10 bg-surface-1 p-4">
          <span className="type-mono text-xs">{key}</span>
          <Switch checked={value} onCheckedChange={() => toggle(key)} data-testid={`studio-flag-${key}`} />
        </label>
      ))}
    </div>
  );
}
