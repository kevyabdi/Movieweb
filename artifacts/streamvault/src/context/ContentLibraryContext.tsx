import { createContext, useContext, useMemo } from "react";
import { useListMovies, useListSeries } from "@workspace/api-client-react";
import type { MediaItem } from "@/data/content";
import { movieToMediaItem, seriesToMediaItem } from "@/lib/api-transform";

interface ContentLibraryContextValue {
  movies: MediaItem[];
  tvSeries: MediaItem[];
  allContent: MediaItem[];
  featuredContent: MediaItem[];
  trendingContent: MediaItem[];
  mostLikedContent: MediaItem[];
  isLoading: boolean;
}

const ContentLibraryContext = createContext<ContentLibraryContextValue>({
  movies: [],
  tvSeries: [],
  allContent: [],
  featuredContent: [],
  trendingContent: [],
  mostLikedContent: [],
  isLoading: false,
});

function sortByCreatedAtDesc(items: MediaItem[]): MediaItem[] {
  return [...items].sort((a, b) => {
    if (a.createdAt && b.createdAt) return b.createdAt.localeCompare(a.createdAt);
    if (a.createdAt) return -1;
    if (b.createdAt) return 1;
    return 0;
  });
}

export function ContentLibraryProvider({ children }: { children: React.ReactNode }) {
  const { data: apiMoviesRaw, isLoading: loadingMovies } = useListMovies(
    { status: "published" },
    { query: { queryKey: ["/api/movies", { status: "published" }], staleTime: 0, refetchOnWindowFocus: true } },
  );
  const { data: apiSeriesRaw, isLoading: loadingSeries } = useListSeries(
    { status: "published" },
    { query: { queryKey: ["/api/series", { status: "published" }], staleTime: 0, refetchOnWindowFocus: true } },
  );

  const movies = useMemo<MediaItem[]>(() => {
    return (apiMoviesRaw ?? []).map(movieToMediaItem);
  }, [apiMoviesRaw]);

  const tvSeries = useMemo<MediaItem[]>(() => {
    return (apiSeriesRaw ?? []).map(seriesToMediaItem);
  }, [apiSeriesRaw]);

  const allContent = useMemo<MediaItem[]>(() => [...movies, ...tvSeries], [movies, tvSeries]);

  const allContentWithNew = useMemo<MediaItem[]>(() => {
    const sorted = [...allContent].sort((a, b) => {
      if (a.createdAt && b.createdAt) return b.createdAt.localeCompare(a.createdAt);
      if (a.createdAt) return -1;
      if (b.createdAt) return 1;
      return 0;
    });
    const top5Ids = new Set(sorted.slice(0, 5).map(i => i.id));
    return allContent.map(item => ({ ...item, isNew: top5Ids.has(item.id) }));
  }, [allContent]);

  const featuredContent = useMemo<MediaItem[]>(
    () => sortByCreatedAtDesc(allContentWithNew.filter(i => i.isFeatured)),
    [allContentWithNew],
  );

  const trendingContent = useMemo<MediaItem[]>(
    () => sortByCreatedAtDesc(allContentWithNew.filter(i => i.isTrending)),
    [allContentWithNew],
  );

  const mostLikedContent = useMemo<MediaItem[]>(
    () => allContentWithNew.filter(i => i.isMostLiked),
    [allContentWithNew],
  );

  const moviesWithNew = useMemo<MediaItem[]>(
    () => allContentWithNew.filter(i => i.type === "movie"),
    [allContentWithNew],
  );

  const tvSeriesWithNew = useMemo<MediaItem[]>(
    () => allContentWithNew.filter(i => i.type === "tv"),
    [allContentWithNew],
  );

  const value = useMemo<ContentLibraryContextValue>(
    () => ({
      movies: moviesWithNew,
      tvSeries: tvSeriesWithNew,
      allContent: allContentWithNew,
      featuredContent,
      trendingContent,
      mostLikedContent,
      isLoading: loadingMovies || loadingSeries,
    }),
    [moviesWithNew, tvSeriesWithNew, allContentWithNew, featuredContent, trendingContent, mostLikedContent, loadingMovies, loadingSeries],
  );

  return (
    <ContentLibraryContext.Provider value={value}>
      {children}
    </ContentLibraryContext.Provider>
  );
}

export function useContentLibrary(): ContentLibraryContextValue {
  return useContext(ContentLibraryContext);
}
