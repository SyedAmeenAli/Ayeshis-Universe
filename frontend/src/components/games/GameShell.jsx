import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Pause, Play, RotateCcw, Volume2, VolumeX, HelpCircle, ArrowLeft } from "lucide-react";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { restartGame as apiRestart } from "@/lib/gamesApi";

/**
 * Shared game shell — header with pause / restart / exit / sound / instructions,
 * plus a floating "Saving…" indicator.
 */
export function GameShell({
  gameKey,
  title,
  subtitle,
  children,
  paused,
  onTogglePause,
  onRestart,
  instructions,
  soundEnabled,
  onToggleSound,
  savingLabel,
  score,
  bestScore,
  time,
  className = "",
}) {
  const navigate = useNavigate();
  const [showInstructions, setShowInstructions] = useState(false);
  const [showRestart, setShowRestart] = useState(false);

  async function confirmRestart() {
    try {
      await apiRestart(gameKey);
    } catch (e) {
      // still call onRestart to reset local state
    }
    setShowRestart(false);
    onRestart?.();
  }

  return (
    <div className={`min-h-screen w-full pt-20 pb-24 md:pb-8 px-4 md:px-8 ${className}`}>
      <div className="max-w-[1440px] mx-auto flex flex-col gap-4">
        {/* Header */}
        <header className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/games")}
              className="type-mono text-[10px] text-text-muted hover:text-lavender inline-flex items-center gap-1"
              data-testid="game-back"
            >
              <ArrowLeft className="w-3 h-3" /> games
            </button>
            <div>
              <h1 className="font-editorial text-2xl md:text-3xl leading-none">{title}</h1>
              {subtitle && <p className="type-mono text-[9px] text-text-muted mt-1">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {typeof score === "number" && (
              <div className="hidden md:flex flex-col items-end mr-3">
                <span className="type-mono text-[9px] text-text-muted">score</span>
                <span className="font-editorial text-lg leading-none">{score}</span>
              </div>
            )}
            {typeof bestScore === "number" && (
              <div className="hidden md:flex flex-col items-end mr-3">
                <span className="type-mono text-[9px] text-text-muted">best</span>
                <span className="font-editorial text-lg leading-none text-lavender">{bestScore}</span>
              </div>
            )}
            {typeof time === "number" && (
              <div className="hidden md:flex flex-col items-end mr-3">
                <span className="type-mono text-[9px] text-text-muted">time</span>
                <span className="font-editorial text-lg leading-none">{formatTime(time)}</span>
              </div>
            )}

            <IconButton onClick={() => setShowInstructions(true)} label="how to play" testid="game-instructions">
              <HelpCircle className="w-4 h-4" />
            </IconButton>
            {onToggleSound && (
              <IconButton onClick={onToggleSound} label={soundEnabled ? "mute" : "sound"} testid="game-sound">
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </IconButton>
            )}
            {onTogglePause && (
              <IconButton onClick={onTogglePause} label={paused ? "resume" : "pause"} testid="game-pause">
                {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </IconButton>
            )}
            <IconButton onClick={() => setShowRestart(true)} label="restart" testid="game-restart">
              <RotateCcw className="w-4 h-4" />
            </IconButton>
            <IconButton onClick={() => navigate("/games")} label="exit" testid="game-exit">
              <X className="w-4 h-4" />
            </IconButton>
          </div>
        </header>

        {/* Saving indicator */}
        <AnimatePresence>
          {savingLabel && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed top-4 right-4 z-50 rounded-full border border-lavender/25 bg-archive-soft/90 px-3 py-1 backdrop-blur"
            >
              <span className="type-mono text-[9px] text-lavender">{savingLabel}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Body */}
        <div className="relative">{children}</div>
      </div>

      {/* Instructions modal */}
      <Modal open={showInstructions} onClose={() => setShowInstructions(false)} title="How to play" testid="instructions-modal">
        <div className="space-y-2 text-sm text-text-secondary">
          {instructions?.map((line, i) => (
            <p key={i} className="font-editorial leading-relaxed">
              {line}
            </p>
          ))}
        </div>
      </Modal>

      {/* Restart modal */}
      <Modal open={showRestart} onClose={() => setShowRestart(false)} title="Restart this game?" testid="restart-modal">
        <p className="text-sm text-text-secondary font-editorial mb-4">
          Your current run will be cleared, but your best score and achievements will remain.
        </p>
        <div className="flex gap-2 justify-end">
          <MagneticButton variant="ghost" size="sm" onClick={() => setShowRestart(false)} data-testid="restart-cancel">
            keep going
          </MagneticButton>
          <MagneticButton variant="danger" size="sm" onClick={confirmRestart} data-testid="restart-confirm">
            restart
          </MagneticButton>
        </div>
      </Modal>
    </div>
  );
}

function IconButton({ children, onClick, label, testid }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      data-testid={testid}
      className="w-10 h-10 rounded-full border border-white/12 hover:border-lavender/40 text-text-secondary hover:text-lavender flex items-center justify-center transition-colors"
    >
      {children}
    </button>
  );
}

export function Modal({ open, onClose, title, children, testid }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] bg-archive/85 backdrop-blur-md flex items-center justify-center px-4"
          onClick={onClose}
          data-testid={testid}
        >
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 16, opacity: 0 }}
            className="relative max-w-md w-full rounded-2xl border border-white/12 bg-surface-1 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-text-primary"
              aria-label="close"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="font-editorial text-2xl mb-4">{title}</h3>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function CompletionScreen({ title, subtitle, achievement, stats = [], onReplay, onExit, testid = "completion-screen" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-lavender/30 bg-gradient-to-br from-archive-soft to-surface-1 p-8 md:p-12"
      data-testid={testid}
    >
      <span className="type-mono text-[10px] text-lavender">COMPLETED</span>
      <h2 className="mt-3 font-editorial text-4xl md:text-5xl leading-tight">{title}</h2>
      {subtitle && <p className="mt-3 font-editorial text-lg text-text-secondary max-w-lg">{subtitle}</p>}

      {achievement && (
        <div className="mt-6 inline-flex items-center gap-3 rounded-full border border-lavender/40 bg-lavender/5 px-4 py-2">
          <span className="type-mono text-[9px] text-lavender">ACHIEVEMENT</span>
          <span className="font-editorial text-sm">{achievement}</span>
        </div>
      )}

      {stats.length > 0 && (
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl">
          {stats.map((s) => (
            <div key={s.label} className="border-t border-white/15 pt-3">
              <div className="type-mono text-[9px] text-text-muted">{s.label}</div>
              <div className="font-editorial text-2xl mt-1">{s.value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        {onReplay && (
          <MagneticButton variant="primary" size="md" onClick={onReplay} data-testid="completion-replay">
            play again
          </MagneticButton>
        )}
        <MagneticButton variant="ghost" size="md" onClick={onExit} data-testid="completion-exit">
          back to games
        </MagneticButton>
      </div>
    </motion.div>
  );
}

function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}
