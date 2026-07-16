import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useProgress } from "@/stores/progressStore";
import { ELIGIBLE_SECTIONS } from "@/lib/config";

/**
 * When a route corresponds to a section eligible for the hidden-scroll clue,
 * mark it as explored on mount.
 */
export function useSectionTracker() {
  const location = useLocation();
  const trackSection = useProgress((s) => s.trackSection);

  useEffect(() => {
    const path = location.pathname.replace(/^\//, "").split("/")[0];
    if (ELIGIBLE_SECTIONS.includes(path)) {
      trackSection(path);
    }
  }, [location.pathname, trackSection]);
}
