import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "@/stores/sessionStore";
import { SkullBow } from "@/components/mascot/SkullBow";
import { MagneticButton } from "@/components/motion/MagneticButton";

const WRONG_MESSAGES = [
  "Baby, that is definitely not when we met.",
  "You are about to lose girlfriend verification privileges.",
  "Hint: Hinge. Wednesday. September.",
  "Ameen remembers this. Under pressure.",
];

export default function Gateway() {
  const navigate = useNavigate();
  const attemptGateway = useSession((s) => s.attemptGateway);
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [wrongIdx, setWrongIdx] = useState(0);

  async function onSubmit(e) {
    e.preventDefault();
    if (!answer.trim() || status === "checking") return;
    setStatus("checking");
    const res = await attemptGateway(answer.trim());
    if (res.ok) {
      setStatus("success");
      setMessage("Identity confirmed. Welcome home, Ayeshi.");
      setTimeout(() => navigate("/home", { replace: true }), 1200);
    } else if (res.reason === "rate-limited") {
      setStatus("locked");
      setMessage("The archive is resting. Try again in a little while.");
    } else {
      setStatus("wrong");
      setMessage(WRONG_MESSAGES[wrongIdx % WRONG_MESSAGES.length]);
      setWrongIdx((n) => n + 1);
    }
  }

  return (
    <div className="min-h-screen w-full relative overflow-hidden flex items-center justify-center px-4">
      <div className="absolute inset-0 apu-grain pointer-events-none" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 30% 20%, rgba(184,156,255,0.08), transparent 55%), radial-gradient(circle at 80% 80%, rgba(243,167,196,0.05), transparent 45%), #0B0B0F",
        }}
      />

      {/* floating grey tulips */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-24 h-24 rounded-full"
            style={{
              left: `${(i * 17 + 8) % 90}%`,
              top: `${(i * 23 + 12) % 85}%`,
              background:
                "radial-gradient(circle, rgba(184,156,255,0.08), transparent 65%)",
              filter: "blur(2px)",
            }}
            animate={{
              y: [0, -12, 0],
              opacity: [0.4, 0.7, 0.4],
            }}
            transition={{
              duration: 8 + i * 1.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.6,
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md rounded-3xl border border-white/12 bg-archive-soft/70 backdrop-blur-2xl p-8 md:p-10"
      >
        <div className="flex items-center gap-3 pb-6 border-b border-white/8">
          <SkullBow size={36} mood="alert" />
          <div>
            <p className="type-mono text-[10px] text-lavender/80">PRIVATE ARCHIVE</p>
            <p className="type-mono text-[10px] text-text-muted mt-0.5">CASE / 1709</p>
          </div>
        </div>

        <div className="pt-8">
          <p className="font-editorial text-3xl md:text-4xl leading-[1.05] tracking-tight">
            This world belongs to <em className="not-italic text-lavender">one person.</em>
          </p>
          <p className="mt-5 text-sm text-text-secondary font-ui">
            When did our story begin?
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-6">
          <label className="block type-mono text-[9px] text-text-muted mb-2" htmlFor="gateway-input">
            enter the date
          </label>
          <input
            id="gateway-input"
            data-testid="gateway-input"
            autoFocus
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="17 September 2025"
            className="w-full bg-transparent border-0 border-b border-white/15 focus:border-lavender outline-none py-3 text-lg font-editorial text-text-primary placeholder:text-text-muted/50 tracking-wide"
          />

          <div className="mt-6 flex items-center gap-3">
            <MagneticButton
              data-testid="gateway-submit"
              type="submit"
              variant="primary"
              size="md"
              disabled={status === "checking" || status === "success"}
            >
              {status === "checking" ? "checking…" : "unlock"}
            </MagneticButton>
            <span className="type-mono text-[9px] text-text-muted">
              formats accepted: 17/09/2025 · 17 sep 2025 · 20250917
            </span>
          </div>
        </form>

        <AnimatePresence>
          {message && (
            <motion.p
              key={message}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className={`mt-5 text-sm ${
                status === "success"
                  ? "font-hand text-2xl text-lavender-soft"
                  : "font-editorial italic text-text-secondary"
              }`}
              data-testid="gateway-response"
            >
              {message}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
