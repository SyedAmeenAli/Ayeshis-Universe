import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { TopNav } from "@/components/shell/TopNav";
import { MobileDock } from "@/components/shell/MobileDock";
import { CustomCursor } from "@/components/shell/CustomCursor";
import { FilmGrain } from "@/components/shell/FilmGrain";
import { useSectionTracker } from "@/hooks/useSectionTracker";
import { useProgress } from "@/stores/progressStore";
import { useSession } from "@/stores/sessionStore";

/**
 * App-wide shell for authenticated routes.
 * Persists nav, cursor and grain across page transitions.
 */
export function AppShell() {
  useSectionTracker();
  const status = useSession((s) => s.status);
  const load = useProgress((s) => s.load);
  const loaded = useProgress((s) => s.loaded);

  useEffect(() => {
    if (status === "authenticated" && !loaded) load();
  }, [status, loaded, load]);

  return (
    <div className="relative min-h-screen w-full">
      <FilmGrain />
      <CustomCursor />
      <TopNav />
      <main className="relative z-10 pb-24 md:pb-0">
        <Outlet />
      </main>
      <MobileDock />
    </div>
  );
}
