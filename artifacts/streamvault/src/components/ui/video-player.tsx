import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Pause, Volume2, VolumeX, Volume1,
  Maximize2, Minimize2, ChevronLeft,
  RotateCcw, RotateCw,
} from "lucide-react";
import { MediaItem } from "@/data/content";

const TOTAL_SECS = 7200;

interface VideoPlayerProps {
  item: MediaItem;
  onClose: () => void;
}

function fmtTime(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function VideoPlayer({ item, onClose }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const seekBarRef = useRef<HTMLDivElement>(null);
  const volBarRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isDraggingSeek = useRef(false);
  const isDraggingVol = useRef(false);

  const [isPlaying, setIsPlaying] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showVolume, setShowVolume] = useState(false);
  const [tapFlash, setTapFlash] = useState<"left" | "right" | null>(null);

  const effectiveVol = isMuted ? 0 : volume;
  const progress = Math.min(1, elapsed / TOTAL_SECS);

  const scheduleHide = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    setShowControls(true);
    hideTimerRef.current = setTimeout(() => setShowControls(false), 3500);
  }, []);

  const showAndReset = useCallback(() => {
    scheduleHide();
  }, [scheduleHide]);

  useEffect(() => {
    scheduleHide();
    return () => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current); };
  }, []);

  useEffect(() => {
    if (!isPlaying) {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      setShowControls(true);
      return;
    }
    scheduleHide();
  }, [isPlaying, scheduleHide]);

  useEffect(() => {
    if (!isPlaying) {
      if (tickRef.current) clearInterval(tickRef.current);
      return;
    }
    tickRef.current = setInterval(() => {
      setElapsed(e => {
        if (e >= TOTAL_SECS) {
          clearInterval(tickRef.current!);
          setIsPlaying(false);
          return TOTAL_SECS;
        }
        return e + 0.1;
      });
    }, 100);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [isPlaying]);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === " " || e.key === "k") { e.preventDefault(); setIsPlaying(p => !p); }
      if (e.key === "ArrowLeft")  { e.preventDefault(); setElapsed(s => Math.max(0, s - 10)); showAndReset(); }
      if (e.key === "ArrowRight") { e.preventDefault(); setElapsed(s => Math.min(TOTAL_SECS, s + 10)); showAndReset(); }
      if (e.key === "m") setIsMuted(m => !m);
      if (e.key === "f") toggleFullscreen();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showAndReset]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) containerRef.current.requestFullscreen().catch(() => {});
    else document.exitFullscreen().catch(() => {});
  };

  const seekFromX = (clientX: number) => {
    if (!seekBarRef.current) return;
    const rect = seekBarRef.current.getBoundingClientRect();
    const pct = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    setElapsed(pct * TOTAL_SECS);
  };

  const onSeekDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    isDraggingSeek.current = true;
    seekFromX(e.clientX);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
  };
  const onSeekMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingSeek.current) return;
    seekFromX(e.clientX);
  };
  const onSeekUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingSeek.current = false;
    seekFromX(e.clientX);
    scheduleHide();
  };

  const volFromX = (clientX: number) => {
    if (!volBarRef.current) return;
    const rect = volBarRef.current.getBoundingClientRect();
    const v = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    setVolume(v);
    setIsMuted(v === 0);
  };
  const onVolDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    isDraggingVol.current = true;
    volFromX(e.clientX);
  };
  const onVolMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingVol.current) return;
    volFromX(e.clientX);
  };
  const onVolUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingVol.current = false;
    volFromX(e.clientX);
  };

  const skip = (secs: number) => {
    setElapsed(e => Math.min(TOTAL_SECS, Math.max(0, e + secs)));
    setTapFlash(secs < 0 ? "left" : "right");
    setTimeout(() => setTapFlash(null), 600);
    showAndReset();
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-black overflow-hidden select-none"
      style={{ aspectRatio: "16/9" }}
      onPointerMove={showAndReset}
    >
      {/* Backdrop */}
      <img
        src={item.backdropUrl}
        alt={item.title}
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />
      <div className="absolute inset-0 bg-black/30" />

      {/* Top gradient */}
      <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-black/80 to-transparent pointer-events-none z-10" />
      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-44 bg-gradient-to-t from-black to-black/60 to-transparent pointer-events-none z-10" />

      {/* Tap-to-seek flash */}
      <AnimatePresence>
        {tapFlash === "left" && (
          <motion.div key="fl" initial={{ opacity: 0.6 }} animate={{ opacity: 0 }} transition={{ duration: 0.55 }}
            className="absolute left-0 top-0 bottom-0 w-1/3 bg-white/10 rounded-r-full z-20 pointer-events-none flex items-center justify-center">
            <RotateCcw className="w-8 h-8 text-white/70" />
          </motion.div>
        )}
        {tapFlash === "right" && (
          <motion.div key="fr" initial={{ opacity: 0.6 }} animate={{ opacity: 0 }} transition={{ duration: 0.55 }}
            className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/10 rounded-l-full z-20 pointer-events-none flex items-center justify-center">
            <RotateCw className="w-8 h-8 text-white/70" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invisible center tap zone for play/pause */}
      <div
        className="absolute inset-0 z-20"
        onClick={() => { setIsPlaying(p => !p); }}
      />

      {/* Controls */}
      <motion.div
        animate={{ opacity: showControls ? 1 : 0 }}
        transition={{ duration: 0.25 }}
        className={`absolute inset-0 z-30 flex flex-col justify-between ${showControls ? "" : "pointer-events-none"}`}
      >
        {/* ── Top bar ── */}
        <div className="flex items-center gap-3 px-3 sm:px-5 pt-3 sm:pt-4 pointer-events-auto">
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="shrink-0 w-9 h-9 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/80 hover:text-white hover:bg-black/70 transition-all active:scale-90"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex-1 min-w-0">
            <p className="text-[13px] sm:text-sm font-semibold text-white/90 leading-none truncate">{item.title}</p>
            <p className="text-[10px] text-white/40 mt-0.5">{item.year} · {item.genre}</p>
          </div>

          {item.quality && (
            <span className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wide ${
              item.quality === "4K"
                ? "bg-white text-black"
                : "bg-white/15 text-white border border-white/25"
            }`}>
              {item.quality}
            </span>
          )}
        </div>

        {/* ── Center controls ── */}
        <div className="flex items-center justify-center gap-6 sm:gap-10 pointer-events-auto">
          {/* Rewind 10s */}
          <button
            onClick={(e) => { e.stopPropagation(); skip(-10); }}
            className="group flex flex-col items-center gap-1 active:scale-90 transition-transform"
          >
            <div className="relative w-12 h-12 flex items-center justify-center">
              <RotateCcw className="w-7 h-7 text-white/75 group-hover:text-white transition-colors" />
              <span className="absolute text-[9px] font-bold text-white/75 group-hover:text-white transition-colors" style={{ top: "54%", left: "50%", transform: "translate(-50%,-50%)" }}>10</span>
            </div>
            <span className="text-[9px] text-white/40 font-medium">Rewind</span>
          </button>

          {/* Play / Pause */}
          <button
            onClick={(e) => { e.stopPropagation(); setIsPlaying(p => !p); }}
            className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full bg-white/15 backdrop-blur-md border border-white/35 flex items-center justify-center hover:bg-white/25 transition-all active:scale-95 shadow-2xl"
          >
            <AnimatePresence mode="wait" initial={false}>
              {isPlaying ? (
                <motion.span key="pause"
                  initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }}
                  transition={{ duration: 0.1 }} className="flex">
                  <Pause className="w-7 h-7 text-white fill-white" />
                </motion.span>
              ) : (
                <motion.span key="play"
                  initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }}
                  transition={{ duration: 0.1 }} className="flex">
                  <Play className="w-7 h-7 text-white fill-white ml-1" />
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {/* Forward 10s */}
          <button
            onClick={(e) => { e.stopPropagation(); skip(10); }}
            className="group flex flex-col items-center gap-1 active:scale-90 transition-transform"
          >
            <div className="relative w-12 h-12 flex items-center justify-center">
              <RotateCw className="w-7 h-7 text-white/75 group-hover:text-white transition-colors" />
              <span className="absolute text-[9px] font-bold text-white/75 group-hover:text-white transition-colors" style={{ top: "54%", left: "50%", transform: "translate(-50%,-50%)" }}>10</span>
            </div>
            <span className="text-[9px] text-white/40 font-medium">Forward</span>
          </button>
        </div>

        {/* ── Bottom bar ── */}
        <div className="px-3 sm:px-5 pb-3 sm:pb-5 pointer-events-auto space-y-1.5">

          {/* Time labels */}
          <div className="flex items-center justify-between px-0.5">
            <span className="text-[11px] font-semibold text-white/65 tabular-nums">{fmtTime(elapsed)}</span>
            <span className="text-[11px] font-semibold text-white/40 tabular-nums">-{fmtTime(TOTAL_SECS - elapsed)}</span>
          </div>

          {/* Seek bar */}
          <div
            ref={seekBarRef}
            className="relative w-full h-5 flex items-center cursor-pointer group/seek"
            onPointerDown={onSeekDown}
            onPointerMove={onSeekMove}
            onPointerUp={onSeekUp}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Track */}
            <div className="relative w-full h-[3px] group-hover/seek:h-[5px] transition-all duration-150 rounded-full bg-white/25">
              {/* Buffered (fake) */}
              <div className="absolute inset-0 rounded-full bg-white/20" style={{ width: `${Math.min(100, progress * 100 + 15)}%` }} />
              {/* Played */}
              <div className="absolute inset-y-0 left-0 rounded-full bg-white" style={{ width: `${progress * 100}%` }} />
            </div>
            {/* Thumb */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-lg scale-0 group-hover/seek:scale-100 transition-transform duration-150 pointer-events-none"
              style={{ left: `calc(${progress * 100}% - 8px)` }}
            />
          </div>

          {/* Volume + fullscreen */}
          <div className="flex items-center justify-between pt-0.5">
            {/* Volume control */}
            <div
              className="flex items-center gap-2"
              onMouseEnter={() => setShowVolume(true)}
              onMouseLeave={() => setShowVolume(false)}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={(e) => { e.stopPropagation(); setIsMuted(m => !m); }}
                className="text-white/60 hover:text-white transition-colors p-1.5 -m-1.5 active:scale-90"
              >
                {effectiveVol === 0
                  ? <VolumeX className="w-[18px] h-[18px]" />
                  : effectiveVol < 0.5
                  ? <Volume1 className="w-[18px] h-[18px]" />
                  : <Volume2 className="w-[18px] h-[18px]" />}
              </button>

              <AnimatePresence>
                {showVolume && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 72 }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden"
                  >
                    <div
                      ref={volBarRef}
                      className="w-[72px] h-5 flex items-center cursor-pointer"
                      onPointerDown={onVolDown}
                      onPointerMove={onVolMove}
                      onPointerUp={onVolUp}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="relative w-full h-1 rounded-full bg-white/25 group/vol">
                        <div
                          className="absolute inset-y-0 left-0 rounded-full bg-white"
                          style={{ width: `${effectiveVol * 100}%` }}
                        />
                        <div
                          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow pointer-events-none"
                          style={{ left: `calc(${effectiveVol * 100}% - 6px)` }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Fullscreen */}
            <button
              onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
              className="text-white/60 hover:text-white transition-colors p-1.5 -m-1.5 active:scale-90"
            >
              {isFullscreen
                ? <Minimize2 className="w-[18px] h-[18px]" />
                : <Maximize2 className="w-[18px] h-[18px]" />}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
