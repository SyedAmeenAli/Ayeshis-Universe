import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { NAV_ITEMS } from "@/lib/config";
import { SkullBow } from "@/components/mascot/SkullBow";
import { useProgress } from "@/stores/progressStore";
import { motion } from "framer-motion";

/**
 * Floating desktop navigation rail. Becomes quieter on cinematic routes.
 */
export function TopNav() {
  const location = useLocation();
  const hiddenScrollEligible = useProgress((s) => s.hiddenScrollEligible);
  const finalRevealUnlocked = useProgress((s) => s.finalRevealUnlocked);

  const dimRoutes = ["/our-story", "/ten-months", "/why-i-love-you"];
  const dim = dimRoutes.some((r) => location.pathname.startsWith(r));

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: dim ? 0.55 : 1 }}
      transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-40 hidden md:flex"
      style={{ backdropFilter: "blur(14px)" }}
      data-testid="top-nav"
    >
      <div className="flex items-center gap-1 px-2 py-2 rounded-full border border-white/10 bg-archive-soft/60">
        <div className="flex items-center gap-2 pl-3 pr-4 border-r border-white/10">
          <SkullBow size={22} mood={finalRevealUnlocked ? "anniversary" : "sleepy"} />
          <span className="type-mono text-[10px] text-text-secondary hidden lg:inline">
            ARCHIVE 1709
          </span>
        </div>

        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            data-testid={`nav-${item.id}`}
            data-cursor="open"
            className={({ isActive }) =>
              `px-4 py-2 text-xs tracking-wide rounded-full transition-colors ${
                isActive
                  ? "bg-white/8 text-text-primary"
                  : "text-text-secondary hover:text-text-primary"
              }`
            }
          >
            {item.label}
            {item.id === "ten-months" && finalRevealUnlocked && (
              <span className="ml-2 inline-block w-1.5 h-1.5 rounded-full bg-bow align-middle" />
            )}
          </NavLink>
        ))}

        {hiddenScrollEligible && !finalRevealUnlocked && (
          <span className="type-mono text-[9px] text-lavender/80 pl-3 pr-2">
            •
          </span>
        )}
      </div>
    </motion.header>
  );
}
