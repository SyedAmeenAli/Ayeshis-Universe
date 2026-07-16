import { useEffect, useRef, useCallback } from "react";
import { putGameSave } from "@/lib/gamesApi";

/**
 * Autosave hook. Debounces writes and also saves on visibility change / unmount.
 */
export function useGameSave(gameKey, buildPayload, { intervalMs = 15000, active = true } = {}) {
  const timer = useRef(null);
  const savingRef = useRef(false);
  const lastRef = useRef(0);

  const doSave = useCallback(async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    try {
      const payload = buildPayload();
      if (!payload) return;
      await putGameSave(gameKey, payload);
      lastRef.current = Date.now();
    } catch (e) {
      // silent
    } finally {
      savingRef.current = false;
    }
  }, [gameKey, buildPayload]);

  // Periodic autosave
  useEffect(() => {
    if (!active) return;
    timer.current = setInterval(doSave, intervalMs);
    return () => clearInterval(timer.current);
  }, [doSave, intervalMs, active]);

  // Save on visibility change and unload
  useEffect(() => {
    if (!active) return;
    const onVis = () => {
      if (document.visibilityState === "hidden") doSave();
    };
    window.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", doSave);
    return () => {
      window.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", doSave);
    };
  }, [doSave, active]);

  // Save on unmount
  useEffect(() => {
    return () => {
      doSave();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { save: doSave };
}
