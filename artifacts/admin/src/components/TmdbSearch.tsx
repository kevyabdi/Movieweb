import { useState, useRef, useEffect, useCallback } from "react";
import { Search, Loader2, ImageOff, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TmdbResult {
  id: number;
  title: string;
  year: string;
  overview: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  rating: string;
  genre: string;
  tmdbId: number;
  voteAverage: number;
}

interface TmdbDetails {
  title: string;
  year: string;
  genre: string;
  description: string;
  longDescription: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  trailerUrl: string;
  director: string;
  rating: string;
  voteAverage: number;
}

interface TmdbSearchProps {
  type: "movie" | "tv";
  onSelect: (data: Partial<{
    title: string;
    year: string;
    genre: string;
    description: string;
    longDescription: string;
    posterUrl: string;
    backdropUrl: string;
    trailerUrl: string;
    director: string;
    rating: string;
  }>) => void;
}

export function TmdbSearch({ type, onSelect }: TmdbSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TmdbResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [noKey, setNoKey] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // Prevents the debounce from re-opening the dropdown after a selection fills the input
  const suppressNextSearchRef = useRef(false);

  const search = useCallback(async (q: string) => {
    if (suppressNextSearchRef.current) {
      suppressNextSearchRef.current = false;
      return;
    }
    if (q.trim().length < 2) { setResults([]); setIsOpen(false); return; }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/tmdb/search?q=${encodeURIComponent(q)}&type=${type}`);
      if (res.status === 503) { setNoKey(true); setIsSearching(false); return; }
      const data = await res.json() as { results: TmdbResult[] };
      setResults(data.results || []);
      setIsOpen(true);
    } catch {
      // silent
    } finally {
      setIsSearching(false);
    }
  }, [type]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, search]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = async (result: TmdbResult) => {
    setIsOpen(false);
    setResults([]);
    suppressNextSearchRef.current = true;
    setQuery(result.title);
    setIsLoadingDetails(true);
    try {
      const res = await fetch(`/api/tmdb/details/${type === "movie" ? "movie" : "tv"}/${result.tmdbId}`);
      if (res.ok) {
        const details = await res.json() as TmdbDetails;
        onSelect({
          title: details.title,
          year: details.year,
          genre: details.genre,
          description: details.description,
          longDescription: String(details.longDescription || ""),
          posterUrl: details.posterUrl || "",
          backdropUrl: details.backdropUrl || "",
          trailerUrl: details.trailerUrl || "",
          director: details.director || "",
          rating: details.rating || "",
        });
      } else {
        onSelect({
          title: result.title,
          year: result.year,
          posterUrl: result.posterUrl || "",
          backdropUrl: result.backdropUrl || "",
          description: result.overview ? result.overview.slice(0, 300) : "",
          longDescription: result.overview || "",
          rating: result.rating || "",
        });
      }
    } catch {
      onSelect({
        title: result.title,
        year: result.year,
        posterUrl: result.posterUrl || "",
        backdropUrl: result.backdropUrl || "",
      });
    } finally {
      setIsLoadingDetails(false);
    }
  };

  if (noKey) {
    return (
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/8 px-4 py-3 text-sm text-amber-400/90">
        <span className="font-medium">TMDB not configured.</span> Add your{" "}
        <code className="font-mono text-xs bg-amber-500/10 rounded px-1">TMDB_API_KEY</code>{" "}
        secret to enable auto-fill from The Movie Database.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4" ref={containerRef}>
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-primary">Auto-fill from TMDB</span>
        {isLoadingDetails && (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary/60 ml-1" />
        )}
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={`Search ${type === "movie" ? "movie" : "TV series"} title…`}
          className="pl-9 bg-background/60 border-border/60 rounded-xl"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}

        {isOpen && results.length > 0 && (
          <div className="absolute z-50 mt-1.5 w-full rounded-xl border border-border bg-popover shadow-xl overflow-hidden">
            {results.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => handleSelect(r)}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-accent transition-colors group"
              >
                <div className="h-12 w-9 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                  {r.posterUrl ? (
                    <img src={r.posterUrl} alt={r.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <ImageOff className="h-4 w-4 text-muted-foreground/40" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate group-hover:text-foreground">
                    {r.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {r.year}{r.voteAverage ? ` · ★ ${Number(r.voteAverage).toFixed(1)}` : ""}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {isOpen && !isSearching && results.length === 0 && query.length >= 2 && (
          <div className="absolute z-50 mt-1.5 w-full rounded-xl border border-border bg-popover px-4 py-5 text-center text-sm text-muted-foreground shadow-xl">
            No results found for "{query}"
          </div>
        )}
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground/60">
        Select a result to auto-fill title, poster, description, and more.
      </p>
    </div>
  );
}
