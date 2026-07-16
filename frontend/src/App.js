import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "@/App.css";

import BootScreen from "@/pages/Boot";
import Gateway from "@/pages/Gateway";
import Home from "@/pages/Home";
import OurStory from "@/pages/OurStory";
import WhyILoveYou from "@/pages/WhyILoveYou";
import Memories from "@/pages/Memories";
import MemoryDetail from "@/pages/MemoryDetail";
import TenMonths from "@/pages/TenMonths";
import Archived from "@/pages/Archived";
import { AppShell } from "@/components/shell/AppShell";
import { ProtectedRoute } from "@/components/shell/ProtectedRoute";
import { useSession } from "@/stores/sessionStore";
import { Toaster } from "@/components/ui/sonner";

function App() {
  const check = useSession((s) => s.check);
  useEffect(() => {
    check();
  }, [check]);

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<BootScreen />} />
          <Route path="/gateway" element={<Gateway />} />
          <Route
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route path="/home" element={<Home />} />
            <Route path="/our-story" element={<OurStory />} />
            <Route path="/why-i-love-you" element={<WhyILoveYou />} />
            <Route path="/memories" element={<Memories />} />
            <Route path="/memories/:slug" element={<MemoryDetail />} />
            <Route path="/ten-months" element={<TenMonths />} />
            <Route path="/ayesha" element={<Archived title="Ayesha" subtitle="A luxury editorial, being arranged." />} />
            <Route path="/ameen" element={<Archived title="Ameen" subtitle="Unfortunately, the boyfriend also exists — his corner is coming." />} />
            <Route path="/our-song" element={<Archived title="Our Song" subtitle="The listening room is being tuned." />} />
            <Route path="/safe-space" element={<Archived title="Safe Space" subtitle="Your private diary room. Being furnished quietly." />} />
            <Route path="/calendar" element={<Archived title="Our Calendar" subtitle="Booking Ameen — the calendar is being wired." />} />
            <Route path="/wreck-room" element={<Archived title="Wreck Room" subtitle="Currently under professional destruction." />} />
            <Route path="/games" element={<Archived title="Playground" subtitle="Six games are being built — one detective, five smaller." />} />
            <Route path="/games/:gameId" element={<Archived title="Game" subtitle="This game is being finished. Save your dignity." />} />
            <Route path="/settings" element={<Archived title="Settings" subtitle="Motion, audio and privacy preferences — soon." />} />
          </Route>
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" richColors />
    </div>
  );
}

export default App;
