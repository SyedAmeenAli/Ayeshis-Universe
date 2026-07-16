import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "@/stores/sessionStore";
import { SkullBow } from "@/components/mascot/SkullBow";

const MESSAGES = [
  "Initializing a private world for Ayesha…",
  "Restoring ten months of memories…",
  "Recovering embarrassing incidents…",
  "Hiding evidence from Chota Koko…",
  "Protecting Ameen's remaining dignity…",
  "Preparing something made only for you…",
];

const TOTAL_MS = 4200;

export default function BootScreen() {
  const navigate = useNavigate();
  const check = useSession((s) => s.check);
  const status = useSession((s) => s.status);
  const [idx, setIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showSkip, setShowSkip] = useState(false);
  const navigatedRef = useRef(false);

  // Kick off session check in the background — don't await it before proceeding.
  useEffect(() => {
    check();
  }, [check]);

  // Message rotation
  useEffect(() => {
    const iv = setInterval(() => {
      setIdx((i) => (i + 1) % MESSAGES.length);
    }, 750);
    return () => clearInterval(iv);
  }, []);

  // Progress bar (independent timeline)
  useEffect(() => {
    const start = Date.now();
    const iv = setInterval(() => {
      const p = Math.min(100, ((Date.now() - start) / TOTAL_MS) * 100);
      setProgress(p);
      if (p >= 100) {
        clearInterval(iv);
      }
    }, 60);
    return () => clearInterval(iv);
  }, []);

  // Auto-navigate after TOTAL_MS regardless of session check outcome.
  // If status becomes authenticated earlier, go to /home; otherwise /gateway.
  useEffect(() => {
    const t = setTimeout(() => {
      if (navigatedRef.current) return;
      navigatedRef.current = true;
      const dest = useSession.getState().status === "authenticated" ? "/home" : "/gateway";
      navigate(dest, { replace: true });
    }, TOTAL_MS + 400);
    return () => clearTimeout(t);
  }, [navigate]);

  // Show skip after 1.5s
  useEffect(() => {
    const t = setTimeout(() => setShowSkip(true), 1500);
    return () => clearTimeout(t);
  }, []);

  function onSkip() {
    if (navigatedRef.current) return;
    navigatedRef.current = true;
    const dest = useSession.getState().status === "authenticated" ? "/home" : "/gateway";
    navigate(dest, { replace: true });
  }

  return (
    <div className="min-h-screen w-full bg-archive text-text-primary relative flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 apu-grain pointer-events-none" />
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(184,156,255,0.06) 0%, transparent 55%)",
        }}
      />

      <div className="relative z-10 max-w-xl w-full px-6">
        <div className="flex flex-col items-start gap-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="absolute -inset-6 rounded-full bg-lavender/10 blur-xl" />
            <SkullBow size={64} mood="sleepy" className="relative z-10" />
          </motion.div>

          <div className="w-full">
            <span className="type-mono text-[10px] text-text-muted">
              PRIVATE ARCHIVE / 1709
            </span>

            <div className="mt-6 h-14 relative">
              <AnimatePresence mode="wait">
                <motion.p
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.5 }}
                  className="text-lg md:text-xl font-editorial text-text-primary/85"
                  data-testid="boot-message"
                >
                  {MESSAGES[idx]}
                </motion.p>
              </AnimatePresence>
            </div>

            <div className="mt-8 h-px w-full bg-white/8 relative overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-lavender transition-[width] duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>

            <p className="mt-8 type-mono text-[10px] text-text-muted">
              Best experienced with headphones.
            </p>
          </div>

          {showSkip && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              data-testid="boot-skip"
              onClick={onSkip}
              className="type-mono text-[10px] text-text-muted hover:text-lavender transition-colors"
            >
              skip →
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}
