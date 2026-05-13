import { Router, type IRouter } from "express";
import { gte, count, eq, sql } from "drizzle-orm";
import { db, usersTable, moviesTable, seriesTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/analytics/overview", async (_req, res): Promise<void> => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [totalUsers] = await db.select({ count: count() }).from(usersTable);
  const [newUsersThisWeek] = await db.select({ count: count() }).from(usersTable).where(gte(usersTable.createdAt, sevenDaysAgo));
  const [totalMovies] = await db.select({ count: count() }).from(moviesTable);
  const [publishedMovies] = await db.select({ count: count() }).from(moviesTable).where(eq(moviesTable.status, "published"));
  const [totalSeries] = await db.select({ count: count() }).from(seriesTable);
  const [publishedSeries] = await db.select({ count: count() }).from(seriesTable).where(eq(seriesTable.status, "published"));

  const planBreakdown = await db
    .select({ plan: usersTable.plan, count: count() })
    .from(usersTable)
    .groupBy(usersTable.plan);

  const activeUsers = await db.select({ count: count() }).from(usersTable).where(eq(usersTable.isActive, true));
  const bannedUsers = await db.select({ count: count() }).from(usersTable).where(eq(usersTable.isActive, false));

  res.json({
    users: {
      total: totalUsers?.count ?? 0,
      newThisWeek: newUsersThisWeek?.count ?? 0,
      active: activeUsers[0]?.count ?? 0,
      banned: bannedUsers[0]?.count ?? 0,
      planBreakdown,
    },
    content: {
      totalMovies: totalMovies?.count ?? 0,
      publishedMovies: publishedMovies?.count ?? 0,
      draftMovies: (totalMovies?.count ?? 0) - (publishedMovies?.count ?? 0),
      totalSeries: totalSeries?.count ?? 0,
      publishedSeries: publishedSeries?.count ?? 0,
      draftSeries: (totalSeries?.count ?? 0) - (publishedSeries?.count ?? 0),
    },
  });
});

router.get("/analytics/signups", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      date: sql<string>`DATE(${usersTable.createdAt})`,
      count: count(),
    })
    .from(usersTable)
    .groupBy(sql`DATE(${usersTable.createdAt})`)
    .orderBy(sql`DATE(${usersTable.createdAt})`);

  res.json(rows);
});

router.get("/analytics/content-timeline", async (_req, res): Promise<void> => {
  const movieRows = await db
    .select({
      date: sql<string>`DATE(${moviesTable.createdAt})`,
      count: count(),
    })
    .from(moviesTable)
    .groupBy(sql`DATE(${moviesTable.createdAt})`)
    .orderBy(sql`DATE(${moviesTable.createdAt})`);

  const seriesRows = await db
    .select({
      date: sql<string>`DATE(${seriesTable.createdAt})`,
      count: count(),
    })
    .from(seriesTable)
    .groupBy(sql`DATE(${seriesTable.createdAt})`)
    .orderBy(sql`DATE(${seriesTable.createdAt})`);

  const allDates = new Set([...movieRows.map(r => r.date), ...seriesRows.map(r => r.date)]);
  const movieMap = Object.fromEntries(movieRows.map(r => [r.date, r.count]));
  const seriesMap = Object.fromEntries(seriesRows.map(r => [r.date, r.count]));

  const merged = Array.from(allDates).sort().map(date => ({
    date,
    movies: movieMap[date] ?? 0,
    series: seriesMap[date] ?? 0,
  }));

  res.json(merged);
});

router.get("/analytics/top-content", async (_req, res): Promise<void> => {
  const topMovies = await db
    .select({
      id: moviesTable.id,
      title: moviesTable.title,
      genre: moviesTable.genre,
      year: moviesTable.year,
      posterUrl: moviesTable.posterUrl,
      isFeatured: moviesTable.isFeatured,
      isTrending: moviesTable.isTrending,
      isMostLiked: moviesTable.isMostLiked,
      status: moviesTable.status,
    })
    .from(moviesTable)
    .where(eq(moviesTable.status, "published"))
    .limit(10);

  const topSeries = await db
    .select({
      id: seriesTable.id,
      title: seriesTable.title,
      genre: seriesTable.genre,
      year: seriesTable.year,
      posterUrl: seriesTable.posterUrl,
      isFeatured: seriesTable.isFeatured,
      isTrending: seriesTable.isTrending,
      isMostLiked: seriesTable.isMostLiked,
      status: seriesTable.status,
    })
    .from(seriesTable)
    .where(eq(seriesTable.status, "published"))
    .limit(10);

  res.json({ movies: topMovies, series: topSeries });
});

export default router;
