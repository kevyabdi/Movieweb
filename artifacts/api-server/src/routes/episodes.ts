import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, episodesTable, seasonsTable, seriesTable } from "@workspace/db";
import {
  ListEpisodesParams,
  ListEpisodesResponse,
  CreateEpisodeParams,
  CreateEpisodeBody,
  GetEpisodeParams,
  GetEpisodeResponse,
  UpdateEpisodeParams,
  UpdateEpisodeBody,
  UpdateEpisodeResponse,
  DeleteEpisodeParams,
} from "@workspace/api-zod";
import { serializeRow, serializeRows } from "../lib/serialize";

const router: IRouter = Router();

router.get("/seasons/:id/episodes", async (req, res): Promise<void> => {
  const params = ListEpisodesParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const rows = await db
    .select()
    .from(episodesTable)
    .where(eq(episodesTable.seasonId, params.data.id))
    .orderBy(episodesTable.episodeNumber);

  res.json(ListEpisodesResponse.parse(serializeRows(rows)));
});

router.post("/seasons/:id/episodes", async (req, res): Promise<void> => {
  const params = CreateEpisodeParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const parsed = CreateEpisodeBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid episode body");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  let thumbnailUrl = parsed.data.thumbnailUrl;
  if (!thumbnailUrl) {
    const [season] = await db.select().from(seasonsTable).where(eq(seasonsTable.id, params.data.id)).limit(1);
    if (season) {
      const [series] = await db.select({ backdropUrl: seriesTable.backdropUrl, posterUrl: seriesTable.posterUrl })
        .from(seriesTable).where(eq(seriesTable.id, season.seriesId)).limit(1);
      thumbnailUrl = series?.backdropUrl ?? series?.posterUrl ?? undefined;
    }
  }

  const [episode] = await db
    .insert(episodesTable)
    .values({ ...parsed.data, seasonId: params.data.id, thumbnailUrl: thumbnailUrl ?? undefined })
    .returning();


  res.status(201).json(GetEpisodeResponse.parse(serializeRow(episode)));
});

router.get("/episodes/:id", async (req, res): Promise<void> => {
  const params = GetEpisodeParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [episode] = await db.select().from(episodesTable).where(eq(episodesTable.id, params.data.id));
  if (!episode) { res.status(404).json({ error: "Episode not found" }); return; }

  res.json(GetEpisodeResponse.parse(serializeRow(episode)));
});

router.put("/episodes/:id", async (req, res): Promise<void> => {
  const params = UpdateEpisodeParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const parsed = UpdateEpisodeBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [episode] = await db
    .update(episodesTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(episodesTable.id, params.data.id))
    .returning();

  if (!episode) { res.status(404).json({ error: "Episode not found" }); return; }
  res.json(UpdateEpisodeResponse.parse(serializeRow(episode)));
});

router.delete("/episodes/:id", async (req, res): Promise<void> => {
  const params = DeleteEpisodeParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [episode] = await db.delete(episodesTable).where(eq(episodesTable.id, params.data.id)).returning();
  if (!episode) { res.status(404).json({ error: "Episode not found" }); return; }

  res.sendStatus(204);
});

export default router;
