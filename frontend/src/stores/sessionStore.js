import { create } from "zustand";
import { apiGet, apiPost } from "@/lib/api";

export const useSession = create((set) => ({
  status: "unknown", // 'unknown' | 'authenticated' | 'guest'
  profileId: null,
  checking: false,

  check: async () => {
    set({ checking: true });
    try {
      const data = await apiGet("/auth/me");
      set({ status: "authenticated", profileId: data.profile_id, checking: false });
      return true;
    } catch (e) {
      set({ status: "guest", profileId: null, checking: false });
      return false;
    }
  },

  attemptGateway: async (answer) => {
    try {
      const data = await apiPost("/auth/gateway", { answer });
      if (data.ok) {
        set({ status: "authenticated", profileId: "ayesha" });
        return { ok: true };
      }
      return { ok: false, reason: "wrong-date" };
    } catch (e) {
      if (e?.response?.status === 429) {
        return { ok: false, reason: "rate-limited" };
      }
      return { ok: false, reason: "error" };
    }
  },

  logout: async () => {
    try {
      await apiPost("/auth/logout");
    } catch (e) {
      // ignore
    }
    set({ status: "guest", profileId: null });
  },
}));
