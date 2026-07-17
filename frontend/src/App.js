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
import WreckRoom from "@/pages/WreckRoom";
import GamesLibrary from "@/pages/games/GamesLibrary";
import Jigsaw from "@/pages/games/Jigsaw";
import Timeline from "@/pages/games/Timeline";
import AmeenQuiz from "@/pages/games/AmeenQuiz";
import SushiStack from "@/pages/games/SushiStack";
import FindKoko from "@/pages/games/FindKoko";
import Case1709 from "@/pages/games/Case1709";
import Ayesha from "@/pages/Ayesha";
import Ameen from "@/pages/Ameen";
import OurSong from "@/pages/OurSong";
import SafeSpace from "@/pages/SafeSpace";
import CalendarPage from "@/pages/Calendar";
import Studio from "@/pages/Studio";
import { AppShell } from "@/components/shell/AppShell";
import { ProtectedRoute } from "@/components/shell/ProtectedRoute";
import { FeatureGate } from "@/components/shell/FeatureGate";
import { ScrollToTop } from "@/components/shell/ScrollToTop";
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
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<BootScreen />} />
          <Route path="/gateway" element={<Gateway />} />
          <Route path="/studio" element={<Studio />} />
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
            <Route path="/ayesha" element={<Ayesha />} />
            <Route path="/ameen" element={<Ameen />} />
            <Route
              path="/our-song"
              element={
                <FeatureGate flag="our_song_enabled" label="Our Song">
                  <OurSong />
                </FeatureGate>
              }
            />
            <Route
              path="/safe-space"
              element={
                <FeatureGate flag="safe_space_enabled" label="Safe Space">
                  <SafeSpace />
                </FeatureGate>
              }
            />
            <Route
              path="/calendar"
              element={
                <FeatureGate flag="calendar_enabled" label="Our Calendar">
                  <CalendarPage />
                </FeatureGate>
              }
            />
            <Route
              path="/wreck-room"
              element={
                <FeatureGate flag="wreck_room_enabled" label="Wreck Room">
                  <WreckRoom />
                </FeatureGate>
              }
            />
            <Route path="/games" element={<GamesLibrary />} />
            <Route path="/games/case-1709" element={<Case1709 />} />
            <Route path="/games/jigsaw" element={<Jigsaw />} />
            <Route path="/games/timeline" element={<Timeline />} />
            <Route path="/games/ameen-quiz" element={<AmeenQuiz />} />
            <Route path="/games/sushi-stack" element={<SushiStack />} />
            <Route path="/games/find-koko" element={<FindKoko />} />
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
