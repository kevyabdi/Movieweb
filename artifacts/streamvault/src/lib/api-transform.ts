import type { Movie, Series } from "@workspace/api-client-react";
import type { MediaItem } from "@/data/content";

const FALLBACK_POSTER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 300'%3E%3Crect width='200' height='300' fill='%231e293b'/%3E%3Ctext x='50%25' y='50%25' fill='%2364748b' font-size='40' text-anchor='middle' dominant-baseline='middle'%3E%F0%9F%8E%AC%3C%2Ftext%3E%3C/svg%3E";
const FALLBACK_BACKDROP =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 360'%3E%3Crect width='640' height='360' fill='%231e293b'/%3E%3Ctext x='50%25' y='50%25' fill='%2364748b' font-size='60' text-anchor='middle' dominant-baseline='middle'%3E%F0%9F%8E%AC%3C%2Ftext%3E%3C/svg%3E";

function safeQuality(q: string): MediaItem["quality"] {
  if (q === "4K" || q === "HD" || q === "CAM") return q;
  return "HD";
}

export function movieToMediaItem(m: Movie): MediaItem {
  return {
    id: `api-movie-${m.id}`,
    title: m.title,
    year: m.year,
    genre: m.genre,
    rating: m.rating ?? "7.0",
    duration: m.duration ?? undefined,
    description: m.description,
    longDescription: m.longDescription ?? undefined,
    posterUrl: m.posterUrl ?? FALLBACK_POSTER,
    backdropUrl: m.backdropUrl ?? FALLBACK_BACKDROP,
    type: "movie",
    quality: safeQuality(m.quality),
    director: m.director ?? undefined,
    tags: m.tags ?? [],
    isFeatured: m.isFeatured ?? false,
    isTrending: m.isTrending ?? false,
    isMostLiked: m.isMostLiked ?? false,
    createdAt: m.createdAt,
  };
}

export function seriesToMediaItem(s: Series): MediaItem {
  return {
    id: `api-series-${s.id}`,
    title: s.title,
    year: s.year,
    genre: s.genre,
    rating: s.rating ?? "7.0",
    seasons: s.seasonsCount ?? 1,
    description: s.description,
    longDescription: s.longDescription ?? undefined,
    posterUrl: s.posterUrl ?? FALLBACK_POSTER,
    backdropUrl: s.backdropUrl ?? FALLBACK_BACKDROP,
    type: "tv",
    quality: safeQuality(s.quality),
    director: s.director ?? undefined,
    tags: s.tags ?? [],
    isFeatured: s.isFeatured ?? false,
    isTrending: s.isTrending ?? false,
    isMostLiked: s.isMostLiked ?? false,
    createdAt: s.createdAt,
  };
}
