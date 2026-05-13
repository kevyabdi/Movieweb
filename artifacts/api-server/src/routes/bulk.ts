import { Router, type IRouter, type Request, type Response } from "express";
import { inArray } from "drizzle-orm";
import { db, moviesTable, seriesTable } from "@workspace/db";
import { z } from "zod";
import { requireAdminAuth } from "./auth";

const router: IRouter = Router();

const BulkActionBody = z.object({
  ids: z.array(z.number().int()).min(1),
  action: z.enum(["publish", "draft", "delete"]),
  type: z.enum(["movie", "series"]),
});

router.post("/bulk-action", async (req: Request, res: Response): Promise<void> => {
  const ok = await requireAdminAuth(req, res);
  if (!ok) return;

  const parsed = BulkActionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { ids, action, type } = parsed.data;
  const table = type === "movie" ? moviesTable : seriesTable;

  if (action === "delete") {
    await db.delete(table).where(inArray(table.id, ids));
    res.json({ affected: ids.length, action });
    return;
  }

  const status = action === "publish" ? "published" : "draft";
  await db.update(table).set({ status, updatedAt: new Date() }).where(inArray(table.id, ids));
  res.json({ affected: ids.length, action, status });
});

export default router;
