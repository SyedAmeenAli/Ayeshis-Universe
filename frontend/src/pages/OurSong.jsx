import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Play, Pause, Heart, Volume2, VolumeX, RotateCcw } from "lucide-react";
import { AssetPlaceholder } from "@/components/media/AssetPlaceholder";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { OUR_SONG_CAPTIONS, OUR_SONG_SEQUENCES } from "@/data/ourSong";
import { fetchAudioConfig, saveOurSongMoment } from "@/lib/ourSongApi";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { photoForAssetId } from "@/lib/realAssets";
import { photoForAyeshaAssetId } from "@/lib/ayeshaPhotos";
import { COVER_IMAGES } from "@/lib/coverImages";

// The hero image cycles through this pool while the song plays, instead of
// sitting on one static photo the whole time.
const HERO_PHOTO_POOL = [
  COVER_IMAGES["our-song-album"],
  photoForAssetId("SONG-HERO-1"),
  photoForAyeshaAssetId("SONG-HERO-2"),
  photoForAssetId("SONG-HERO-3"),
  photoForAyeshaAssetId("SONG-HERO-4"),
].filter(Boolean);

export default function OurSong() {
  const [entered, setEntered] = useState(false);
  const [audioConfig, setAudioConfig] = useState(null);

  useEffect(() => {
    fetchAudioConfig().then(setAudioConfig).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen w-full">
      {!entered ? (
        <EntryScreen onEnter={() => setEntered(true)} />
      ) : (
        <PlayerScreen audioConfig={audioConfig} />
      )}
    </div>
  );
}

function EntryScreen({ onEnter }) {
  return (
    <motion.div
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed inset-0 flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,_rgba(139,92,246,0.14),_transparent_60%),#0b0b0f] px-6 text-center"
      data-testid="our-song-entry"
    >
      <div className="absolute inset-0 apu-shimmer opacity-20 pointer-events-none" />
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9 }}
        className="font-editorial text-2xl md:text-3xl text-text-secondary"
      >
        Some songs are just songs.
      </motion.p>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.5 }}
        className="mt-3 font-editorial text-2xl md:text-3xl text-text-secondary"
      >
        And some begin to feel like a person.
      </motion.p>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 1.0 }}
        className="mt-3 font-editorial text-3xl md:text-4xl text-lavender"
      >
        This one feels a little like you.
      </motion.p>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }} className="mt-14">
        <MagneticButton onClick={onEnter} variant="primary" size="lg" data-testid="our-song-enter">
          Put your headphones on — enter Our Song
        </MagneticButton>
      </motion.div>
    </motion.div>
  );
}

function PlayerScreen({ audioConfig }) {
  const reducedMotion = useReducedMotion();
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1
  const [duration, setDuration] = useState(0);
  const [favourite, setFavourite] = useState(false);
  const [captionIdx, setCaptionIdx] = useState(0);
  const [heroIdx, setHeroIdx] = useState(0);
  const [saving, setSaving] = useState(false);

  const hasAudio = !!audioConfig?.audio_source;

  // The entry screen's "put your headphones on" click is the user gesture
  // that unlocks autoplay here, so the song can start the instant the
  // player mounts instead of waiting for a second click.
  useEffect(() => {
    if (!hasAudio) return;
    const el = audioRef.current;
    if (!el) return;
    el.play()
      .then(() => setPlaying(true))
      .catch(() => {});
  }, [hasAudio]);

  useEffect(() => {
    if (!hasAudio || reducedMotion) return;
    const iv = setInterval(() => {
      setCaptionIdx((i) => (i + 1) % OUR_SONG_CAPTIONS.length);
    }, 5200);
    return () => clearInterval(iv);
  }, [hasAudio, reducedMotion]);

  // Hero photo cycles while the song is actually playing — it was pinned to
  // one static image before, regardless of playback state.
  useEffect(() => {
    if (!playing || reducedMotion || HERO_PHOTO_POOL.length < 2) return;
    const iv = setInterval(() => {
      setHeroIdx((i) => (i + 1) % HERO_PHOTO_POOL.length);
    }, 4500);
    return () => clearInterval(iv);
  }, [playing, reducedMotion]);

  function togglePlay() {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
    } else {
      el.play().catch(() => {});
    }
    setPlaying(!playing);
  }

  function onTimeUpdate() {
    const el = audioRef.current;
    if (!el || !el.duration) return;
    setProgress(el.currentTime / el.duration);
  }

  function onSeek(e) {
    const el = audioRef.current;
    if (!el || !el.duration) return;
    const ratio = Number(e.target.value);
    el.currentTime = ratio * el.duration;
    setProgress(ratio);
  }

  async function onSaveMoment() {
    setSaving(true);
    try {
      await saveOurSongMoment(OUR_SONG_CAPTIONS[captionIdx]);
      toast("Saved to Memory Vault.");
    } catch {
      toast("Could not save right now — try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.7 }}
      className="min-h-screen w-full pt-24 md:pt-28 pb-24 px-5 md:px-10 max-w-3xl mx-auto"
      data-testid="our-song-player"
    >
      {hasAudio && (
        <audio
          ref={audioRef}
          src={audioConfig.audio_source}
          onTimeUpdate={onTimeUpdate}
          onLoadedMetadata={(e) => setDuration(e.target.duration)}
          onEnded={() => setPlaying(false)}
          muted={muted}
        />
      )}

      <div className="text-center mb-10">
        <span className="type-mono text-[10px] text-text-muted">
          {hasAudio ? audioConfig.audio_title : "AMBIENT MODE — no track configured"}
        </span>
      </div>

      <div className="relative rounded-3xl overflow-hidden mb-10" style={{ aspectRatio: "4/5" }}>
        {HERO_PHOTO_POOL.length > 0 ? (
          <AnimatePresence>
            <motion.img
              key={HERO_PHOTO_POOL[heroIdx]}
              src={HERO_PHOTO_POOL[heroIdx]}
              alt=""
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.1, ease: "easeInOut" }}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </AnimatePresence>
        ) : (
          <AssetPlaceholder asset={OUR_SONG_SEQUENCES[0].asset} aspect="4/5" />
        )}
      </div>

      <div className="text-center min-h-[3rem] mb-10">
        <motion.p
          key={captionIdx}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="font-hand text-2xl md:text-3xl text-lavender-soft"
        >
          {OUR_SONG_CAPTIONS[captionIdx]}
        </motion.p>
      </div>

      {hasAudio ? (
        <div className="flex flex-col items-center gap-4">
          <input
            type="range"
            min={0}
            max={1}
            step={0.001}
            value={progress}
            onChange={onSeek}
            className="w-full accent-lavender"
            data-testid="our-song-seek"
          />
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (audioRef.current) audioRef.current.currentTime = 0;
                setProgress(0);
              }}
              className="w-10 h-10 rounded-full border border-white/15 flex items-center justify-center"
              aria-label="Restart"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={togglePlay}
              className="w-14 h-14 rounded-full bg-lavender text-archive flex items-center justify-center"
              data-testid="our-song-play"
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
            <button
              onClick={() => setMuted((m) => !m)}
              className="w-10 h-10 rounded-full border border-white/15 flex items-center justify-center"
              aria-label={muted ? "Unmute" : "Mute"}
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setFavourite((f) => !f)}
              className={`w-10 h-10 rounded-full border flex items-center justify-center ${favourite ? "border-bow text-bow" : "border-white/15"}`}
              data-testid="our-song-favourite"
              aria-label="Favourite"
            >
              <Heart className="w-4 h-4" fill={favourite ? "currentColor" : "none"} />
            </button>
          </div>
        </div>
      ) : (
        <p className="text-center text-sm text-text-muted">
          Audio is unavailable, but the moment is still here. Set <code className="type-mono">OUR_SONG_URL</code> in
          backend/.env to add a track.
        </p>
      )}

      <div className="mt-16 flex flex-wrap justify-center gap-3">
        {OUR_SONG_SEQUENCES[2].items.map((item) => (
          <div key={item.id} className="w-24 md:w-32">
            <AssetPlaceholder asset={item} aspect="1/1" minimal />
          </div>
        ))}
      </div>

      <div className="mt-16 flex justify-center">
        <MagneticButton onClick={onSaveMoment} disabled={saving} variant="ghost" size="md" data-testid="our-song-save-moment">
          {saving ? "saving…" : "save this moment"}
        </MagneticButton>
      </div>
    </motion.div>
  );
}
