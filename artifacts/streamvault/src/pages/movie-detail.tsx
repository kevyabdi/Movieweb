import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useLocation, Link } from "wouter";
import { Play, Plus, Check, Star, Clock, Calendar, Tv, ChevronRight, ChevronLeft, Pause, ChevronDown, Home, Link2 } from "lucide-react";
import { useContentLibrary } from "@/context/ContentLibraryContext";
import { getEpisodes } from "@/data/episodes";
import type { Episode } from "@/data/episodes";
import { useListSeasons, useListEpisodes, getListSeasonsQueryKey, getListEpisodesQueryKey } from "@workspace/api-client-react";
import { VideoPlayer } from "@/components/ui/video-player";
import { MediaCard } from "@/components/ui/media-card";
import { useWatchHistory } from "@/context/WatchHistoryContext";
import { useMyList } from "@/context/MyListContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function MovieDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [showPlayer, setShowPlayer] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [copied, setCopied] = useState(false);
  const { addToHistory } = useWatchHistory();
  const { isInList, toggleList } = useMyList();
  const { toast } = useToast();
  const { allContent, movies, tvSeries } = useContentLibrary();

  const item = allContent.find(m => m.id === params.id);

  const isApiSeries = !!item && item.type === "tv" && item.id.startsWith("api-series-");
  const numericSeriesId = isApiSeries ? parseInt(item.id.replace("api-series-", ""), 10) : 0;

  const { data: apiSeasons = [] } = useListSeasons(numericSeriesId, {
    query: { enabled: isApiSeries && numericSeriesId > 0, staleTime: 30_000, queryKey: getListSeasonsQueryKey(numericSeriesId) },
  });

  const selectedSeasonObj = apiSeasons.find(s => s.seasonNumber === selectedSeason);
  const selectedSeasonId = selectedSeasonObj?.id ?? 0;

  const { data: apiEpisodesRaw = [] } = useListEpisodes(selectedSeasonId, {
    query: { enabled: isApiSeries && selectedSeasonId > 0, staleTime: 30_000, queryKey: getListEpisodesQueryKey(selectedSeasonId) },
  });

  useEffect(() => {
    if (item) addToHistory(item);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id]);

  if (!item) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-foreground/40">Content not found.</p>
      </div>
    );
  }

  const inList = isInList(item.id);
  const isSeries = item.type === "tv";
  const totalSeasons = item.seasons ?? 1;

  const apiEpisodes: Episode[] = apiEpisodesRaw
    .slice()
    .sort((a, b) => a.episodeNumber - b.episodeNumber)
    .map(ep => ({
      seasonNumber: selectedSeason,
      episodeNumber: ep.episodeNumber,
      title: ep.title,
      duration: ep.duration ?? "45m",
      description: ep.description ?? "",
    }));

  const staticEpisodes = isSeries && !isApiSeries ? getEpisodes(item.id, totalSeasons) : [];
  const episodes = isApiSeries ? apiEpisodes : staticEpisodes;
  const seasonEpisodes = isApiSeries ? episodes : episodes.filter(ep => ep.seasonNumber === selectedSeason);

  const GENRE_SLUG: Record<string, string> = {
    "Drama": "drama", "Sci-Fi": "sci-fi", "Action": "action",
    "Thriller": "thriller", "Comedy": "comedy", "Horror": "horror",
    "Romance": "romance", "Fantasy": "fantasy",
  };
  const genreSlug = GENRE_SLUG[item.genre] ?? "top-rated";

  const allOther = [...movies, ...tvSeries].filter(m => m.id !== item.id);
  const sameGenre = allOther.filter(m => m.genre === item.genre);
  const otherGenre = allOther.filter(m => m.genre !== item.genre);
  const related = [...sameGenre, ...otherGenre].slice(0, 8);

  const handleWatch = (episode?: Episode) => {
    if (episode) setCurrentEpisode(episode);
    setShowPlayer(true);
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
  };

  const handleShare = async () => {
    const url = window.location.href;

    const markCopied = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Link copied!", description: "Shareable link copied to clipboard." });
    };

    const execCommandFallback = () => {
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    };

    if (navigator.share) {
      try { await navigator.share({ title: item?.title, url }); return; } catch { /* user cancelled or not supported */ }
    }

    try {
      await navigator.clipboard.writeText(url);
      markCopied();
    } catch {
      if (execCommandFallback()) markCopied();
    }
  };

  const isCurrentEpisode = (ep: Episode) =>
    currentEpisode?.seasonNumber === ep.seasonNumber &&
    currentEpisode?.episodeNumber === ep.episodeNumber;

  return (
    <>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
      className="relative min-h-screen pb-28 bg-background"
    >
      {!showPlayer && (
        <button
          onClick={() => window.history.back()}
          className="absolute top-4 left-4 z-30 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/80 hover:text-white transition-all active:scale-90"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      {/* ── TOP: Player OR Backdrop ── */}
      <AnimatePresence mode="wait">
        {showPlayer ? (
          <motion.div
            key="player"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-1.5 px-5 py-2.5 border-b border-border bg-background/80 backdrop-blur-sm">
              <Link href="/">
                <span className="flex items-center gap-1 text-foreground/40 hover:text-foreground/70 transition-colors cursor-pointer shrink-0">
                  <Home className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-medium">Home</span>
                </span>
              </Link>
              <ChevronRight className="w-3 h-3 text-foreground/15 shrink-0" />
              <Link href={isSeries ? "/tv-series" : "/movies"}>
                <span className="text-[11px] font-medium text-foreground/40 hover:text-foreground/70 transition-colors cursor-pointer shrink-0">
                  {isSeries ? "TV Series" : "Movies"}
                </span>
              </Link>
              <ChevronRight className="w-3 h-3 text-foreground/15 shrink-0" />
              <span className="text-[11px] font-semibold text-foreground/80 truncate">{item.title}</span>
            </div>
            <VideoPlayer item={item} onClose={() => setShowPlayer(false)} />
          </motion.div>
        ) : (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative w-full overflow-hidden cursor-pointer group"
            style={{ height: "52vw", minHeight: 240, maxHeight: 440 }}
            onClick={() => isSeries ? handleWatch(episodes[0]) : handleWatch()}
          >
            <img src={item.backdropUrl} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/10" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="w-16 h-16 rounded-full bg-white/15 border border-white/30 flex items-center justify-center backdrop-blur-sm shadow-2xl group-hover:bg-white/25 transition-colors duration-300"
              >
                <Play className="w-6 h-6 text-white fill-white ml-0.5" />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── DETAILS ── */}
      <div className="px-5 md:px-8 lg:px-16 mt-5 max-w-5xl lg:mx-auto">

        {/* Meta row */}
        <div className="flex items-center gap-2 text-[10px] font-semibold tracking-widest uppercase text-foreground/35 mb-2">
          <span>{isSeries ? "TV Series" : "Movie"}</span>
          <span className="w-0.5 h-0.5 rounded-full bg-foreground/20" />
          <span>{item.year}</span>
          <span className="w-0.5 h-0.5 rounded-full bg-foreground/20" />
          <span>{item.genre}</span>
          {item.quality && (
            <>
              <span className="w-0.5 h-0.5 rounded-full bg-foreground/20" />
              <span className={cn(
                "px-1.5 py-0.5 rounded text-[8px] font-bold",
                item.quality === "4K" ? "bg-foreground text-background" : "bg-foreground/[0.12] text-foreground border border-border"
              )}>{item.quality}</span>
            </>
          )}
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-3 leading-tight">
          {item.title}
          {isSeries && currentEpisode && showPlayer && (
            <span className="block text-base font-normal text-foreground/40 mt-1">
              S{currentEpisode.seasonNumber} E{currentEpisode.episodeNumber} · {currentEpisode.title}
            </span>
          )}
        </h1>

        {/* Stats */}
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="text-sm font-bold text-foreground">{item.rating}</span>
            <span className="text-sm text-foreground/35">/10</span>
          </div>
          {item.duration && (
            <div className="flex items-center gap-1.5 text-sm text-foreground/50">
              <Clock className="w-3.5 h-3.5" />
              <span>{item.duration}</span>
            </div>
          )}
          {item.seasons && (
            <div className="flex items-center gap-1.5 text-sm text-foreground/50">
              <Tv className="w-3.5 h-3.5" />
              <span>{item.seasons} Season{item.seasons > 1 ? "s" : ""}</span>
            </div>
          )}
          {item.year && (
            <div className="flex items-center gap-1.5 text-sm text-foreground/50">
              <Calendar className="w-3.5 h-3.5" />
              <span>{item.year}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {item.tags && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {item.tags.map(tag => (
              <span key={tag} className="px-2.5 py-1 rounded-full bg-foreground/[0.07] border border-border text-[10px] text-foreground/50 font-medium">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Watch Now button */}
        {!showPlayer && (
          <div className="flex gap-3 mb-7 lg:max-w-lg">
            <button
              data-testid="button-watch-now"
              onClick={() => isSeries ? handleWatch(episodes[0]) : handleWatch()}
              className="flex-1 h-12 flex items-center justify-center gap-2 rounded-full bg-foreground text-background font-semibold text-sm transition-all hover:opacity-90 active:scale-95 shadow-lg"
            >
              <Play className="w-4 h-4 fill-current" />
              {isSeries ? "Watch S1 E1" : "Watch Now"}
            </button>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => toggleList(item)}
              className={cn(
                "h-12 w-12 flex items-center justify-center rounded-full border transition-all",
                inList
                  ? "bg-foreground text-background border-foreground"
                  : "bg-foreground/[0.08] border-border text-foreground/70 hover:bg-foreground/[0.15]"
              )}
            >
              {inList ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={handleShare}
              className={cn(
                "h-12 w-12 flex items-center justify-center rounded-full border transition-all",
                copied
                  ? "bg-foreground text-background border-foreground"
                  : "bg-foreground/[0.08] border-border text-foreground/70 hover:bg-foreground/[0.15]"
              )}
              aria-label="Share"
            >
              <AnimatePresence mode="wait" initial={false}>
                {copied ? (
                  <motion.span
                    key="check"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Check className="w-4 h-4" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="link"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Link2 className="w-4 h-4" />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        )}

        {/* Synopsis */}
        {!showPlayer && (
          <>
            <section className="mb-7">
              <SectionLabel>Synopsis</SectionLabel>
              <p className="text-sm text-foreground/60 leading-relaxed font-light">
                {item.longDescription || item.description}
              </p>
            </section>
            {item.director && (
              <section className="mb-7">
                <SectionLabel>{isSeries ? "Creator" : "Director"}</SectionLabel>
                <p className="text-sm text-foreground/70 font-medium">{item.director}</p>
              </section>
            )}
          </>
        )}

        {/* ── EPISODES ── */}
        {isSeries && (
          <section className="mb-8">
            {totalSeasons > 1 && (
              <SeasonDropdown
                totalSeasons={totalSeasons}
                selectedSeason={selectedSeason}
                onChange={setSelectedSeason}
              />
            )}

            <p className="text-[10px] font-bold tracking-widest uppercase text-foreground/35 mb-3 mt-4">
              Episodes · {seasonEpisodes.length}
            </p>

            <AnimatePresence mode="wait">
              <motion.div
                key={selectedSeason}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.22 }}
                className="flex gap-3 overflow-x-auto pb-2 -mx-5 md:-mx-8 px-5 md:px-8 no-scrollbar lg:grid lg:grid-cols-3 lg:gap-4 lg:overflow-x-visible lg:mx-0 lg:px-0 lg:pb-0"
              >
                {seasonEpisodes.map(ep => {
                  const isActive = isCurrentEpisode(ep) && showPlayer;
                  return (
                    <button
                      key={`s${ep.seasonNumber}e${ep.episodeNumber}`}
                      onClick={() => handleWatch(ep)}
                      className="shrink-0 w-[168px] lg:w-full text-left group active:scale-95 transition-transform duration-150"
                    >
                      <div className={cn(
                        "relative w-full rounded-xl overflow-hidden border transition-colors",
                        isActive ? "border-foreground/40" : "border-border"
                      )} style={{ aspectRatio: "16/9" }}>
                        <img src={item.backdropUrl} alt={ep.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/30" />
                        <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-black/80 to-transparent" />
                        <div className="absolute bottom-2 left-2.5">
                          <span className="text-[9px] font-bold tracking-widest uppercase text-white/60">
                            E{ep.episodeNumber}
                          </span>
                        </div>
                        {isActive && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                              <Pause className="w-3.5 h-3.5 text-white fill-white" />
                            </div>
                          </div>
                        )}
                        {!isActive && (
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 flex items-center justify-center">
                              <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-2 px-0.5">
                        <p className={cn(
                          "text-sm font-semibold leading-tight line-clamp-2",
                          isActive ? "text-foreground" : "text-foreground/85"
                        )}>
                          {ep.title}
                        </p>
                        <p className="text-[11px] text-foreground/40 mt-1 font-medium">{ep.duration}</p>
                      </div>
                    </button>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </section>
        )}

        {/* ── Cast ── */}
        {item.cast && item.cast.length > 0 && (
          <section className="mb-8">
            <SectionLabel>Cast</SectionLabel>
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-5 md:-mx-8 px-5 md:px-8 no-scrollbar lg:grid lg:grid-cols-8 lg:gap-3 lg:overflow-x-visible lg:mx-0 lg:px-0 lg:pb-0">
              {item.cast.map((member, i) => (
                <motion.button
                  key={i}
                  onClick={() => navigate(`/actor/${encodeURIComponent(member.name)}`)}
                  className="flex-shrink-0 lg:flex-shrink flex flex-col items-center gap-2 w-[68px] lg:w-full group cursor-pointer"
                  whileTap={{ scale: 0.93 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-foreground/[0.06] border border-border group-hover:border-foreground/30 group-hover:scale-105 transition-all duration-200 ring-0 group-hover:ring-2 group-hover:ring-white/20">
                    <img
                      src={member.avatarUrl}
                      alt={member.name}
                      className="w-full h-full object-cover"
                      onError={e => {
                        const el = e.currentTarget;
                        el.style.display = "none";
                        el.parentElement!.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:rgba(128,128,128,0.6);font-size:18px;font-weight:700">${member.name[0]}</div>`;
                      }}
                    />
                  </div>
                  <p className="text-[10px] font-medium text-foreground/70 group-hover:text-foreground leading-tight line-clamp-2 text-center w-full transition-colors">{member.name}</p>
                  <p className="text-[9px] text-foreground/30 -mt-1 line-clamp-1 text-center w-full">{member.role}</p>
                </motion.button>
              ))}
            </div>
          </section>
        )}

        {/* ── More Like This ── */}
        {related.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <SectionLabel>More Like This</SectionLabel>
              <button
                onClick={() => navigate(`/category/${genreSlug}`)}
                className="flex items-center gap-0.5 text-[10px] text-foreground/35 hover:text-foreground/60 transition-colors active:scale-95"
              >
                See all <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 md:-mx-8 px-5 md:px-8 no-scrollbar lg:grid lg:grid-cols-4 lg:gap-4 lg:overflow-x-visible lg:mx-0 lg:px-0 lg:pb-0">
              {related.map(rel => (
                <div key={rel.id} className="shrink-0 w-[110px] md:w-[130px] lg:w-full">
                  <MediaCard
                    item={rel}
                    showQuality
                    onClick={() => navigate(`/movie/${rel.id}`, { replace: true })}
                  />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </motion.div>

    </>
  );
}

function SeasonDropdown({ totalSeasons, selectedSeason, onChange }: {
  totalSeasons: number;
  selectedSeason: number;
  onChange: (s: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative mb-3 w-48">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-foreground/[0.08] border border-border text-sm font-semibold text-foreground hover:bg-foreground/[0.13] transition-all"
      >
        <span>Season {selectedSeason}</span>
        <ChevronDown className={cn("w-4 h-4 text-foreground/50 transition-transform duration-200", open && "rotate-180")} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full mt-1.5 w-full z-50 rounded-xl bg-card border border-border shadow-2xl overflow-hidden"
          >
            {Array.from({ length: totalSeasons }, (_, i) => i + 1).map(s => (
              <button
                key={s}
                onClick={() => { onChange(s); setOpen(false); }}
                className={cn(
                  "w-full text-left px-4 py-3 text-sm transition-colors",
                  s === selectedSeason
                    ? "text-foreground font-semibold bg-foreground/[0.08]"
                    : "text-foreground/60 hover:text-foreground hover:bg-foreground/[0.05] font-medium"
                )}
              >
                Season {s}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[10px] font-semibold text-foreground/30 uppercase tracking-widest mb-2.5">
      {children}
    </h2>
  );
}
