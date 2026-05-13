import { Router, type IRouter } from "express";

const router: IRouter = Router();

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMG = "https://image.tmdb.org/t/p/w500";

function getKey(req: { headers: Record<string, string | string[] | undefined> }): string | undefined {
  const apiKey = process.env.TMDB_API_KEY;
  return apiKey || undefined;
}

router.get("/tmdb/search", async (req, res): Promise<void> => {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: "TMDB_API_KEY not configured on server" });
    return;
  }

  const query = req.query.q as string;
  const type = (req.query.type as string) === "tv" ? "tv" : "movie";

  if (!query || query.trim().length < 1) {
    res.json({ results: [] });
    return;
  }

  try {
    const url = `${TMDB_BASE}/search/${type}?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=en-US&page=1`;
    const response = await fetch(url);
    if (!response.ok) {
      res.status(response.status).json({ error: "TMDB request failed" });
      return;
    }
    const data = await response.json() as { results: unknown[] };

    const results = (data.results || []).slice(0, 8).map((item: unknown) => {
      const r = item as Record<string, unknown>;
      if (type === "movie") {
        return {
          id: r.id,
          title: r.title,
          year: r.release_date ? String(r.release_date).slice(0, 4) : "",
          overview: r.overview,
          posterUrl: r.poster_path ? `${TMDB_IMG}${r.poster_path}` : null,
          backdropUrl: r.backdrop_path ? `https://image.tmdb.org/t/p/original${r.backdrop_path}` : null,
          rating: r.adult ? "R" : "PG-13",
          genre: "",
          tmdbId: r.id,
          voteAverage: r.vote_average,
        };
      } else {
        return {
          id: r.id,
          title: r.name,
          year: r.first_air_date ? String(r.first_air_date).slice(0, 4) : "",
          overview: r.overview,
          posterUrl: r.poster_path ? `${TMDB_IMG}${r.poster_path}` : null,
          backdropUrl: r.backdrop_path ? `https://image.tmdb.org/t/p/original${r.backdrop_path}` : null,
          rating: r.adult ? "TV-MA" : "TV-14",
          genre: "",
          tmdbId: r.id,
          voteAverage: r.vote_average,
        };
      }
    });

    res.json({ results });
  } catch {
    res.status(500).json({ error: "Failed to fetch from TMDB" });
  }
});

router.get("/tmdb/details/:type/:id", async (req, res): Promise<void> => {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: "TMDB_API_KEY not configured on server" });
    return;
  }

  const { type, id } = req.params;
  const mediaType = type === "tv" ? "tv" : "movie";

  try {
    const url = `${TMDB_BASE}/${mediaType}/${id}?api_key=${apiKey}&language=en-US&append_to_response=credits,videos`;
    const response = await fetch(url);
    if (!response.ok) {
      res.status(response.status).json({ error: "TMDB request failed" });
      return;
    }
    const data = await response.json() as Record<string, unknown>;

    const genres = (data.genres as Array<{ name: string }> || []).map((g) => g.name).join(", ");
    const director = (() => {
      const credits = data.credits as { crew?: Array<{ job: string; name: string }> } | undefined;
      if (!credits) return "";
      const d = credits.crew?.find((c) => c.job === "Director");
      return d ? d.name : "";
    })();
    const trailer = (() => {
      const videos = data.videos as { results?: Array<{ type: string; site: string; key: string }> } | undefined;
      if (!videos) return "";
      const t = videos.results?.find((v) => v.type === "Trailer" && v.site === "YouTube");
      return t ? `https://www.youtube.com/watch?v=${t.key}` : "";
    })();

    res.json({
      title: mediaType === "movie" ? data.title : data.name,
      year: mediaType === "movie"
        ? String(data.release_date || "").slice(0, 4)
        : String(data.first_air_date || "").slice(0, 4),
      genre: genres,
      description: String(data.overview || "").slice(0, 300),
      longDescription: data.overview,
      posterUrl: data.poster_path ? `${TMDB_IMG}${data.poster_path}` : null,
      backdropUrl: data.backdrop_path ? `https://image.tmdb.org/t/p/original${data.backdrop_path}` : null,
      trailerUrl: trailer,
      director,
      rating: data.adult ? (mediaType === "tv" ? "TV-MA" : "R") : (mediaType === "tv" ? "TV-14" : "PG-13"),
      voteAverage: data.vote_average,
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch from TMDB" });
  }
});

export default router;
