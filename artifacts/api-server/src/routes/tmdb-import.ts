import { Router, type IRouter, type Request, type Response } from "express";
import { db, moviesTable, seriesTable } from "@workspace/db";
import { z } from "zod";

const router: IRouter = Router();

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMG = "https://image.tmdb.org/t/p/w500";

const ImportBody = z.object({
  ids: z.array(z.number().int()).min(1).max(50),
  type: z.enum(["movie", "tv", "auto"]).default("auto"),
  status: z.enum(["draft", "published"]).default("draft"),
});

async function fetchTmdbMovie(id: number, apiKey: string): Promise<Record<string, unknown> | null> {
  const url = `${TMDB_BASE}/movie/${id}?api_key=${apiKey}&language=en-US&append_to_response=credits,videos`;
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json() as Promise<Record<string, unknown>>;
}

async function fetchTmdbTv(id: number, apiKey: string): Promise<Record<string, unknown> | null> {
  const url = `${TMDB_BASE}/tv/${id}?api_key=${apiKey}&language=en-US&append_to_response=credits,videos`;
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json() as Promise<Record<string, unknown>>;
}

async function autoDetect(
  id: number,
  apiKey: string
): Promise<{ type: "movie" | "tv"; data: Record<string, unknown> } | null> {
  const movieData = await fetchTmdbMovie(id, apiKey);
  if (movieData) return { type: "movie", data: movieData };
  const tvData = await fetchTmdbTv(id, apiKey);
  if (tvData) return { type: "tv", data: tvData };
  return null;
}

function getTrailer(data: Record<string, unknown>): string {
  const videos = data.videos as { results?: Array<{ type: string; site: string; key: string }> } | undefined;
  if (!videos?.results) return "";
  const t = videos.results.find(v => v.type === "Trailer" && v.site === "YouTube");
  return t ? `https://www.youtube.com/watch?v=${t.key}` : "";
}

function getDirector(data: Record<string, unknown>): string {
  const credits = data.credits as { crew?: Array<{ job: string; name: string }> } | undefined;
  if (!credits?.crew) return "";
  const d = credits.crew.find(c => c.job === "Director");
  return d ? d.name : "";
}

function getGenres(data: Record<string, unknown>): string {
  return ((data.genres as Array<{ name: string }>) ?? []).map(g => g.name).join(", ");
}

router.post("/tmdb/bulk-import", async (req: Request, res: Response): Promise<void> => {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: "TMDB_API_KEY not configured on server" });
    return;
  }

  const parsed = ImportBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { ids, type, status } = parsed.data;
  const results: Array<{ id: number; title: string; mediaType: string; success: boolean; error?: string }> = [];

  for (const tmdbId of ids) {
    try {
      let resolvedType: "movie" | "tv";
      let data: Record<string, unknown>;

      if (type === "auto") {
        const detected = await autoDetect(tmdbId, apiKey);
        if (!detected) {
          results.push({ id: tmdbId, title: "", mediaType: "unknown", success: false, error: `ID ${tmdbId} not found on TMDB as movie or TV` });
          continue;
        }
        resolvedType = detected.type;
        data = detected.data;
      } else {
        resolvedType = type;
        const fetched = resolvedType === "movie"
          ? await fetchTmdbMovie(tmdbId, apiKey)
          : await fetchTmdbTv(tmdbId, apiKey);
        if (!fetched) {
          results.push({ id: tmdbId, title: "", mediaType: resolvedType, success: false, error: `TMDB ${resolvedType} ${tmdbId}: not found` });
          continue;
        }
        data = fetched;
      }

      if (resolvedType === "movie") {
        const title = String(data.title ?? "");
        const genres = getGenres(data);
        const director = getDirector(data);
        const trailer = getTrailer(data);
        const tags = ((data.genres as Array<{ name: string }>) ?? []).map(g => g.name);

        await db.insert(moviesTable).values({
          title,
          year: String(data.release_date ?? "").slice(0, 4) || new Date().getFullYear().toString(),
          genre: genres || "Drama",
          rating: (data.adult as boolean) ? "R" : "PG-13",
          description: String(data.overview ?? "").slice(0, 500),
          longDescription: String(data.overview ?? ""),
          posterUrl: data.poster_path ? `${TMDB_IMG}${data.poster_path}` : null,
          backdropUrl: data.backdrop_path ? `https://image.tmdb.org/t/p/original${data.backdrop_path}` : null,
          trailerUrl: trailer || null,
          director: director || null,
          tags,
          quality: "HD",
          status,
          isFeatured: false,
          isTrending: false,
          isMostLiked: false,
        });

        results.push({ id: tmdbId, title, mediaType: "movie", success: true });
      } else {
        const title = String(data.name ?? "");
        const genres = getGenres(data);
        const tags = ((data.genres as Array<{ name: string }>) ?? []).map(g => g.name);
        const numSeasons = (data.number_of_seasons as number) ?? 1;

        await db.insert(seriesTable).values({
          title,
          year: String(data.first_air_date ?? "").slice(0, 4) || new Date().getFullYear().toString(),
          genre: genres || "Drama",
          rating: (data.adult as boolean) ? "TV-MA" : "TV-14",
          description: String(data.overview ?? "").slice(0, 500),
          longDescription: String(data.overview ?? ""),
          posterUrl: data.poster_path ? `${TMDB_IMG}${data.poster_path}` : null,
          backdropUrl: data.backdrop_path ? `https://image.tmdb.org/t/p/original${data.backdrop_path}` : null,
          seasonsCount: numSeasons,
          tags,
          quality: "HD",
          status,
          isFeatured: false,
          isTrending: false,
          isMostLiked: false,
        });

        results.push({ id: tmdbId, title, mediaType: "tv", success: true });
      }

      await new Promise(r => setTimeout(r, 250));
    } catch (err) {
      results.push({ id: tmdbId, title: "", mediaType: type, success: false, error: String(err) });
    }
  }

  const succeeded = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  res.json({ succeeded, failed, results });
});

router.get("/tmdb/preview/:type/:id", async (req: Request, res: Response): Promise<void> => {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: "TMDB_API_KEY not configured" });
    return;
  }

  const tmdbId = parseInt(String(req.params.id));
  if (isNaN(tmdbId)) {
    res.status(400).json({ error: "Invalid TMDB ID" });
    return;
  }

  const rawType = req.params.type;

  try {
    let type: "movie" | "tv";
    let data: Record<string, unknown>;

    if (rawType === "auto") {
      const detected = await autoDetect(tmdbId, apiKey);
      if (!detected) {
        res.status(404).json({ error: `ID ${tmdbId} not found on TMDB` });
        return;
      }
      type = detected.type;
      data = detected.data;
    } else {
      type = rawType === "tv" ? "tv" : "movie";
      const fetched = type === "movie"
        ? await fetchTmdbMovie(tmdbId, apiKey)
        : await fetchTmdbTv(tmdbId, apiKey);
      if (!fetched) {
        res.status(404).json({ error: `TMDB ${type} ${tmdbId} not found` });
        return;
      }
      data = fetched;
    }

    res.json({
      tmdbId,
      type,
      title: type === "movie" ? String(data.title ?? "") : String(data.name ?? ""),
      year: type === "movie"
        ? String(data.release_date ?? "").slice(0, 4)
        : String(data.first_air_date ?? "").slice(0, 4),
      genre: getGenres(data),
      posterUrl: data.poster_path ? `${TMDB_IMG}${data.poster_path}` : null,
      overview: String(data.overview ?? "").slice(0, 200),
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
