import React, { useEffect, useState } from "react";
import { fetchFeatureFlagsPublic } from "@/lib/studioApi";

/**
 * Wraps a route with a studio-controlled feature flag. Renders children
 * only when the flag is on; otherwise shows an in-world paused state
 * instead of the real page. Fails open (renders children) if the flags
 * request errors, so a backend hiccup never locks Ayesha out.
 */
export function FeatureGate({ flag, label, children }) {
  const [enabled, setEnabled] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchFeatureFlagsPublic()
      .then((flags) => {
        if (!cancelled) setEnabled(flags[flag] !== false);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [flag]);

  if (!loaded) return <div className="min-h-screen w-full" />;

  if (!enabled) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center px-6 text-center">
        <span className="type-mono text-[10px] text-text-muted">PAUSED FROM THE STUDIO</span>
        <h1 className="mt-4 font-editorial text-4xl md:text-5xl">{label} is quietly paused.</h1>
        <p className="mt-3 text-text-secondary max-w-sm">
          Ameen turned this off for now. It'll come back.
        </p>
      </div>
    );
  }

  return children;
}
