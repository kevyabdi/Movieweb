import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, seasonsTable, seriesTable, episodesTable } from "@workspace/db";
import {
  ListSeasonsParams,
  ListSeasonsResponse,
  CreateSeasonParams,
  CreateSeasonBody,
  GetSeasonParams,
  GetSeasonResponse,
  UpdateSeasonParams,
  UpdateSeasonBody,
  UpdateSeasonResponse,
  DeleteSeasonParams,
} from "@workspace/api-zod";
import { serializeRow, serializeRows } from "../lib/serialize";

const router: IRouter = Router();

async function attachEpisodeCounts(seasons: { id: number }[]) {
  if (!seasons.length) return seasons.map(s => ({ ...s, episodesCount: 0 }));
  const counts = await db
    .select({ seasonId: episodesTable.seasonId, count: sql<number>`cast(count(*) as int)` })
    .from(episodesTable)
    .groupBy(episodesTable.seasonId);
  const countMap = new Map(counts.map(c => [c.seasonId, c.count]));
  return seasons.map(s => ({ ...s, episodesCount: countMap.get(s.id) ?? 0 }));
}

router.get("/series/:id/seasons", async (req, res): Promise<void> => {
  const params = ListSeasonsParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const rows = await db
    .select()
    .from(seasonsTable)
    .where(eq(seasonsTable.seriesId, params.data.id))
    .orderBy(seasonsTable.seasonNumber);

  const withCounts = await attachEpisodeCounts(rows);
  res.json(ListSeasonsResponse.parse(serializeRows(withCounts)));
});

router.post("/series/:id/seasons", async (req, res): Promise<void> => {
  const params = CreateSeasonParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const parsed = CreateSeasonBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid season body");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [season] = await db
    .insert(seasonsTable)
    .values({ ...parsed.data, seriesId: params.data.id })
    .returning();

  const allSeasons = await db.select().from(seasonsTable).where(eq(seasonsTable.seriesId, params.data.id));
  await db
    .update(seriesTable)
    .set({ seasonsCount: allSeasons.length, updatedAt: new Date() })
    .where(eq(seriesTable.id, params.data.id));

  res.status(201).json(GetSeasonResponse.parse(serializeRow({ ...season, episodesCount: 0 })));
});

router.get("/seasons/:id", async (req, res): Promise<void> => {
  const params = GetSeasonParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [season] = await db.select().from(seasonsTable).where(eq(seasonsTable.id, params.data.id));
  if (!season) { res.status(404).json({ error: "Season not found" }); return; }

  const [countRow] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(episodesTable)
    .where(eq(episodesTable.seasonId, season.id));

  res.json(GetSeasonResponse.parse(serializeRow({ ...season, episodesCount: countRow?.count ?? 0 })));
});

router.put("/seasons/:id", async (req, res): Promise<void> => {
  const params = UpdateSeasonParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const parsed = UpdateSeasonBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [season] = await db
    .update(seasonsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(seasonsTable.id, params.data.id))
    .returning();

  if (!season) { res.status(404).json({ error: "Season not found" }); return; }

  const [countRow] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(episodesTable)
    .where(eq(episodesTable.seasonId, season.id));

  res.json(UpdateSeasonResponse.parse(serializeRow({ ...season, episodesCount: countRow?.count ?? 0 })));
});

router.delete("/seasons/:id", async (req, res): Promise<void> => {
  const params = DeleteSeasonParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [season] = await db.delete(seasonsTable).where(eq(seasonsTable.id, params.data.id)).returning();
  if (!season) { res.status(404).json({ error: "Season not found" }); return; }

  const allSeasons = await db.select().from(seasonsTable).where(eq(seasonsTable.seriesId, season.seriesId));
  await db
    .update(seriesTable)
    .set({ seasonsCount: allSeasons.length, updatedAt: new Date() })
    .where(eq(seriesTable.id, season.seriesId));

  res.sendStatus(204);
});

export default router;
