import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, seriesTable } from "@workspace/db";
import {
  ListSeriesQueryParams,
  ListSeriesResponse,
  CreateSeriesBody,
  GetOneSeriesParams,
  GetOneSeriesResponse,
  UpdateSeriesParams,
  UpdateSeriesBody,
  UpdateSeriesResponse,
  DeleteSeriesParams,
  PublishSeriesParams,
  PublishSeriesResponse,
  DraftSeriesParams,
  DraftSeriesResponse,
} from "@workspace/api-zod";
import { serializeRow, serializeRows } from "../lib/serialize";
import { requireAdminAuth } from "./auth";

const router: IRouter = Router();

router.get("/series", async (req, res): Promise<void> => {
  const query = ListSeriesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const conditions = [];
  if (query.data.status) conditions.push(eq(seriesTable.status, query.data.status));
  if (query.data.featured === "true") conditions.push(eq(seriesTable.isFeatured, true));
  if (query.data.trending === "true") conditions.push(eq(seriesTable.isTrending, true));

  const rows = await db
    .select()
    .from(seriesTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(seriesTable.createdAt);

  res.json(ListSeriesResponse.parse(serializeRows(rows)));
});

router.post("/series", async (req, res): Promise<void> => {
  const ok = await requireAdminAuth(req, res);
  if (!ok) return;

  const parsed = CreateSeriesBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid series body");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [series] = await db.insert(seriesTable).values(parsed.data).returning();
  res.status(201).json(GetOneSeriesResponse.parse(serializeRow(series)));
});

router.get("/series/:id", async (req, res): Promise<void> => {
  const params = GetOneSeriesParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [series] = await db.select().from(seriesTable).where(eq(seriesTable.id, params.data.id));
  if (!series) { res.status(404).json({ error: "Series not found" }); return; }

  res.json(GetOneSeriesResponse.parse(serializeRow(series)));
});

router.put("/series/:id", async (req, res): Promise<void> => {
  const ok = await requireAdminAuth(req, res);
  if (!ok) return;

  const params = UpdateSeriesParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const parsed = UpdateSeriesBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [series] = await db
    .update(seriesTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(seriesTable.id, params.data.id))
    .returning();

  if (!series) { res.status(404).json({ error: "Series not found" }); return; }
  res.json(UpdateSeriesResponse.parse(serializeRow(series)));
});

router.delete("/series/:id", async (req, res): Promise<void> => {
  const ok = await requireAdminAuth(req, res);
  if (!ok) return;

  const params = DeleteSeriesParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [series] = await db.delete(seriesTable).where(eq(seriesTable.id, params.data.id)).returning();
  if (!series) { res.status(404).json({ error: "Series not found" }); return; }

  res.sendStatus(204);
});

router.patch("/series/:id/publish", async (req, res): Promise<void> => {
  const ok = await requireAdminAuth(req, res);
  if (!ok) return;

  const params = PublishSeriesParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [series] = await db
    .update(seriesTable)
    .set({ status: "published", updatedAt: new Date() })
    .where(eq(seriesTable.id, params.data.id))
    .returning();

  if (!series) { res.status(404).json({ error: "Series not found" }); return; }
  res.json(PublishSeriesResponse.parse(serializeRow(series)));
});

router.patch("/series/:id/draft", async (req, res): Promise<void> => {
  const ok = await requireAdminAuth(req, res);
  if (!ok) return;

  const params = DraftSeriesParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [series] = await db
    .update(seriesTable)
    .set({ status: "draft", updatedAt: new Date() })
    .where(eq(seriesTable.id, params.data.id))
    .returning();

  if (!series) { res.status(404).json({ error: "Series not found" }); return; }
  res.json(DraftSeriesResponse.parse(serializeRow(series)));
});

export default router;
