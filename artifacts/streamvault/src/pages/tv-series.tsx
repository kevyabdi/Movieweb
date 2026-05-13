import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence, useMotionValue, animate } from "framer-motion";
import { useLocation } from "wouter";
import {
  Play, Info, Star, ChevronRight, Flame, TrendingUp,
  Globe2, Tv2, Users, ChevronLeft, Sparkles, Clapperboard,
  Clock3,
} from "lucide-react";
import { useContentLibrary } from "@/context/ContentLibraryContext";
import { useCategories } from "@/context/CategoriesContext";
import { type MediaItem } from "@/data/content";
import { cn } from "@/lib/utils";

const STATIC_TABS = [
  { id: "all",      label: "All",      icon: Tv2 },
  { id: "trending", label: "Trending", icon: TrendingUp },
  { id: "popular",  label: "Popular",  icon: Flame },
];

/* ─── Helpers ─────────────────────────────────────────── */
function ratingColor(r: string) {
  const v = parseFloat(r);
  if (v >= 8.5) return "text-emerald-400";
  if (v >= 7.5) return "text-amber-400";
  return "text-orange-400";
}

function SeasonsBadge({ n }: { n?: number }) {
  if (!n) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-white/50 bg-white/[0.08] border border-white/10 px-1.5 py-0.5 rounded-md">
      <Clock3 className="w-2.5 h-2.5" /> {n}S
    </span>
  );
}

/* ═══════════════════════════════════════════════════════
   CINEMATIC HERO
═══════════════════════════════════════════════════════ */
function CinematicHero({ slides, onNavigate }: { slides: MediaItem[]; onNavigate: (id: string) => void }) {
  const [idx, setIdx] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hero = slides[idx] ?? slides[0];

  const dragX = useMotionValue(0);
  const pointerStartX = useRef(0);
  const trackStartX = useRef(0);
  const isPointerDown = useRef(false);

  const go = (next: number) => setIdx(next);

  useEffect(() => {
    if (slides.length === 0) return;
    intervalRef.current = setInterval(() => {
      setIdx(i => (i + 1) % slides.length);
    }, 7000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [slides.length]);

  const restart = (next: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    go(next);
    intervalRef.current = setInterval(() => {
      setIdx(i => (i + 1) % slides.length);
    }, 7000);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isPointerDown.current = true;
    pointerStartX.current = e.clientX;
    trackStartX.current = dragX.get();
    if (intervalRef.current) clearInterval(intervalRef.current);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDown.current) return;
    const delta = e.clientX - pointerStartX.current;
    dragX.set(trackStartX.current + delta * 0.3);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDown.current) return;
    isPointerDown.current = false;
    const delta = e.clientX - pointerStartX.current;
    animate(dragX, 0, { type: "spring", stiffness: 380, damping: 32 });
    if (delta < -55) restart((idx + 1) % slides.length);
    else if (delta > 55) restart((idx - 1 + slides.length) % slides.length);
    else {
      intervalRef.current = setInterval(() => {
        setIdx(i => (i + 1) % slides.length);
      }, 7000);
    }
  };

  if (!hero) return null;

  return (
    <div
      className="relative w-full overflow-hidden lg:-mt-16"
      style={{ height: "62vw", maxHeight: 580, minHeight: 300 }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* ── Backdrop slides ── */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={hero.id}
          className="absolute inset-0"
          style={{ x: dragX }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <img
            src={hero.backdropUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-top"
          />
        </motion.div>
      </AnimatePresence>

      {/* ── Gradient layers ── */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent z-[1]" />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent z-[1]" />

      {/* ── Desktop thumbnail strip (top-right) ── */}
      <div className="absolute top-6 right-6 lg:top-20 hidden lg:flex flex-col gap-2 z-10">
        {slides.map((s, i) => (
          <motion.button
            key={s.id}
            onClick={() => restart(i)}
            whileHover={{ scale: 1.06 }}
            className={cn(
              "relative w-24 h-14 rounded-xl overflow-hidden border-2 transition-all duration-300",
              i === idx
                ? "border-white/80 shadow-lg shadow-black/60"
                : "border-white/10 opacity-45 hover:opacity-75 hover:border-white/30"
            )}
          >
            <img src={s.backdropUrl} alt={s.title} className="w-full h-full object-cover" />
            {i === idx && (
              <div className="absolute inset-0 bg-white/10 rounded-xl" />
            )}
          </motion.button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="absolute inset-0 z-10 flex flex-col justify-end pb-10 lg:pb-16 px-5 lg:px-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={hero.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.45 }}
            className="max-w-sm lg:max-w-2xl"
          >
            {/* Category label */}
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/50 mb-2 flex items-center gap-1.5">
              <Tv2 className="w-3 h-3" /> TV Series
            </p>

            {/* Title */}
            <h1
              className="text-[38px] lg:text-[66px] font-black text-white tracking-tight leading-[0.92] mb-3"
              style={{ textShadow: "0 4px 32px rgba(0,0,0,0.7)" }}
            >
              {hero.title}
            </h1>

            {/* Compact metadata strip */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="flex items-center gap-1 text-amber-400 font-bold text-[13px]">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                {hero.rating}
              </span>
              <span className="text-white/20 text-[12px]">·</span>
              <span className="text-white/60 text-[12px] font-medium">{hero.genre}</span>
              <span className="text-white/20 text-[12px]">·</span>
              <span className="text-white/45 text-[12px]">{hero.year}</span>
              {hero.seasons && (
                <>
                  <span className="text-white/20 text-[12px]">·</span>
                  <span className="text-white/45 text-[12px]">{hero.seasons} Season{hero.seasons > 1 ? "s" : ""}</span>
                </>
              )}
              {hero.director && (
                <>
                  <span className="text-white/20 text-[12px] hidden lg:inline">·</span>
                  <span className="text-white/35 text-[12px] hidden lg:inline">{hero.director}</span>
                </>
              )}
            </div>

            {/* Description */}
            <p className="text-[13px] lg:text-[14px] text-white/60 mb-5 leading-relaxed line-clamp-2 max-w-[340px] lg:max-w-[480px]">
              {hero.description}
            </p>

            {/* CTAs */}
            <div className="flex items-center gap-2.5">
              <motion.button
                onClick={() => onNavigate(hero.id)}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black text-[12px] font-semibold hover:bg-white/92 transition-colors shadow-xl shadow-black/40"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Play Now
              </motion.button>
              <motion.button
                onClick={() => onNavigate(hero.id)}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/[0.1] border border-white/15 text-white text-[12px] font-semibold hover:bg-white/[0.16] transition-colors backdrop-blur-sm"
              >
                <Info className="w-3.5 h-3.5" /> More Info
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Mobile slide dots — centered at bottom ── */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10 lg:hidden">
        {slides.map((_, i) => (
          <motion.button
            key={i}
            onClick={() => restart(i)}
            animate={{
              width: i === idx ? 20 : 5,
              backgroundColor: i === idx ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.25)",
            }}
            transition={{ duration: 0.3 }}
            className="h-1.5 rounded-full"
          />
        ))}
      </div>

      {/* ── Prev / Next arrows (desktop) ── */}
      <button
        onClick={() => restart((idx - 1 + slides.length) % slides.length)}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 hidden lg:flex w-10 h-10 items-center justify-center rounded-full bg-white/[0.07] border border-white/10 hover:bg-white/[0.14] transition-colors backdrop-blur-md"
      >
        <ChevronLeft className="w-4 h-4 text-white/70" />
      </button>
      <button
        onClick={() => restart((idx + 1) % slides.length)}
        className="absolute right-4 lg:right-[calc(6.5rem+1rem)] top-1/2 -translate-y-1/2 z-10 hidden lg:flex w-10 h-10 items-center justify-center rounded-full bg-white/[0.07] border border-white/10 hover:bg-white/[0.14] transition-colors backdrop-blur-md"
      >
        <ChevronRight className="w-4 h-4 text-white/70" />
      </button>

      {/* ── Bottom fade into page ── */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent z-[2] pointer-events-none" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SERIES CARD — landscape (redesigned)
═══════════════════════════════════════════════════════ */
function SeriesCard({ item, rank }: { item: MediaItem; rank?: number }) {
  const [, navigate] = useLocation();

  return (
    <motion.div
      className="shrink-0 w-[172px] md:w-[196px] lg:w-[220px] group cursor-pointer"
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      onClick={() => navigate(`/movie/${item.id}`)}
    >
      {/* Thumbnail */}
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-foreground/[0.06] shadow-md group-hover:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.8)] transition-shadow duration-500">
        <img
          src={item.backdropUrl}
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.08]"
          loading="lazy"
        />

        {/* Dark overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-[400ms]" />

        {/* Rank number */}
        {rank !== undefined && (
          <div className="absolute top-2.5 left-2.5 z-10">
            <span className="text-[28px] font-black text-white/20 leading-none select-none"
              style={{ WebkitTextStroke: "1px rgba(255,255,255,0.15)" }}>
              {rank}
            </span>
          </div>
        )}

        {/* Top-right badges */}
        <div className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1.5 z-10">
          {item.quality && (
            <span className={cn(
              "text-[9px] font-bold px-1.5 py-0.5 rounded-md tracking-wide backdrop-blur-sm",
              item.quality === "4K" ? "bg-white text-black" : "bg-white/15 text-white border border-white/20"
            )}>{item.quality}</span>
          )}
          <SeasonsBadge n={item.seasons} />
        </div>

        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <motion.div
            className="w-12 h-12 rounded-full bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center shadow-lg opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-[350ms]"
          >
            <Play className="w-[18px] h-[18px] text-white fill-white ml-0.5" />
          </motion.div>
        </div>

        {/* Bottom info overlay (hover) */}
        <div className="absolute bottom-0 left-0 right-0 p-3 z-10 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-[350ms]">
          <div className="flex items-center gap-1.5">
            <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
            <span className={cn("text-[11px] font-black", ratingColor(item.rating))}>{item.rating}</span>
            <span className="text-[10px] text-white/40 ml-1">{item.genre}</span>
          </div>
          <p className="text-[10px] text-white/50 line-clamp-1 mt-0.5 leading-tight">{item.description}</p>
        </div>

        {/* Ring */}
        <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/8 group-hover:ring-white/25 transition-all duration-[400ms] pointer-events-none" />
      </div>

      {/* Below-card info */}
      <div className="mt-2.5 px-0.5 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-foreground/90 line-clamp-1 leading-tight group-hover:text-foreground transition-colors">{item.title}</p>
          <p className="text-[10px] text-foreground/35 mt-0.5 font-medium">{item.year}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0 mt-0.5">
          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
          <span className="text-[11px] font-bold text-foreground/60">{item.rating}</span>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   PORTRAIT CARD (for popular grid)
═══════════════════════════════════════════════════════ */
function PortraitCard({ item }: { item: MediaItem }) {
  const [, navigate] = useLocation();

  return (
    <motion.div
      className="shrink-0 w-[148px] md:w-[165px] lg:w-[182px] group cursor-pointer"
      whileHover={{ y: -5, scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      onClick={() => navigate(`/movie/${item.id}`)}
    >
      <div className="relative w-full aspect-[2/3] rounded-2xl overflow-hidden bg-foreground/[0.07] shadow-md group-hover:shadow-[0_18px_48px_-8px_rgba(0,0,0,0.75)] transition-shadow duration-500">
        <img
          src={item.posterUrl}
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.08]"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-[400ms]" />

        {/* Play icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-[350ms] shadow-lg">
            <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
          </div>
        </div>

        {/* Quality badge */}
        {item.quality && (
          <div className="absolute top-2 left-2">
            <span className={cn(
              "text-[9px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-sm",
              item.quality === "4K" ? "bg-white text-black" : "bg-white/15 text-white border border-white/20"
            )}>{item.quality}</span>
          </div>
        )}

        {/* Seasons chip */}
        <div className="absolute bottom-2 right-2">
          <SeasonsBadge n={item.seasons} />
        </div>

        <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/8 group-hover:ring-white/25 transition-all duration-[400ms] pointer-events-none" />
      </div>
      <p className="mt-2 text-[12px] font-semibold text-foreground/85 line-clamp-1 leading-tight group-hover:text-foreground transition-colors px-0.5">{item.title}</p>
      <div className="flex items-center gap-1 mt-0.5 px-0.5">
        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
        <span className="text-[10px] font-bold text-foreground/50">{item.rating}</span>
        <span className="text-[10px] text-foreground/30 ml-1">{item.year}</span>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   SECTION HEADER
═══════════════════════════════════════════════════════ */
function SectionHeader({
  title, badge, badgeColor, onSeeAll,
}: {
  title: string;
  badge?: string;
  badgeColor?: string;
  onSeeAll?: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-5 lg:px-14 mb-1.5">
      <div className="flex items-center gap-2.5">
        <h2 className="text-[16px] font-black text-foreground tracking-tight">{title}</h2>
        {badge && (
          <span className={cn(
            "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border",
            badgeColor ?? "text-foreground/40 bg-foreground/[0.06] border-border/50"
          )}>{badge}</span>
        )}
      </div>
      {onSeeAll && (
        <motion.button
          onClick={onSeeAll}
          whileHover={{ x: 2 }}
          className="flex items-center gap-0.5 text-[11px] font-semibold text-foreground/35 hover:text-foreground/65 transition-colors"
        >
          See all <ChevronRight className="w-3.5 h-3.5" />
        </motion.button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   LANDSCAPE ROW
═══════════════════════════════════════════════════════ */
function LandscapeRow({
  title, items, badge, badgeColor, onSeeAll, ranked,
}: {
  title: string;
  items: MediaItem[];
  badge?: string;
  badgeColor?: string;
  onSeeAll?: () => void;
  ranked?: boolean;
}) {
  if (items.length === 0) {
    return (
      <motion.section
        className="mb-5"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5 }}
      >
        <SectionHeader title={title} badge="Coming soon" badgeColor="text-foreground/25 bg-transparent border-border/30" />
        <div className="flex gap-4 px-5 lg:px-14 overflow-x-auto no-scrollbar pb-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="shrink-0 w-[200px] md:w-[230px] aspect-video rounded-2xl bg-foreground/[0.04] border border-border/30"
              style={{ opacity: Math.max(0.08, 1 - i * 0.2) }}
            />
          ))}
        </div>
      </motion.section>
    );
  }

  return (
    <motion.section
      className="mb-5"
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <SectionHeader title={title} badge={badge} badgeColor={badgeColor} onSeeAll={onSeeAll} />
      <div
        className="flex gap-4 overflow-x-auto py-2 px-5 lg:px-14 no-scrollbar"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: 18 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.38, delay: Math.min(i * 0.05, 0.3), ease: "easeOut" }}
          >
            <SeriesCard item={item} rank={ranked ? i + 1 : undefined} />
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

/* ═══════════════════════════════════════════════════════
   PORTRAIT ROW
═══════════════════════════════════════════════════════ */
function PortraitRow({
  title, items, badge, badgeColor, onSeeAll,
}: {
  title: string;
  items: MediaItem[];
  badge?: string;
  badgeColor?: string;
  onSeeAll?: () => void;
}) {
  if (items.length === 0) return null;

  return (
    <motion.section
      className="mb-5"
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <SectionHeader title={title} badge={badge} badgeColor={badgeColor} onSeeAll={onSeeAll} />
      <div
        className="flex items-start overflow-x-auto py-2 no-scrollbar pl-5 lg:pl-14"
        style={{ WebkitOverflowScrolling: "touch", gap: 12 }}
      >
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.38, delay: Math.min(i * 0.05, 0.3), ease: "easeOut" }}
          >
            <PortraitCard item={item} />
          </motion.div>
        ))}
        <div className="shrink-0 w-5 lg:w-14" />
      </div>
    </motion.section>
  );
}

/* ═══════════════════════════════════════════════════════
   FEATURED SPOTLIGHT BAND
═══════════════════════════════════════════════════════ */
function SpotlightBand({ items }: { items: MediaItem[] }) {
  const [, navigate] = useLocation();
  const top3 = items.slice(0, 3);

  return (
    <motion.div
      className="mb-5"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center gap-2 mb-1.5 px-5 lg:px-14">
        <h2 className="text-[16px] font-black text-foreground">Critically Acclaimed</h2>
        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border text-amber-400 bg-amber-400/10 border-amber-400/25">
          ★ Top Rated
        </span>
      </div>

      {/* Mobile: compact horizontal scroll */}
      <div className="flex md:hidden gap-3 overflow-x-auto px-5 pb-2 no-scrollbar">
        {top3.map((item, i) => (
          <motion.div
            key={item.id}
            className="relative shrink-0 w-[220px] rounded-2xl overflow-hidden cursor-pointer group"
            style={{ aspectRatio: "16/9" }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.25 }}
            onClick={() => navigate(`/movie/${item.id}`)}
          >
            <img src={item.backdropUrl} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
            <div className="absolute top-2 left-2.5">
              <span className="text-[28px] font-black leading-none text-white/10 select-none" style={{ WebkitTextStroke: "1.5px rgba(255,255,255,0.18)" }}>#{i + 1}</span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-2.5">
              <div className="flex items-center gap-1 mb-0.5">
                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                <span className={cn("text-[10px] font-black", ratingColor(item.rating))}>{item.rating}</span>
                <span className="text-[9px] text-white/35 ml-0.5">{item.genre}</span>
              </div>
              <p className="text-[12px] font-black text-white leading-tight line-clamp-1">{item.title}</p>
            </div>
            <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/8 group-hover:ring-white/20 transition-all pointer-events-none" />
          </motion.div>
        ))}
      </div>

      {/* Desktop: 3-column grid */}
      <div className="hidden md:grid md:grid-cols-3 gap-4 px-5 lg:px-14">
        {top3.map((item, i) => (
          <motion.div
            key={item.id}
            className="relative rounded-2xl overflow-hidden cursor-pointer group"
            style={{ aspectRatio: "16/9" }}
            whileHover={{ scale: 1.025 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.3 }}
            onClick={() => navigate(`/movie/${item.id}`)}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <img src={item.backdropUrl} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/35 to-transparent" />
            <div className="absolute top-3 left-3.5">
              <span className="text-[40px] font-black leading-none text-white/10 select-none" style={{ WebkitTextStroke: "2px rgba(255,255,255,0.14)" }}>#{i + 1}</span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-3.5">
              <div className="flex items-center gap-1.5 mb-1">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span className={cn("text-[11px] font-black", ratingColor(item.rating))}>{item.rating}</span>
                <span className="text-[10px] text-white/35 ml-1">{item.genre}</span>
                {item.seasons && <span className="text-[10px] text-white/35">· {item.seasons}S</span>}
              </div>
              <p className="text-[13px] font-black text-white leading-tight mb-1">{item.title}</p>
              <p className="text-[10px] text-white/40 line-clamp-1 leading-relaxed">{item.description}</p>
              <div className="flex items-center gap-2 mt-2.5">
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(`/movie/${item.id}`); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-black text-[11px] font-semibold hover:bg-white/90 transition-colors shadow-md"
                >
                  <Play className="w-3 h-3 fill-current" /> Play
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(`/movie/${item.id}`); }}
                  className="px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-white text-[11px] font-semibold hover:bg-white/18 transition-colors backdrop-blur-sm"
                >
                  Details
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   GRID CARD — landscape (fills grid cell)
═══════════════════════════════════════════════════════ */
function LandscapeGridCard({ item, rank }: { item: MediaItem; rank?: number }) {
  const [, navigate] = useLocation();
  return (
    <motion.div
      className="group cursor-pointer"
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
      onClick={() => navigate(`/movie/${item.id}`)}
    >
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-foreground/[0.06] shadow-sm group-hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.7)] transition-shadow duration-[400ms]">
        <img
          src={item.backdropUrl}
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-[600ms] group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent opacity-70 group-hover:opacity-100 transition-opacity duration-300" />

        {rank !== undefined && (
          <div className="absolute top-2 left-2.5 z-10">
            <span
              className="text-[22px] font-black leading-none text-white/15 select-none"
              style={{ WebkitTextStroke: "1px rgba(255,255,255,0.18)" }}
            >{rank}</span>
          </div>
        )}

        <div className="absolute top-2 right-2 flex flex-col items-end gap-1 z-10">
          {item.quality && (
            <span className={cn(
              "text-[8px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm",
              item.quality === "4K" ? "bg-white text-black" : "bg-white/15 text-white border border-white/20"
            )}>{item.quality}</span>
          )}
          <SeasonsBadge n={item.seasons} />
        </div>

        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 shadow-lg">
            <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
          </div>
        </div>

        <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/8 group-hover:ring-white/20 transition-all pointer-events-none" />
      </div>

      <div className="mt-2 px-0.5">
        <p className="text-[12px] font-bold text-foreground/90 line-clamp-1 leading-tight group-hover:text-foreground transition-colors">{item.title}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
          <span className="text-[10px] font-bold text-foreground/55">{item.rating}</span>
          <span className="text-[10px] text-foreground/30">{item.year}</span>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   GRID CARD — portrait (fills grid cell)
═══════════════════════════════════════════════════════ */
function PortraitGridCard({ item }: { item: MediaItem }) {
  const [, navigate] = useLocation();
  return (
    <motion.div
      className="group cursor-pointer"
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
      onClick={() => navigate(`/movie/${item.id}`)}
    >
      <div className="relative w-full aspect-[2/3] rounded-xl overflow-hidden bg-foreground/[0.07] shadow-sm group-hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.7)] transition-shadow duration-[400ms]">
        <img
          src={item.posterUrl}
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-[600ms] group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {item.quality && (
          <div className="absolute top-1.5 left-1.5">
            <span className={cn(
              "text-[8px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm",
              item.quality === "4K" ? "bg-white text-black" : "bg-white/15 text-white border border-white/20"
            )}>{item.quality}</span>
          </div>
        )}

        <div className="absolute bottom-1.5 right-1.5">
          <SeasonsBadge n={item.seasons} />
        </div>

        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="w-8 h-8 rounded-full bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300">
            <Play className="w-3 h-3 text-white fill-white ml-0.5" />
          </div>
        </div>

        <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/8 group-hover:ring-white/20 transition-all pointer-events-none" />
      </div>

      <p className="mt-1.5 text-[11px] font-semibold text-foreground/85 line-clamp-1 leading-tight group-hover:text-foreground transition-colors px-0.5">{item.title}</p>
      <div className="flex items-center gap-1 mt-0.5 px-0.5">
        <Star className="w-2 h-2 fill-amber-400 text-amber-400" />
        <span className="text-[9px] font-bold text-foreground/50">{item.rating}</span>
        <span className="text-[9px] text-foreground/28 ml-0.5">{item.year}</span>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   TAB GRID — landscape 2-col mobile, 3-col tablet, 4-col desktop
═══════════════════════════════════════════════════════ */
function LandscapeTabGrid({
  title, items, badge, badgeColor, ranked,
}: {
  title: string;
  items: MediaItem[];
  badge?: string;
  badgeColor?: string;
  ranked?: boolean;
}) {
  if (items.length === 0) {
    return (
      <div className="px-4 lg:px-14 py-10 flex flex-col items-center gap-3 text-foreground/25">
        <Tv2 className="w-10 h-10" />
        <p className="text-sm font-semibold">No titles available yet</p>
      </div>
    );
  }
  return (
    <div className="px-4 lg:px-14 pb-10">
      <div className="flex items-center gap-2.5 mb-5">
        <h2 className="text-[16px] font-black text-foreground">{title}</h2>
        {badge && (
          <span className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border", badgeColor)}>{badge}</span>
        )}
        <span className="ml-auto text-[11px] text-foreground/30 font-medium">{items.length} series</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.4), ease: "easeOut" }}
          >
            <LandscapeGridCard item={item} rank={ranked ? i + 1 : undefined} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   TAB GRID — portrait 3-col mobile, 4-col tablet, 5-col desktop
═══════════════════════════════════════════════════════ */
function PortraitTabGrid({
  title, items, badge, badgeColor,
}: {
  title: string;
  items: MediaItem[];
  badge?: string;
  badgeColor?: string;
}) {
  if (items.length === 0) {
    return (
      <div className="px-4 lg:px-14 py-10 flex flex-col items-center gap-3 text-foreground/25">
        <Tv2 className="w-10 h-10" />
        <p className="text-sm font-semibold">No titles available yet</p>
      </div>
    );
  }
  return (
    <div className="px-4 lg:px-14 pb-10">
      <div className="flex items-center gap-2.5 mb-5">
        <h2 className="text-[16px] font-black text-foreground">{title}</h2>
        {badge && (
          <span className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border", badgeColor)}>{badge}</span>
        )}
        <span className="ml-auto text-[11px] text-foreground/30 font-medium">{items.length} series</span>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.4), ease: "easeOut" }}
          >
            <PortraitGridCard item={item} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SECTION DIVIDER
═══════════════════════════════════════════════════════ */
function Divider() {
  return <div className="h-px bg-border/30 mx-5 lg:mx-14 mb-5" />;
}

/* ═══════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════ */
export default function TvSeries() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("all");
  const { tvSeries } = useContentLibrary();
  const { categories } = useCategories();

  const byRating       = useMemo(() => [...tvSeries].sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating)), [tvSeries]);
  const byYear         = useMemo(() => [...tvSeries].sort((a, b) => parseInt(b.year) - parseInt(a.year)), [tvSeries]);
  const heroSlides     = useMemo(() => byRating.slice(0, 5), [byRating]);
  const popularSeries  = byRating;
  const trendingSeries = byYear;
  const koreanSeries   = useMemo(() => tvSeries.filter(s => s.tags?.includes("Korean")), [tvSeries]);
  const britishSeries  = useMemo(() => tvSeries.filter(s => s.tags?.some(t => ["British", "Royal Family"].includes(t))), [tvSeries]);
  const americanSeries = useMemo(() => tvSeries.filter(s => !s.tags?.some(t => ["Korean","British","Hindi","Indian"].includes(t))), [tvSeries]);
  const kidsSeries     = useMemo(() => tvSeries.filter(s => s.tags?.some(t => ["Kids","Family","Teen","Coming of Age"].includes(t))), [tvSeries]);

  const categorySeriesMap = useMemo(() => {
    const map: Record<string, MediaItem[]> = {};
    for (const cat of categories) {
      map[cat.slug] = tvSeries.filter(s =>
        s.genre?.toLowerCase() === cat.slug.toLowerCase() ||
        s.genre?.toLowerCase() === cat.name.toLowerCase() ||
        (s.tags ?? []).some(t => t.toLowerCase() === cat.slug.toLowerCase() || t.toLowerCase() === cat.name.toLowerCase())
      );
    }
    return map;
  }, [categories, tvSeries]);

  const dynamicTabs = useMemo(() => [
    ...STATIC_TABS,
    ...categories.map(cat => ({ id: `cat-${cat.slug}`, label: cat.name, icon: null, slug: cat.slug })),
  ], [categories]);

  const getCategoryContent = (slug: string) => {
    const items = categorySeriesMap[slug] ?? [];
    const cat = categories.find(c => c.slug === slug);
    const label = cat?.name ?? slug;
    return <LandscapeTabGrid title={`${label} Series`} items={items} badge={label} badgeColor="text-foreground/60 bg-foreground/[0.06] border-border/50" />;
  };

  return (
    <div className="pb-28 lg:pb-12 bg-background">

      {/* ── Cinematic Hero ── */}
      {heroSlides.length > 0 && (
        <CinematicHero slides={heroSlides} onNavigate={id => navigate(`/movie/${id}`)} />
      )}

      {heroSlides.length === 0 && (
        <div className="pt-28 pb-8 px-5 lg:px-14 flex flex-col items-center gap-3 text-foreground/25">
          <Tv2 className="w-12 h-12" />
          <p className="text-base font-semibold">No TV series yet</p>
          <p className="text-sm">Add series through the admin panel to see them here.</p>
        </div>
      )}

      {/* ── Sticky Category Tabs ── */}
      <div className="sticky top-0 lg:top-16 z-30 bg-background/80 backdrop-blur-xl border-b border-border/30">
        <div className="flex gap-1.5 px-4 lg:px-14 py-3 overflow-x-auto no-scrollbar">
          {dynamicTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-semibold transition-all",
                  isActive
                    ? "bg-foreground text-background shadow-md"
                    : "text-foreground/50 hover:text-foreground/80 hover:bg-foreground/[0.07]"
                )}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                {Icon && <Icon className={cn("w-3 h-3", isActive ? "text-background" : "text-foreground/35")} />}
                {tab.label}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── Content body ── */}
      <div className="pt-5">
        <AnimatePresence mode="wait">
          {activeTab === "all" ? (
            <motion.div
              key="all"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {popularSeries.length > 0 && (
                <>
                  <SpotlightBand items={popularSeries} />
                  <Divider />
                </>
              )}

              <LandscapeRow
                title="Trending Now"
                items={trendingSeries}
                badge="🔥 Hot"
                badgeColor="text-orange-400 bg-orange-400/10 border-orange-400/25"
                onSeeAll={() => navigate("/category/new-series")}
                ranked
              />

              <PortraitRow
                title="Popular Series"
                items={popularSeries}
                badge="Popular"
                badgeColor="text-amber-400 bg-amber-400/10 border-amber-400/25"
                onSeeAll={() => navigate("/category/top-rated")}
              />

              {categories.length > 0 && (
                <>
                  <Divider />
                  {categories.map(cat => {
                    const items = categorySeriesMap[cat.slug] ?? [];
                    if (items.length === 0) return null;
                    return (
                      <LandscapeRow
                        key={cat.id}
                        title={cat.name}
                        items={items}
                        badge={cat.name}
                        badgeColor="text-foreground/50 bg-foreground/[0.06] border-border/40"
                        onSeeAll={() => navigate(`/category/${cat.slug}`)}
                      />
                    );
                  })}
                </>
              )}

              {categories.length === 0 && (
                <>
                  <Divider />
                  <LandscapeRow title="Korean Series" items={koreanSeries} badge="K-Drama" badgeColor="text-violet-400 bg-violet-400/10 border-violet-400/25" />
                  <LandscapeRow title="British Series" items={britishSeries} badge="UK" badgeColor="text-sky-400 bg-sky-400/10 border-sky-400/25" />
                  <LandscapeRow title="American Series" items={americanSeries} />
                  <Divider />
                  <LandscapeRow title="Kids & Family" items={kidsSeries} />
                </>
              )}
            </motion.div>
          ) : activeTab === "trending" ? (
            <motion.div
              key="trending"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <LandscapeTabGrid title="Trending Now" items={trendingSeries} badge="Trending" badgeColor="text-sky-400 bg-sky-400/10 border-sky-400/25" ranked />
            </motion.div>
          ) : activeTab === "popular" ? (
            <motion.div
              key="popular"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <PortraitTabGrid title="Most Popular" items={popularSeries} badge="Popular" badgeColor="text-orange-400 bg-orange-400/10 border-orange-400/25" />
            </motion.div>
          ) : activeTab.startsWith("cat-") ? (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {getCategoryContent(activeTab.replace("cat-", ""))}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
