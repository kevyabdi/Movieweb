import { Router, type IRouter } from "express";
import { eq, count } from "drizzle-orm";
import { db, moviesTable, seriesTable, episodesTable, categoriesTable, usersTable } from "@workspace/db";
import { GetStatsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/stats", async (_req, res): Promise<void> => {
  const [totalMoviesResult] = await db.select({ count: count() }).from(moviesTable);
  const [totalSeriesResult] = await db.select({ count: count() }).from(seriesTable);
  const [publishedMoviesResult] = await db
    .select({ count: count() })
    .from(moviesTable)
    .where(eq(moviesTable.status, "published"));
  const [publishedSeriesResult] = await db
    .select({ count: count() })
    .from(seriesTable)
    .where(eq(seriesTable.status, "published"));
  const [totalEpisodesResult] = await db.select({ count: count() }).from(episodesTable);
  const [totalCategoriesResult] = await db.select({ count: count() }).from(categoriesTable);
  const [totalUsersResult] = await db.select({ count: count() }).from(usersTable);

  res.json(
    GetStatsResponse.parse({
      totalMovies: totalMoviesResult?.count ?? 0,
      totalSeries: totalSeriesResult?.count ?? 0,
      publishedMovies: publishedMoviesResult?.count ?? 0,
      publishedSeries: publishedSeriesResult?.count ?? 0,
      totalEpisodes: totalEpisodesResult?.count ?? 0,
      totalCategories: totalCategoriesResult?.count ?? 0,
      totalUsers: totalUsersResult?.count ?? 0,
    })
  );
});

export default router;
