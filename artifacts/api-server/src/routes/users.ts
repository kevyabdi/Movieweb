import { Router, type IRouter, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { requireAdminAuth } from "./auth";

const router: IRouter = Router();

const VALID_PLANS = ["free", "basic", "premium", "pro"];
const VALID_ROLES = ["user", "admin"];

router.get("/users", async (req: Request, res: Response): Promise<void> => {
  const ok = await requireAdminAuth(req, res);
  if (!ok) return;

  const rows = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      name: usersTable.name,
      role: usersTable.role,
      plan: usersTable.plan,
      isActive: usersTable.isActive,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .orderBy(usersTable.createdAt);
  res.json(rows);
});

router.patch("/users/:id", async (req: Request, res: Response): Promise<void> => {
  const ok = await requireAdminAuth(req, res);
  if (!ok) return;

  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { plan, isActive, role, name } = req.body as {
    plan?: string;
    isActive?: boolean;
    role?: string;
    name?: string;
  };

  const update: Record<string, unknown> = {};
  if (plan !== undefined) {
    if (!VALID_PLANS.includes(plan)) { res.status(400).json({ error: `Invalid plan. Must be one of: ${VALID_PLANS.join(", ")}` }); return; }
    update.plan = plan;
  }
  if (isActive !== undefined) update.isActive = isActive;
  if (role !== undefined) {
    if (!VALID_ROLES.includes(role)) { res.status(400).json({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}` }); return; }
    update.role = role;
  }
  if (name !== undefined) update.name = name;

  if (Object.keys(update).length === 0) {
    res.status(400).json({ error: "No valid fields to update" });
    return;
  }

  const [user] = await db.update(usersTable).set(update).where(eq(usersTable.id, id)).returning({
    id: usersTable.id,
    email: usersTable.email,
    name: usersTable.name,
    role: usersTable.role,
    plan: usersTable.plan,
    isActive: usersTable.isActive,
    createdAt: usersTable.createdAt,
  });

  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json(user);
});

router.delete("/users/:id", async (req: Request, res: Response): Promise<void> => {
  const ok = await requireAdminAuth(req, res);
  if (!ok) return;

  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [user] = await db.delete(usersTable).where(eq(usersTable.id, id)).returning();
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.sendStatus(204);
});

export default router;
