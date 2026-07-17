import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Lock, Search, Trash2, Pencil, Share2 } from "lucide-react";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { MOOD_OPTIONS, COMFORT_MESSAGES } from "@/data/safeSpace";
import {
  fetchDiaryStatus,
  unlockDiary,
  fetchDiaryEntries,
  createDiaryEntry,
  updateDiaryEntry,
  deleteDiaryEntry,
} from "@/lib/diaryApi";

const MOOD_LABEL = Object.fromEntries(MOOD_OPTIONS.map((m) => [m.id, m.label]));

export default function SafeSpace() {
  const [unlocked, setUnlocked] = useState(null); // null = loading

  useEffect(() => {
    fetchDiaryStatus()
      .then((s) => setUnlocked(!!s.unlocked))
      .catch(() => setUnlocked(false));
  }, []);

  if (unlocked === null) {
    return <div className="min-h-screen w-full" />;
  }

  return (
    <div className="min-h-screen w-full pt-24 md:pt-28 pb-24 px-5 md:px-10 max-w-3xl mx-auto">
      {!unlocked ? <PinGate onUnlocked={() => setUnlocked(true)} /> : <DiaryHome />}
    </div>
  );
}

function PinGate({ onUnlocked }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!pin.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await unlockDiary(pin.trim());
      if (res.unlocked) {
        onUnlocked();
      } else {
        setError("That's not it.");
      }
    } catch {
      setError("That's not it.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="min-h-[70vh] flex flex-col items-center justify-center text-center"
      data-testid="safe-space-pin-gate"
    >
      <Lock className="w-8 h-8 text-lavender mb-6" />
      <h1 className="font-editorial text-4xl md:text-5xl">Safe Space</h1>
      <p className="mt-3 text-text-secondary max-w-sm">
        This room has its own lock, separate from the archive. Enter the PIN to continue.
      </p>
      <form onSubmit={submit} className="mt-8 flex flex-col items-center gap-3">
        <input
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className="w-40 text-center type-mono text-lg bg-surface-1 border border-white/12 rounded-xl px-4 py-3 tracking-[0.3em] outline-none focus:border-lavender/50"
          placeholder="••••"
          data-testid="safe-space-pin-input"
          autoFocus
        />
        {error && <p className="text-xs text-danger-red">{error}</p>}
        <MagneticButton type="submit" disabled={submitting} variant="primary" size="md" data-testid="safe-space-pin-submit">
          {submitting ? "checking…" : "unlock"}
        </MagneticButton>
      </form>
    </motion.div>
  );
}

function DiaryHome() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [mood, setMood] = useState(null);
  const [body, setBody] = useState("");
  const [wantsComfort, setWantsComfort] = useState(false);
  const [wantsNoAdvice, setWantsNoAdvice] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [shareTarget, setShareTarget] = useState(null);

  useEffect(() => {
    refresh();
  }, []);

  function refresh() {
    setLoading(true);
    fetchDiaryEntries()
      .then(setEntries)
      .finally(() => setLoading(false));
  }

  function resetComposer() {
    setMood(null);
    setBody("");
    setWantsComfort(false);
    setWantsNoAdvice(false);
    setEditingId(null);
  }

  async function onSave() {
    if (!mood || !body.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        await updateDiaryEntry(editingId, { body, mood, wants_comfort: wantsComfort, wants_no_advice: wantsNoAdvice });
        toast("Entry updated.");
      } else {
        await createDiaryEntry({ body, mood, wants_comfort: wantsComfort, wants_no_advice: wantsNoAdvice });
        toast("Entry saved.");
      }
      resetComposer();
      refresh();
    } catch {
      toast("Could not save — try again.");
    } finally {
      setSaving(false);
    }
  }

  function onEdit(entry) {
    setEditingId(entry.id);
    setMood(entry.mood);
    setBody(entry.body);
    setWantsComfort(entry.wants_comfort);
    setWantsNoAdvice(entry.wants_no_advice);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onDelete(id) {
    await deleteDiaryEntry(id);
    toast("Entry deleted.");
    refresh();
  }

  const filtered = entries.filter((e) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return e.body.toLowerCase().includes(q) || MOOD_LABEL[e.mood]?.toLowerCase().includes(q);
  });

  return (
    <div data-testid="safe-space-diary">
      <header className="mb-8">
        <span className="type-mono text-[10px] text-text-muted">PRIVATE · SEPARATE LOCK</span>
        <h1 className="mt-3 font-editorial text-5xl">What is your heart doing today?</h1>
        <p className="mt-3 text-xs text-text-muted max-w-lg">
          This is a personal journaling space, not therapy or emergency support. If you need
          real help, please reach a professional or someone you trust.
        </p>
      </header>

      {/* Composer */}
      <div className="rounded-2xl border border-white/10 bg-surface-1 p-5 md:p-6 mb-4">
        <div className="flex flex-wrap gap-2 mb-4">
          {MOOD_OPTIONS.map((m) => (
            <button
              key={m.id}
              onClick={() => setMood(m.id)}
              className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                mood === m.id ? "border-lavender text-lavender bg-lavender/10" : "border-white/12 text-text-secondary"
              }`}
              data-testid={`safe-space-mood-${m.id}`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write whatever this is."
          rows={5}
          data-testid="safe-space-body"
        />

        <div className="flex flex-wrap items-center gap-6 mt-4">
          <label className="flex items-center gap-2 text-xs text-text-secondary">
            <Switch checked={wantsNoAdvice} onCheckedChange={setWantsNoAdvice} data-testid="safe-space-no-advice" />
            I don't want advice
          </label>
          <label className="flex items-center gap-2 text-xs text-text-secondary">
            <Switch checked={wantsComfort} onCheckedChange={setWantsComfort} data-testid="safe-space-comfort" />
            Comfort me
          </label>
        </div>

        {wantsComfort && mood && (
          <p className="mt-4 font-hand text-xl text-lavender-soft">{COMFORT_MESSAGES[mood]}</p>
        )}

        <div className="mt-5 flex gap-3">
          <MagneticButton onClick={onSave} disabled={saving || !mood || !body.trim()} variant="primary" size="md" data-testid="safe-space-save">
            {saving ? "saving…" : editingId ? "update entry" : "save entry"}
          </MagneticButton>
          {editingId && (
            <MagneticButton onClick={resetComposer} variant="ghost" size="md">
              cancel edit
            </MagneticButton>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 mb-6 mt-10">
        <Search className="w-4 h-4 text-text-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search entries…"
          className="flex-1 bg-transparent border-b border-white/12 py-2 text-sm outline-none focus:border-lavender/40"
          data-testid="safe-space-search"
        />
      </div>

      {/* History */}
      {loading ? (
        <p className="text-xs text-text-muted">Loading entries…</p>
      ) : filtered.length === 0 ? (
        <p className="text-xs text-text-muted">No entries yet. Whatever you write stays here, private by default.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((entry) => (
            <div key={entry.id} className="rounded-2xl border border-white/10 bg-surface-1 p-4" data-testid={`safe-space-entry-${entry.id}`}>
              <div className="flex items-center justify-between gap-3">
                <span className="type-mono text-[9px] text-lavender/80">{MOOD_LABEL[entry.mood] || entry.mood}</span>
                <span className="type-mono text-[9px] text-text-muted">
                  {new Date(entry.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="mt-2 text-sm text-text-secondary whitespace-pre-wrap">{entry.body}</p>
              <div className="mt-3 flex gap-2">
                <button onClick={() => onEdit(entry)} className="p-1.5 rounded-full hover:bg-white/5" aria-label="Edit" data-testid={`safe-space-edit-${entry.id}`}>
                  <Pencil className="w-3.5 h-3.5 text-text-muted" />
                </button>
                <button onClick={() => onDelete(entry.id)} className="p-1.5 rounded-full hover:bg-white/5" aria-label="Delete" data-testid={`safe-space-delete-${entry.id}`}>
                  <Trash2 className="w-3.5 h-3.5 text-text-muted" />
                </button>
                <button onClick={() => setShareTarget(entry)} className="p-1.5 rounded-full hover:bg-white/5" aria-label="Share" data-testid={`safe-space-share-${entry.id}`}>
                  <Share2 className="w-3.5 h-3.5 text-text-muted" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ShareConfirm entry={shareTarget} onClose={() => setShareTarget(null)} onShared={refresh} />
    </div>
  );
}

function ShareConfirm({ entry, onClose, onShared }) {
  async function markShared() {
    if (entry) await updateDiaryEntry(entry.id, { shared: true });
    onShared();
  }

  function copyText() {
    if (!entry) return;
    navigator.clipboard?.writeText(entry.body);
    toast("Copied.");
    markShared();
    onClose();
  }

  function shareWhatsApp() {
    if (!entry) return;
    const url = `https://wa.me/?text=${encodeURIComponent(entry.body)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    markShared();
    onClose();
  }

  return (
    <AlertDialog open={!!entry} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent data-testid="safe-space-share-confirm">
        <AlertDialogHeader>
          <AlertDialogTitle>Share this entry?</AlertDialogTitle>
          <AlertDialogDescription>
            This entry is private until you choose otherwise. Are you sure?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={copyText} data-testid="safe-space-share-copy">
            Copy as text
          </AlertDialogAction>
          <AlertDialogAction onClick={shareWhatsApp} data-testid="safe-space-share-whatsapp">
            Share via WhatsApp
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
