import React from "react";
import { Link } from "react-router-dom";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { SkullBow } from "@/components/mascot/SkullBow";

/**
 * Polished shell for routes that are on the roadmap but not fully built in Phase 1.
 * Uses in-world copy — never says "coming soon" as a plain SaaS placeholder.
 */
export default function Archived({ title = "Filed", subtitle = "This chapter is being written." }) {
  return (
    <div className="min-h-screen w-full pt-28 pb-20 px-6 md:px-10 max-w-[1440px] mx-auto">
      <div className="flex flex-col gap-2 mb-16">
        <span className="type-mono text-[10px] text-text-muted">ARCHIVE / DRAFT</span>
        <h1 className="font-editorial text-5xl md:text-7xl leading-[0.95] tracking-tight max-w-4xl">
          {title}
        </h1>
      </div>

      <div className="grid md:grid-cols-12 gap-6 md:gap-10">
        <div className="md:col-span-7 space-y-6">
          <p className="text-lg md:text-xl text-text-secondary font-editorial">{subtitle}</p>
          <p className="text-sm md:text-base text-text-secondary max-w-prose leading-relaxed">
            Ameen has drafted the structure for this room, but hasn't fully arranged it yet.
            The rest of the archive is already open. When this room is ready, it will appear
            with everything intact — writing, media and interactions.
          </p>
          <p className="type-mono text-[10px] text-text-muted">
            status: draft · priority: after phase 1 · last edited: today
          </p>
          <div className="flex flex-wrap gap-3 pt-4">
            <MagneticButton to="/home" variant="primary" size="md" data-testid="archived-home">
              back to home
            </MagneticButton>
            <MagneticButton to="/memories" variant="ghost" size="md" data-testid="archived-memories">
              open the memory vault
            </MagneticButton>
          </div>
        </div>

        <div className="md:col-span-5 flex items-start justify-end">
          <div className="apu-placeholder w-full aspect-[4/5] flex flex-col justify-between p-6">
            <span className="type-mono text-[10px] text-lavender/70">DRAFT_ROOM_1709</span>
            <div>
              <p className="font-editorial text-2xl leading-tight">
                A quiet room, still being furnished.
              </p>
              <div className="mt-3">
                <SkullBow size={32} mood="sleepy" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
