import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence, useMotionValue, animate } from "framer-motion";
import { useLocation } from "wouter";
import {
  Play, Star, Clock, ChevronRight, Info, Flame,
  TrendingUp, Sparkles, Clapperboard, Globe2, Zap,
} from "lucide-react";
import { useContentLibrary } from "@/context/ContentLibraryContext";
import { useCategories } from "@/context/CategoriesContext";
import type { MediaItem } from "@/data/content";
import { MediaCard } from "@/components/ui/media-card";
import { cn } from "@/lib/utils";

const STATIC_FILTERS = [
  { id: "all",    label: "All" },
  { id: "action", label: "Action" },
  { id: "drama",  label: "Drama" },
  { id: "sci-fi", label: "Sci-Fi" },
  { id: "new",    label: "New" },
];

function SectionBadge({ type }: { type: "popular" | "trending" | "new" | "global" | "action" | "drama" | "scifi" | "default" }) {
  const config = {
    popular:  { icon: Flame,       label: "Popular",  cls: "text-orange-400 bg-orange-400/10 border-orange-400/20" },
    trending: { icon: TrendingUp,  label: "Trending", cls: "text-sky-400 bg-sky-400/10 border-sky-400/20" },
    new:      { icon: Sparkles,    label: "New",       cls: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
    global:   { icon: Globe2,      label: "World",     cls: "text-violet-400 bg-violet-400/10 border-violet-400/20" },
    action:   { icon: Zap,         label: "Action",    cls: "text-red-400 bg-red-400/10 border-red-400/20" },
    drama:    { icon: Clapperboard,label: "Drama",     cls: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
    scifi:    { icon: Sparkles,    label: "Sci-Fi",    cls: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20" },
    default:  { icon: null,        label: "",          cls: "" },
  }[type];

  const Icon = config.icon;
  if (!Icon || !config.label) return null;

  return (
    <span className={cn(
      "inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border",
      config.cls
    )}>
      <Icon className="w-2.5 h-2.5" />
      {config.label}
    </span>
  );
}

function ComingSoonRow({ title }: { title: string }) {
  return (
    <section className="mb-9">
      <div className="flex items-center justify-between px-5 lg:px-12 mb-1.5">
        <h2 className="text-[16px] font-bold text-foreground tracking-tight">{title}</h2>
        <span className="text-[10px] text-foreground/25 font-semibold uppercase tracking-widest">Coming soon</span>
      </div>
      <div className="flex gap-3 pl-5 lg:pl-12 overflow-x-auto no-scrollbar pb-2">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="shrink-0 w-[128px] aspect-[2/3] rounded-2xl bg-foreground/[0.04] border border-border/40"
            style={{ opacity: Math.max(0.12, 1 - i * 0.16) }}
          />
        ))}
      </div>
    </section>
  );
}

function MovieRow({
  title,
  items,
  onSeeAll,
  badge,
}: {
  title: string;
  items: MediaItem[];
  onSeeAll?: () => void;
  badge?: "popular" | "trending" | "new" | "global" | "action" | "drama" | "scifi";
}) {
  if (items.length === 0) return <ComingSoonRow title={title} />;

  return (
    <motion.section
      className="mb-9"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className="flex items-center justify-between px-5 lg:px-12 mb-1.5">
        <div className="flex items-center gap-2">
          <h2 className="text-[16px] font-bold text-foreground tracking-tight">{title}</h2>
          {badge && <SectionBadge type={badge} />}
        </div>
        {onSeeAll && (
          <motion.button
            onClick={onSeeAll}
            whileHover={{ x: 2 }}
            className="flex items-center gap-0.5 text-[11px] font-semibold text-foreground/40 hover:text-foreground/70 transition-colors"
          >
            See all <ChevronRight className="w-3.5 h-3.5" />
          </motion.button>
        )}
      </div>
      <div
        className="flex items-start overflow-x-auto py-2 no-scrollbar pl-5 lg:pl-12"
        style={{ WebkitOverflowScrolling: "touch", gap: 12 }}
      >
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            className="shrink-0 w-[128px] md:w-[142px] lg:w-[155px]"
            initial={{ opacity: 0, x: 18 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.38, delay: i * 0.03, ease: "easeOut" }}
          >
            <MediaCard item={item} showQuality />
          </motion.div>
        ))}
        <div className="shrink-0 w-5 lg:w-12" />
      </div>
    </motion.section>
  );
}

function MovieGrid({
  title,
  items,
  badge,
}: {
  title: string;
  items: MediaItem[];
  badge?: "popular" | "trending" | "new" | "global" | "action" | "drama" | "scifi";
}) {
  if (items.length === 0) return <ComingSoonRow title={title} />;

  return (
    <div className="px-5 lg:px-12 pb-8">
      <div className="flex items-center gap-2 mb-2">
        <h2 className="text-[16px] font-bold text-foreground tracking-tight">{title}</h2>
        {badge && <SectionBadge type={badge} />}
        <span className="ml-auto text-[11px] text-foreground/30 font-medium">{items.length} titles</span>
      </div>
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-3 gap-y-6">
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: Math.min(i * 0.04, 0.4), ease: "easeOut" }}
          >
            <MediaCard item={item} showQuality />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default function Movies() {
  const [heroIdx, setHeroIdx] = useState(0);
  const [activeGenre, setActiveGenre] = useState("all");
  const [, navigate] = useLocation();
  const { movies } = useContentLibrary();
  const { categories } = useCategories();

  const allFilters = useMemo(() => {
    const dynamicIds = new Set(STATIC_FILTERS.map(f => f.id));
    const dynamic = categories
      .filter(c => !dynamicIds.has(c.slug))
      .map(c => ({ id: `cat:${c.slug}`, label: c.name }));
    return [...STATIC_FILTERS, ...dynamic];
  }, [categories]);

  const heroSlides     = useMemo(() => [...movies].sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating)).slice(0, 5), [movies]);
  const popularMovies  = useMemo(() => [...movies].sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating)), [movies]);
  const americanMovies = useMemo(() => movies.filter(m => !["Korean", "Hindi", "Bollywood", "Indian", "British"].some(t => m.tags?.includes(t)) && m.director !== "Bong Joon-ho"), [movies]);
  const koreanMovies   = useMemo(() => movies.filter(m => m.tags?.includes("Korean") || m.director === "Bong Joon-ho"), [movies]);
  const hindiMovies    = useMemo(() => movies.filter(m => m.tags?.some(t => ["Hindi", "Bollywood", "Indian"].includes(t))), [movies]);
  const actionMovies   = useMemo(() => movies.filter(m => m.genre === "Action" || m.genre === "Thriller"), [movies]);
  const dramaMovies    = useMemo(() => movies.filter(m => m.genre === "Drama"), [movies]);
  const scifiMovies    = useMemo(() => movies.filter(m => m.genre === "Sci-Fi"), [movies]);
  const newReleases    = useMemo(() => [...movies].sort((a, b) => parseInt(b.year) - parseInt(a.year)), [movies]);

  const categoryMovies = useMemo(() => {
    if (!activeGenre.startsWith("cat:")) return [];
    const slug = activeGenre.slice(4);
    const cat = categories.find(c => c.slug === slug);
    if (!cat) return [];
    const name = cat.name.toLowerCase();
    return movies.filter(m =>
      m.genre.toLowerCase() === name ||
      (m.tags ?? []).some(t => t.toLowerCase() === name)
    );
  }, [activeGenre, categories, movies]);

  const hero = heroSlides[heroIdx] ?? heroSlides[0];

  const heroContainerRef = useRef<HTMLDivElement>(null);
  const heroDragX = useMotionValue(0);
  const heroPointerStartX = useRef(0);
  const heroTrackStartX = useRef(0);
  const heroIsDown = useRef(false);
  const isPaused = useRef(false);

  useEffect(() => {
    if (heroSlides.length === 0) return;
    const id = setInterval(() => {
      if (!isPaused.current) setHeroIdx(i => (i + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(id);
  }, [heroSlides.length]);

  const heroPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    heroIsDown.current = true;
    isPaused.current = true;
    heroPointerStartX.current = e.clientX;
    heroTrackStartX.current = heroDragX.get();
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const heroPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!heroIsDown.current) return;
    const delta = e.clientX - heroPointerStartX.current;
    heroDragX.set(heroTrackStartX.current + delta * 0.3);
  };

  const heroPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!heroIsDown.current) return;
    heroIsDown.current = false;
    isPaused.current = false;
    const delta = e.clientX - heroPointerStartX.current;
    animate(heroDragX, 0, { type: "spring", stiffness: 380, damping: 32 });
    if (delta < -55) setHeroIdx(i => (i + 1) % heroSlides.length);
    else if (delta > 55) setHeroIdx(i => (i - 1 + heroSlides.length) % heroSlides.length);
  };

  if (!hero) return null;

  return (
    <div className="pb-28 lg:pb-10">

      {/* ══════════════════════════════════
          PREMIUM CINEMATIC HERO
      ══════════════════════════════════ */}
      <div
        ref={heroContainerRef}
        className="relative w-full overflow-hidden lg:-mt-16"
        style={{ height: "62vw", minHeight: 300, maxHeight: 580 }}
        onPointerDown={heroPointerDown}
        onPointerMove={heroPointerMove}
        onPointerUp={heroPointerUp}
        onPointerCancel={heroPointerUp}
      >
        {/* Background slides */}
        <AnimatePresence mode="popLayout">
          <motion.div
            key={hero.id}
            className="absolute inset-0"
            style={{ x: heroDragX }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <img src={hero.backdropUrl} alt={hero.title} className="w-full h-full object-cover object-top" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/30 to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,transparent_50%,rgba(0,0,0,0.5)_100%)]" />
          </motion.div>
        </AnimatePresence>

        {/* Thumbnail filmstrip — desktop only */}
        <div className="absolute top-5 right-5 lg:top-20 lg:right-10 hidden lg:flex gap-2 z-10">
          {heroSlides.map((slide, i) => (
            <motion.button
              key={slide.id}
              onClick={() => setHeroIdx(i)}
              className={cn(
                "relative w-14 h-9 rounded-lg overflow-hidden border transition-all duration-300",
                i === heroIdx ? "border-white/70 scale-105 shadow-lg shadow-black/50" : "border-white/15 opacity-50 hover:opacity-75 hover:border-white/30"
              )}
              whileHover={{ scale: i === heroIdx ? 1.05 : 1.08 }}
            >
              <img src={slide.backdropUrl} alt={slide.title} className="w-full h-full object-cover" />
              {i === heroIdx && (
                <motion.div
                  className="absolute inset-0 bg-white/10"
                  layoutId="active-thumb"
                  transition={{ duration: 0.3 }}
                />
              )}
            </motion.button>
          ))}
        </div>

        {/* Hero info */}
        <div className="absolute inset-0 flex items-end pb-9 lg:pb-12 px-5 lg:px-12 z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={hero.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.45 }}
              className="max-w-sm lg:max-w-2xl"
            >
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-orange-400 bg-orange-400/15 border border-orange-400/30 px-2 py-1 rounded-full backdrop-blur-sm">
                  <Flame className="w-2.5 h-2.5" /> Top Rated
                </span>

                {hero.quality && (
                  <span className={cn(
                    "text-[9px] font-bold px-2 py-1 rounded-md backdrop-blur-sm tracking-widest",
                    hero.quality === "4K"
                      ? "bg-white text-black"
                      : hero.quality === "HD"
                      ? "bg-white/15 text-white border border-white/25"
                      : "bg-red-500/90 text-white"
                  )}>{hero.quality}</span>
                )}

                <div className="flex items-center gap-1 bg-amber-400/15 border border-amber-400/25 px-2 py-1 rounded-full backdrop-blur-sm">
                  <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                  <span className="text-[10px] text-amber-400 font-black">{hero.rating}</span>
                </div>

                <span className="text-[10px] text-white/40 font-medium">{hero.genre}</span>
                <span className="w-0.5 h-0.5 rounded-full bg-white/20" />
                <span className="text-[10px] text-white/35">{hero.year}</span>
              </div>

              <h1 className="text-[30px] lg:text-[52px] font-black text-white tracking-tight leading-none mb-2.5 lg:mb-3.5">
                {hero.title}
              </h1>

              <p className="hidden lg:block text-[13px] text-white/40 mb-4 leading-relaxed line-clamp-2 font-light max-w-lg">
                {hero.description}
              </p>

              {hero.director && (
                <p className="hidden lg:flex items-center gap-1.5 text-[11px] text-white/30 mb-5 font-medium">
                  <Clapperboard className="w-3 h-3 text-white/20" />
                  Directed by <span className="text-white/55 font-semibold">{hero.director}</span>
                </p>
              )}

              <div className="flex items-center gap-2.5">
                <motion.button
                  onClick={() => navigate(`/movie/${hero.id}`)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black text-[12px] font-semibold hover:bg-white/92 transition-colors shadow-xl shadow-black/40"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Play Now
                </motion.button>

                <motion.button
                  onClick={() => navigate(`/movie/${hero.id}`)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/[0.1] border border-white/15 text-white text-[12px] font-semibold hover:bg-white/[0.16] transition-colors backdrop-blur-sm"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Info className="w-3.5 h-3.5" /> More Info
                </motion.button>

                {hero.duration && (
                  <div className="hidden lg:flex items-center gap-1.5 text-white/30 ml-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-medium">{hero.duration}</span>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Slide progress indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10 lg:hidden">
          {heroSlides.map((_, i) => (
            <motion.button
              key={i}
              onClick={() => setHeroIdx(i)}
              animate={{
                width: i === heroIdx ? 20 : 5,
                backgroundColor: i === heroIdx ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.25)",
              }}
              transition={{ duration: 0.3 }}
              className="h-1.5 rounded-full"
            />
          ))}
        </div>
      </div>

      {/* ── Genre filter pills ── */}
      <div className="flex gap-2 mt-3 mb-2 py-2 overflow-x-auto no-scrollbar">
        <div className="shrink-0 w-5 lg:w-12" />
        {allFilters.map((f, i) => (
          <motion.button
            key={f.id}
            onClick={() => setActiveGenre(f.id)}
            className={cn(
              "shrink-0 px-4 py-1.5 rounded-full text-[12px] font-semibold transition-all border",
              activeGenre === f.id
                ? "bg-foreground text-background border-foreground shadow-md"
                : "bg-foreground/[0.05] text-foreground/50 border-border/50 hover:bg-foreground/[0.09] hover:text-foreground/70"
            )}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.04 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
          >
            {f.label}
          </motion.button>
        ))}
        <div className="shrink-0 w-5 lg:w-12" />
      </div>

      {/* ── Movie Rows ── */}
      <div className="mt-3">
        <AnimatePresence mode="wait">
          {activeGenre === "all" && (
            <motion.div
              key="all"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <MovieRow title="Popular Right Now"  items={popularMovies}   onSeeAll={() => navigate("/category/top-rated")}         badge="popular" />
              <MovieRow title="New Releases"       items={newReleases}     onSeeAll={() => navigate("/category/featured-tonight")}  badge="new" />
              <MovieRow title="American Movies"    items={americanMovies}  onSeeAll={() => navigate("/category/american")} />
              <MovieRow title="Hindi Movies"       items={hindiMovies}     onSeeAll={() => navigate("/category/hindi")}             badge="global" />
              <MovieRow title="Korean Movies"      items={koreanMovies}    onSeeAll={() => navigate("/category/korean")}            badge="global" />
              <MovieRow title="Action & Thriller"  items={actionMovies}    onSeeAll={() => navigate("/category/action-thriller")}   badge="action" />
              <MovieRow title="Drama"              items={dramaMovies}     onSeeAll={() => navigate("/category/drama")}             badge="drama" />
              <MovieRow title="Sci-Fi"             items={scifiMovies}     onSeeAll={() => navigate("/category/sci-fi")}            badge="scifi" />
            </motion.div>
          )}
          {activeGenre === "action" && (
            <motion.div key="action" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <MovieGrid title="Action & Thriller" items={actionMovies} badge="action" />
            </motion.div>
          )}
          {activeGenre === "drama" && (
            <motion.div key="drama" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <MovieGrid title="Drama" items={dramaMovies} badge="drama" />
            </motion.div>
          )}
          {activeGenre === "sci-fi" && (
            <motion.div key="sci-fi" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <MovieGrid title="Sci-Fi" items={scifiMovies} badge="scifi" />
            </motion.div>
          )}
          {activeGenre === "new" && (
            <motion.div key="new" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <MovieGrid title="New Releases" items={newReleases} badge="new" />
            </motion.div>
          )}
          {activeGenre.startsWith("cat:") && (
            <motion.div key={activeGenre} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <MovieGrid
                title={allFilters.find(f => f.id === activeGenre)?.label ?? "Category"}
                items={categoryMovies}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
