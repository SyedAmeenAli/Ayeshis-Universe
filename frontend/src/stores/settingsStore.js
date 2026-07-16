import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useSettings = create(
  persist(
    (set) => ({
      reducedMotion: false,
      audioEnabled: false,
      volume: 0.7,
      cursorEnabled: true,

      toggleReducedMotion: () => set((s) => ({ reducedMotion: !s.reducedMotion })),
      toggleCursor: () => set((s) => ({ cursorEnabled: !s.cursorEnabled })),
      setAudioEnabled: (v) => set({ audioEnabled: v }),
      setVolume: (v) => set({ volume: Math.max(0, Math.min(1, v)) }),
    }),
    { name: "apu-settings" }
  )
);
