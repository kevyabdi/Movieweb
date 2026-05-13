import { Router, type IRouter, type Request, type Response } from "express";
import { eq, asc } from "drizzle-orm";
import { db, bannersTable } from "@workspace/db";
import { z } from "zod";
import { requireAdminAuth } from "./auth";

const router: IRouter = Router();

const BannerBody = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional(),
  imageUrl: z.string().min(1),
  linkUrl: z.string().optional(),
  buttonLabel: z.string().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

router.get("/banners/active", async (_req: Request, res: Response): Promise<void> => {
  const rows = await db
    .select()
    .from(bannersTable)
    .where(eq(bannersTable.isActive, true))
    .orderBy(asc(bannersTable.sortOrder), asc(bannersTable.createdAt));
  res.json(rows);
});

router.get("/banners", async (_req: Request, res: Response): Promise<void> => {
  const rows = await db.select().from(bannersTable).orderBy(asc(bannersTable.sortOrder), asc(bannersTable.createdAt));
  res.json(rows);
});

router.post("/banners", async (req: Request, res: Response): Promise<void> => {
  const ok = await requireAdminAuth(req, res);
  if (!ok) return;

  const parsed = BannerBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [banner] = await db.insert(bannersTable).values(parsed.data).returning();
  res.status(201).json(banner);
});

router.put("/banners/:id", async (req: Request, res: Response): Promise<void> => {
  const ok = await requireAdminAuth(req, res);
  if (!ok) return;

  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = BannerBody.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [banner] = await db
    .update(bannersTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(bannersTable.id, id))
    .returning();

  if (!banner) { res.status(404).json({ error: "Banner not found" }); return; }
  res.json(banner);
});

router.patch("/banners/:id/toggle", async (req: Request, res: Response): Promise<void> => {
  const ok = await requireAdminAuth(req, res);
  if (!ok) return;

  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [current] = await db.select().from(bannersTable).where(eq(bannersTable.id, id));
  if (!current) { res.status(404).json({ error: "Banner not found" }); return; }

  const [banner] = await db
    .update(bannersTable)
    .set({ isActive: !current.isActive, updatedAt: new Date() })
    .where(eq(bannersTable.id, id))
    .returning();

  res.json(banner);
});

router.delete("/banners/:id", async (req: Request, res: Response): Promise<void> => {
  const ok = await requireAdminAuth(req, res);
  if (!ok) return;

  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [banner] = await db.delete(bannersTable).where(eq(bannersTable.id, id)).returning();
  if (!banner) { res.status(404).json({ error: "Banner not found" }); return; }
  res.sendStatus(204);
});

export default router;
