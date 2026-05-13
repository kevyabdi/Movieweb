import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, moviesTable } from "@workspace/db";
import {
  ListMoviesQueryParams,
  ListMoviesResponse,
  CreateMovieBody,
  GetMovieParams,
  GetMovieResponse,
  UpdateMovieParams,
  UpdateMovieBody,
  UpdateMovieResponse,
  DeleteMovieParams,
  PublishMovieParams,
  PublishMovieResponse,
  DraftMovieParams,
  DraftMovieResponse,
} from "@workspace/api-zod";
import { serializeRow, serializeRows } from "../lib/serialize";
import { requireAdminAuth } from "./auth";

const router: IRouter = Router();

router.get("/movies", async (req, res): Promise<void> => {
  const query = ListMoviesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const conditions = [];
  if (query.data.status) conditions.push(eq(moviesTable.status, query.data.status));
  if (query.data.featured === "true") conditions.push(eq(moviesTable.isFeatured, true));
  if (query.data.trending === "true") conditions.push(eq(moviesTable.isTrending, true));

  const rows = await db
    .select()
    .from(moviesTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(moviesTable.createdAt);

  res.json(ListMoviesResponse.parse(serializeRows(rows)));
});

router.post("/movies", async (req, res): Promise<void> => {
  const ok = await requireAdminAuth(req, res);
  if (!ok) return;

  const parsed = CreateMovieBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid movie body");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [movie] = await db.insert(moviesTable).values(parsed.data).returning();
  res.status(201).json(GetMovieResponse.parse(serializeRow(movie)));
});

router.get("/movies/:id", async (req, res): Promise<void> => {
  const params = GetMovieParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [movie] = await db.select().from(moviesTable).where(eq(moviesTable.id, params.data.id));
  if (!movie) { res.status(404).json({ error: "Movie not found" }); return; }

  res.json(GetMovieResponse.parse(serializeRow(movie)));
});

router.put("/movies/:id", async (req, res): Promise<void> => {
  const ok = await requireAdminAuth(req, res);
  if (!ok) return;

  const params = UpdateMovieParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const parsed = UpdateMovieBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [movie] = await db
    .update(moviesTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(moviesTable.id, params.data.id))
    .returning();

  if (!movie) { res.status(404).json({ error: "Movie not found" }); return; }
  res.json(UpdateMovieResponse.parse(serializeRow(movie)));
});

router.delete("/movies/:id", async (req, res): Promise<void> => {
  const ok = await requireAdminAuth(req, res);
  if (!ok) return;

  const params = DeleteMovieParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [movie] = await db.delete(moviesTable).where(eq(moviesTable.id, params.data.id)).returning();
  if (!movie) { res.status(404).json({ error: "Movie not found" }); return; }

  res.sendStatus(204);
});

router.patch("/movies/:id/publish", async (req, res): Promise<void> => {
  const ok = await requireAdminAuth(req, res);
  if (!ok) return;

  const params = PublishMovieParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [movie] = await db
    .update(moviesTable)
    .set({ status: "published", updatedAt: new Date() })
    .where(eq(moviesTable.id, params.data.id))
    .returning();

  if (!movie) { res.status(404).json({ error: "Movie not found" }); return; }
  res.json(PublishMovieResponse.parse(serializeRow(movie)));
});

router.patch("/movies/:id/draft", async (req, res): Promise<void> => {
  const ok = await requireAdminAuth(req, res);
  if (!ok) return;

  const params = DraftMovieParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [movie] = await db
    .update(moviesTable)
    .set({ status: "draft", updatedAt: new Date() })
    .where(eq(moviesTable.id, params.data.id))
    .returning();

  if (!movie) { res.status(404).json({ error: "Movie not found" }); return; }
  res.json(DraftMovieResponse.parse(serializeRow(movie)));
});

export default router;
