import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { Search as SearchIcon, X, Star, Film, Tv, ArrowLeft } from "lucide-react";
import { useContentLibrary } from "@/context/ContentLibraryContext";
import { cn } from "@/lib/utils";

const GENRE_SLUG: Record<string, string> = {
  "Drama":    "drama",
  "Sci-Fi":   "sci-fi",
  "Action":   "action",
  "Thriller": "thriller",
  "Comedy":   "comedy",
  "Horror":   "horror",
  "Romance":  "romance",
  "Fantasy":  "fantasy",
};

const allGenresRaw = ["Drama", "Sci-Fi", "Action", "Thriller", "Comedy", "Horror", "Romance", "Fantasy"];

export default function Search() {
  const [query, setQuery] = useState("");
  const [, navigate] = useLocation();
  const { movies, allContent } = useContentLibrary();

  const genreBackdrops = useMemo<Record<string, string>>(() => ({
    "Drama":    movies.find(m => m.genre === "Drama")?.backdropUrl ?? "",
    "Sci-Fi":   movies.find(m => m.genre === "Sci-Fi")?.backdropUrl ?? "",
    "Action":   movies.find(m => m.genre === "Action")?.backdropUrl ?? "",
    "Thriller": allContent.find(m => m.genre === "Thriller")?.backdropUrl ?? "",
    "Comedy":   movies.find(m => m.genre === "Comedy")?.backdropUrl ?? "",
    "Horror":   movies.find(m => m.genre === "Horror")?.backdropUrl ?? "",
  }), [movies, allContent]);

  const allGenres = useMemo(
    () => allGenresRaw.filter(g => allContent.some(m => m.genre === g)),
    [allContent],
  );

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return allContent.filter(item =>
      item.title.toLowerCase().includes(q) ||
      item.genre.toLowerCase().includes(q) ||
      (item.tags ?? []).some(t => t.toLowerCase().includes(q))
    );
  }, [query, allContent]);

  const isSearching = query.trim().length > 0;

  return (
    <div className="pb-28 lg:pb-10">

      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-3 px-5 lg:px-12 py-4 lg:py-5 max-w-screen-2xl mx-auto">
          <button
            onClick={() => window.history.back()}
            className="w-9 h-9 rounded-full bg-foreground/[0.07] hover:bg-foreground/[0.13] flex items-center justify-center transition-colors active:scale-90 shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </button>
          <h1 className="text-base lg:text-xl font-bold text-foreground leading-tight">Search</h1>
        </div>
      </div>

      <div className="px-5 lg:px-12 pt-6">

        {/* ── Search bar ── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="mb-6 lg:max-w-2xl"
        >
          <div className="relative group">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/35 group-focus-within:text-foreground/65 transition-colors duration-300 pointer-events-none" />
            <input
              data-testid="input-search"
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Movies, series, genres…"
              className="w-full bg-foreground/[0.06] border border-border rounded-2xl py-3.5 pl-11 pr-11 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-1 focus:ring-foreground/25 focus:border-foreground/20 focus:bg-foreground/[0.09] transition-all duration-300"
            />
            <AnimatePresence>
              {query && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.7, rotate: -45 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.7, rotate: 45 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  onClick={() => setQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-foreground/10 flex items-center justify-center text-foreground/50 hover:text-foreground hover:bg-foreground/20 transition-all"
                >
                  <X className="w-3 h-3" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {!isSearching ? (
            /* ── Browse by genre ── */
            <motion.div
              key="browse"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-[10px] font-bold tracking-widest uppercase text-foreground/30 mb-3">Browse by Genre</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {allGenres.map((genre, i) => {
                  const backdrop = genreBackdrops[genre];
                  const count = allContent.filter(m => m.genre === genre).length;
                  return (
                    <motion.button
                      key={genre}
                      initial={{ opacity: 0, y: 16, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.4, delay: i * 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
                      whileHover={{ scale: 1.04, y: -3 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => navigate(`/category/${GENRE_SLUG[genre] ?? genre.toLowerCase()}`)}
                      className="relative rounded-2xl overflow-hidden text-left border border-border group shadow-sm hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.6)] transition-shadow duration-[400ms]"
                      style={{ height: 100 }}
                    >
                      {backdrop ? (
                        <>
                          <img src={backdrop} alt={genre} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-55 group-hover:scale-110 transition-all duration-500 ease-out" />
                          <div className="absolute inset-0 bg-gradient-to-br from-black/75 via-black/50 to-black/20 group-hover:from-black/65 transition-colors duration-[400ms]" />
                        </>
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-foreground/[0.08] to-foreground/[0.03]" />
                      )}
                      <div className="relative p-4 h-full flex flex-col justify-between">
                        <p className="text-sm font-bold text-white leading-none drop-shadow">{genre}</p>
                        <p className="text-[10px] text-white/60 font-medium drop-shadow">{count} title{count !== 1 ? "s" : ""}</p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          ) : results.length === 0 ? (
            /* ── No results ── */
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center py-24 text-center"
            >
              <SearchIcon className="w-10 h-10 text-foreground/12 mb-3" />
              <p className="text-sm font-semibold text-foreground/35">No results for</p>
              <p className="text-sm text-foreground/20 mt-0.5">"{query}"</p>
            </motion.div>
          ) : (
            /* ── Results ── */
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <p className="text-[10px] font-bold tracking-widest uppercase text-foreground/30 mb-3">
                {results.length} Result{results.length !== 1 ? "s" : ""}
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-1">
                {results.map((item, i) => (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: -14, y: 4 }}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    transition={{ duration: 0.35, delay: i * 0.04, ease: [0.25, 0.46, 0.45, 0.94] }}
                    whileHover={{ x: 4, backgroundColor: "rgba(255,255,255,0.04)" }}
                    onClick={() => navigate(`/movie/${item.id}`)}
                    className="w-full flex items-center gap-3.5 p-2.5 rounded-xl hover:bg-foreground/[0.05] active:bg-foreground/[0.08] transition-colors text-left group"
                  >
                    <div className="shrink-0 w-12 h-[72px] rounded-lg overflow-hidden bg-foreground/[0.05] border border-border group-hover:border-foreground/20 transition-colors duration-300">
                      <img src={item.posterUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[400ms] ease-out" loading="lazy" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground leading-tight line-clamp-1 group-hover:text-foreground/80 transition-colors">
                        {item.title}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        {item.type === "movie"
                          ? <Film className="w-2.5 h-2.5 text-foreground/30" />
                          : <Tv className="w-2.5 h-2.5 text-foreground/30" />}
                        <span className="text-[10px] text-foreground/35 font-medium capitalize">
                          {item.type === "movie" ? "Movie" : "Series"}
                        </span>
                        <span className="w-0.5 h-0.5 rounded-full bg-foreground/20" />
                        <span className="text-[10px] text-foreground/35">{item.genre}</span>
                        <span className="w-0.5 h-0.5 rounded-full bg-foreground/20" />
                        <span className="text-[10px] text-foreground/25">{item.year}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                        <span className="text-[10px] text-foreground/50 font-semibold">{item.rating}</span>
                      </div>
                    </div>
                    {item.quality && (
                      <span className={cn(
                        "shrink-0 text-[8px] font-bold px-1.5 py-0.5 rounded",
                        item.quality === "4K" ? "bg-foreground text-background" : "bg-foreground/10 text-foreground border border-border"
                      )}>{item.quality}</span>
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
