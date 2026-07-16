import { create } from "zustand";
import { apiGet, apiPost } from "@/lib/api";
import { ELIGIBLE_SECTIONS } from "@/lib/config";

const DEFAULT = {
  loaded: false,
  sectionsExplored: [],
  storyPosition: { section_index: 0, scroll_ratio: 0 },
  hiddenScrollEligible: false,
  hiddenScrollFound: false,
  finalRevealUnlocked: false,
  finalRevealViewed: false,
  favouriteMemoryIds: [],
};

export const useProgress = create((set, get) => ({
  ...DEFAULT,

  reset: () => set({ ...DEFAULT }),

  load: async () => {
    try {
      const data = await apiGet("/progress");
      set({
        loaded: true,
        sectionsExplored: data.sections_explored || [],
        storyPosition: data.story_position || { section_index: 0, scroll_ratio: 0 },
        hiddenScrollEligible: !!data.hidden_scroll_eligible,
        hiddenScrollFound: !!data.hidden_scroll_found,
        finalRevealUnlocked: !!data.final_reveal_unlocked,
        finalRevealViewed: !!data.final_reveal_viewed,
        favouriteMemoryIds: data.favourite_memory_ids || [],
      });
    } catch (e) {
      set({ loaded: true });
    }
  },

  trackSection: async (key) => {
    if (!ELIGIBLE_SECTIONS.includes(key)) return;
    const alreadyExplored = get().sectionsExplored.includes(key);
    if (alreadyExplored) return;
    try {
      const data = await apiPost("/progress/section", { section_key: key });
      set({
        sectionsExplored: data.sections_explored,
        hiddenScrollEligible: data.hidden_scroll_eligible,
      });
    } catch (e) {
      // silent — progress is opportunistic
    }
  },

  saveStoryPosition: async (section_index, scroll_ratio) => {
    set({ storyPosition: { section_index, scroll_ratio } });
    try {
      await apiPost("/progress/story-position", { section_index, scroll_ratio });
    } catch (e) {
      // silent
    }
  },

  unlockHiddenScroll: async () => {
    try {
      const data = await apiPost("/progress/hidden-scroll");
      if (data.ok) {
        set({ hiddenScrollFound: true, finalRevealUnlocked: true });
        return true;
      }
    } catch (e) {
      return false;
    }
    return false;
  },

  markFinalViewed: async () => {
    set({ finalRevealViewed: true });
    try {
      await apiPost("/progress/final-viewed");
    } catch (e) {
      // silent
    }
  },
}));
