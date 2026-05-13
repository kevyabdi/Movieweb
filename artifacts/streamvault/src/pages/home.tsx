import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence, useMotionValue, animate } from "framer-motion";
import { Play, Plus, Check, ChevronRight, ExternalLink } from "lucide-react";
import { useLocation } from "wouter";
import { LandscapeCard } from "@/components/ui/landscape-card";
import { MediaCard } from "@/components/ui/media-card";
import { useWatchHistory } from "@/context/WatchHistoryContext";
import { useMyList } from "@/context/MyListContext";
import { useContentLibrary } from "@/context/ContentLibraryContext";
import { useBanners, type Banner } from "@/context/BannersContext";
import { cn } from "@/lib/utils";
import type { MediaItem } from "@/data/content";

type HeroSlide =
  | { kind: "media"; item: MediaItem }
  | { kind: "banner"; banner: Banner };

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const fadeSlideUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] } },
};

function TrendingRow({ items }: { items: MediaItem[] }) {
  const [, navigate] = useLocation();

  return (
    <motion.section
      className="mb-8"
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className="flex items-center justify-between px-5 lg:px-12 mb-1.5">
        <div className="flex items-center gap-2">
          <h2 className="text-[16px] font-bold text-foreground tracking-tight">Trending Now</h2>
          <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-orange-400 bg-orange-400/10 border border-orange-400/20 px-2 py-0.5 rounded-full">
            🔥 Hot
          </span>
        </div>
        <motion.button
          onClick={() => navigate("/category/top-rated")}
          className="flex items-center gap-0.5 text-[12px] font-semibold text-foreground/40 hover:text-foreground/70 transition-colors active:scale-95"
          whileHover={{ x: 2 }}
          transition={{ duration: 0.2 }}
        >
          See all <ChevronRight className="w-3.5 h-3.5" />
        </motion.button>
      </div>
      <div
        className="flex items-start overflow-x-auto py-2 no-scrollbar pl-5 lg:pl-12"
        style={{ WebkitOverflowScrolling: "touch", gap: 0 }}
      >
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            className="relative shrink-0 flex items-end"
            style={{ width: 155, marginRight: 12 }}
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.42, ease: "easeOut", delay: Math.min(i * 0.05, 0.35) }}
          >
            <span
              className="absolute bottom-0 left-0 select-none font-black leading-none z-0"
              style={{
                fontSize: "3.5rem",
                lineHeight: 1,
                letterSpacing: "-0.04em",
                WebkitTextStroke: "2px rgba(255,255,255,0.15)",
                color: "transparent",
              }}
            >
              {i + 1}
            </span>
            <div className="relative z-10 ml-7 w-[118px]">
              <MediaCard item={item} showQuality />
            </div>
          </motion.div>
        ))}
        <div className="shrink-0 w-5 lg:w-12" />
      </div>
    </motion.section>
  );
}

function ContentRow({
  title,
  items,
  showQuality = false,
  onSeeAll,
  delay = 0,
}: {
  title: string;
  items: MediaItem[];
  showQuality?: boolean;
  onSeeAll: () => void;
  delay?: number;
}) {
  if (items.length === 0) return null;

  return (
    <motion.section
      className="mb-8"
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94], delay }}
    >
      <div className="flex items-center justify-between px-5 lg:px-12 mb-1.5">
        <h2 className="text-[16px] font-bold text-foreground tracking-tight">{title}</h2>
        <motion.button
          onClick={onSeeAll}
          className="flex items-center gap-0.5 text-[12px] font-semibold text-foreground/40 hover:text-foreground/70 transition-colors active:scale-95"
          whileHover={{ x: 2 }}
          transition={{ duration: 0.2 }}
        >
          See all <ChevronRight className="w-3.5 h-3.5" />
        </motion.button>
      </div>
      <div
        className="flex items-start overflow-x-auto py-2 no-scrollbar pl-5 lg:pl-12"
        style={{ WebkitOverflowScrolling: "touch", gap: 12 }}
      >
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            className="shrink-0 w-[130px] md:w-[148px] lg:w-[160px]"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, ease: "easeOut", delay: i * 0.04 }}
          >
            <MediaCard item={item} showQuality={showQuality} />
          </motion.div>
        ))}
        <div className="shrink-0 w-5 lg:w-12" />
      </div>
    </motion.section>
  );
}

export default function Home() {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const trackX = useMotionValue(0);
  const pointerStartX = useRef(0);
  const trackStartX = useRef(0);
  const isPointerDown = useRef(false);

  const [, navigate] = useLocation();
  const { history } = useWatchHistory();
  const { isInList, toggleList } = useMyList();
  const { movies, tvSeries, allContent, featuredContent, trendingContent, mostLikedContent } = useContentLibrary();
  const { banners } = useBanners();

  const heroSlides = useMemo<HeroSlide[]>(() => {
    if (banners.length > 0) {
      return banners.map(b => ({ kind: "banner" as const, banner: b }));
    }
    const featured = featuredContent.slice(0, 5);
    const mediaItems = featured.length > 0 ? featured : movies.slice(0, 5);
    return mediaItems.map(item => ({ kind: "media" as const, item }));
  }, [banners, featuredContent, movies]);

  const currentSlide = heroSlides[current];

  const trendingItems = useMemo(() => {
    const trending = trendingContent.slice(0, 10);
    return trending.length > 0
      ? trending
      : [...allContent].sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating)).slice(0, 10);
  }, [trendingContent, allContent]);

  const topRated = useMemo(
    () => [...allContent].sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating)).slice(0, 10),
    [allContent],
  );

  const mostLikedItems = useMemo(() => {
    const liked = mostLikedContent.slice(0, 10);
    return liked.length > 0 ? liked : topRated;
  }, [mostLikedContent, topRated]);

  const actionItems = useMemo(
    () => allContent.filter(m => m.genre === "Action" || m.genre === "Thriller" || (m.tags ?? []).some(t => t.toLowerCase().includes("action"))).slice(0, 10),
    [allContent],
  );
  const dramaItems = useMemo(
    () => allContent.filter(m => m.genre === "Drama" || (m.tags ?? []).some(t => t.toLowerCase().includes("drama"))).slice(0, 10),
    [allContent],
  );

  const snapTo = useCallback((idx: number) => {
    const w = containerRef.current?.clientWidth ?? window.innerWidth;
    animate(trackX, -idx * w, { type: "spring", stiffness: 300, damping: 32, mass: 0.8 });
    setCurrent(idx);
  }, [trackX]);

  useEffect(() => {
    if (isPaused || heroSlides.length === 0) return;
    const id = setInterval(() => {
      setCurrent(c => {
        const next = (c + 1) % heroSlides.length;
        const w = containerRef.current?.clientWidth ?? window.innerWidth;
        animate(trackX, -next * w, { type: "spring", stiffness: 300, damping: 32, mass: 0.8 });
        return next;
      });
    }, 5000);
    return () => clearInterval(id);
  }, [isPaused, trackX, heroSlides.length]);

  const handlePointerDown = (e: React.PointerEvent<HTMLElement>) => {
    isPointerDown.current = true;
    pointerStartX.current = e.clientX;
    trackStartX.current = trackX.get();
    setIsPaused(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!isPointerDown.current) return;
    const delta = e.clientX - pointerStartX.current;
    const w = containerRef.current?.clientWidth ?? window.innerWidth;
    const raw = trackStartX.current + delta;
    const minX = -(heroSlides.length - 1) * w;
    const clamped = Math.min(0, Math.max(minX, raw));
    const overscroll = raw - clamped;
    trackX.set(clamped + overscroll * 0.18);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLElement>) => {
    if (!isPointerDown.current) return;
    isPointerDown.current = false;
    const delta = e.clientX - pointerStartX.current;
    if (delta < -60 && current < heroSlides.length - 1) snapTo(current + 1);
    else if (delta > 60 && current > 0) snapTo(current - 1);
    else snapTo(current);
    setIsPaused(false);
  };

  if (heroSlides.length === 0 && allContent.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4 text-foreground/30 px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-foreground/[0.06] flex items-center justify-center">
          <Play className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-foreground/50">No content yet</h2>
        <p className="text-sm max-w-xs">Add movies and series through the admin panel to get started.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full pb-28 lg:pb-10">

      <div className="absolute top-4 left-5 z-50 pointer-events-none lg:hidden">
        <img src="/logo.png" alt="Logo" className="h-16 w-auto object-contain" />
      </div>

      {/* ───── Hero Slider ───── */}
      {heroSlides.length > 0 && (
        <section
          ref={containerRef}
          className="relative w-full overflow-hidden select-none lg:-mt-16"
          style={{ height: "65vh", minHeight: 400 }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {/* Slides track */}
          <motion.div
            className="absolute inset-0 flex"
            style={{
              x: trackX,
              width: `${heroSlides.length * 100}%`,
              touchAction: "pan-y",
            }}
            draggable={false}
          >
            {heroSlides.map((slide, i) => {
              const imgSrc = slide.kind === "banner" ? slide.banner.imageUrl : slide.item.backdropUrl;
              const key = slide.kind === "banner" ? `banner-${slide.banner.id}` : slide.item.id;
              return (
                <div
                  key={key}
                  className="relative h-full shrink-0"
                  style={{ width: `${100 / heroSlides.length}%` }}
                >
                  <img
                    src={imgSrc}
                    alt={slide.kind === "banner" ? slide.banner.title : slide.item.title}
                    className="w-full h-full object-cover object-top"
                    draggable={false}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/5" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent" />
                </div>
              );
            })}
          </motion.div>

          {/* Content overlay */}
          {currentSlide && (
            <div className="absolute inset-0 flex items-end pb-10 lg:pb-16 px-6 lg:px-12 z-10 pointer-events-none">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`content-${current}`}
                  variants={staggerContainer}
                  initial="hidden"
                  animate="show"
                  exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
                  className="max-w-lg lg:max-w-2xl pointer-events-auto"
                >
                  {currentSlide.kind === "media" ? (
                    <>
                      <motion.div variants={fadeSlideUp} className="flex items-center gap-2 text-[10px] font-semibold tracking-widest uppercase text-white/40 mb-2.5">
                        <span>{currentSlide.item.type === "movie" ? "Movie" : "Series"}</span>
                        <span className="w-0.5 h-0.5 rounded-full bg-white/25" />
                        <span>{currentSlide.item.year}</span>
                        <span className="w-0.5 h-0.5 rounded-full bg-white/25" />
                        <span>{currentSlide.item.genre}</span>
                        {currentSlide.item.duration && (
                          <>
                            <span className="w-0.5 h-0.5 rounded-full bg-white/25" />
                            <span>{currentSlide.item.duration}</span>
                          </>
                        )}
                        {currentSlide.item.isFeatured && (
                          <>
                            <span className="w-0.5 h-0.5 rounded-full bg-white/25" />
                            <span className="text-amber-400">★ Featured</span>
                          </>
                        )}
                      </motion.div>

                      <motion.h1
                        variants={fadeSlideUp}
                        className="text-3xl lg:text-6xl font-bold text-white mb-3 tracking-tight leading-none"
                      >
                        {currentSlide.item.title}
                      </motion.h1>

                      <motion.p
                        variants={fadeSlideUp}
                        className="text-sm lg:text-base text-white/50 mb-6 max-w-md leading-relaxed font-light line-clamp-2"
                      >
                        {currentSlide.item.description}
                      </motion.p>

                      <motion.div variants={fadeSlideUp} className="flex items-center gap-3">
                        <motion.button
                          onClick={() => navigate(`/movie/${currentSlide.item.id}`)}
                          className="h-11 px-7 rounded-full bg-white hover:bg-white/90 text-black font-semibold text-sm flex items-center gap-2 transition-colors shadow-lg shadow-white/10"
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.97 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Play className="w-3.5 h-3.5 fill-current" /> Play Now
                        </motion.button>
                        <motion.button
                          onClick={() => toggleList(currentSlide.item)}
                          className="h-11 px-7 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium text-sm flex items-center gap-2 backdrop-blur-sm transition-colors border border-white/10"
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.97 }}
                          transition={{ duration: 0.2 }}
                        >
                          {isInList(currentSlide.item.id)
                            ? <><Check className="w-3.5 h-3.5" /> In My List</>
                            : <><Plus className="w-3.5 h-3.5" /> Add to List</>}
                        </motion.button>
                      </motion.div>
                    </>
                  ) : (
                    <>
                      <motion.div variants={fadeSlideUp} className="flex items-center gap-2 text-[10px] font-semibold tracking-widest uppercase text-white/40 mb-2.5">
                        <span className="text-amber-400">★ Featured Banner</span>
                      </motion.div>

                      <motion.h1
                        variants={fadeSlideUp}
                        className="text-3xl lg:text-6xl font-bold text-white mb-3 tracking-tight leading-none"
                      >
                        {currentSlide.banner.title}
                      </motion.h1>

                      {currentSlide.banner.subtitle && (
                        <motion.p
                          variants={fadeSlideUp}
                          className="text-sm lg:text-base text-white/50 mb-6 max-w-md leading-relaxed font-light line-clamp-2"
                        >
                          {currentSlide.banner.subtitle}
                        </motion.p>
                      )}

                      <motion.div variants={fadeSlideUp} className="flex items-center gap-3">
                        {currentSlide.banner.linkUrl && (
                          <motion.a
                            href={currentSlide.banner.linkUrl}
                            className="h-11 px-7 rounded-full bg-white hover:bg-white/90 text-black font-semibold text-sm flex items-center gap-2 transition-colors shadow-lg shadow-white/10"
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.97 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            {currentSlide.banner.buttonLabel || "Learn More"}
                          </motion.a>
                        )}
                      </motion.div>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          )}

          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
            {heroSlides.map((_, i) => (
              <motion.button
                key={i}
                onClick={() => snapTo(i)}
                animate={{
                  width: i === current ? 20 : 6,
                  backgroundColor: i === current ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.3)",
                }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="h-1.5 rounded-full"
              />
            ))}
          </div>
        </section>
      )}

      {/* ───── Continue Watching ───── */}
      {history.length > 0 && (
        <motion.section
          className="pt-7 mb-8"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut", delay: 0.1 }}
        >
          <div className="flex items-center justify-between px-5 lg:px-12 mb-1.5">
            <h2 className="text-[16px] font-bold text-foreground tracking-tight">Continue Watching</h2>
            <span className="text-[11px] font-medium text-foreground/30">{history.length} title{history.length !== 1 ? "s" : ""}</span>
          </div>
          <div
            className="flex items-start overflow-x-auto py-2 no-scrollbar pl-5 lg:pl-12"
            style={{ WebkitOverflowScrolling: "touch", gap: 12 }}
          >
            {history.map(({ item, progress }) => (
              <LandscapeCard key={item.id} item={item} progress={progress} />
            ))}
            <div className="shrink-0 w-5 lg:w-12" />
          </div>
        </motion.section>
      )}

      {/* ───── Content Rows ───── */}
      <ContentRow
        title="Featured Tonight"
        items={featuredContent.length > 0 ? featuredContent.slice(0, 10) : movies.slice(0, 10)}
        showQuality
        onSeeAll={() => navigate("/category/featured-tonight")}
        delay={0}
      />
      <TrendingRow items={trendingItems} />
      <ContentRow
        title="Top Rated"
        items={topRated}
        showQuality
        onSeeAll={() => navigate("/category/top-rated")}
        delay={0.05}
      />
      {mostLikedItems.length > 0 && mostLikedItems !== topRated && (
        <ContentRow
          title="Most Liked"
          items={mostLikedItems}
          showQuality
          onSeeAll={() => navigate("/category/most-liked")}
          delay={0.05}
        />
      )}
      <ContentRow title="New Series" items={tvSeries.slice(0, 10)} onSeeAll={() => navigate("/category/new-series")} delay={0.05} />
      {actionItems.length > 0 && (
        <ContentRow title="Action & Thriller" items={actionItems} showQuality onSeeAll={() => navigate("/category/action-thriller")} delay={0.05} />
      )}
      {dramaItems.length > 0 && (
        <ContentRow title="Drama" items={dramaItems} showQuality onSeeAll={() => navigate("/category/drama")} delay={0.05} />
      )}
    </div>
  );
}
