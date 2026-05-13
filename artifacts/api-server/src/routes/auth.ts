import { Router, type IRouter, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

function getJwtSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET not set");
  return secret;
}

function signToken(payload: object, tokenType: "admin" | "user", expiresIn = "7d"): string {
  return jwt.sign({ ...payload, tokenType }, getJwtSecret(), { expiresIn } as jwt.SignOptions);
}

export async function requireAdminAuth(req: Request, res: Response): Promise<boolean> {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ error: "No token" });
    return false;
  }
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, getJwtSecret()) as { role?: string; id?: number; tokenType?: string };
    if (payload.role !== "admin" || payload.tokenType !== "admin") {
      res.status(403).json({ error: "Admin access required" });
      return false;
    }
    return true;
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
    return false;
  }
}

export async function requireAuth(req: Request, res: Response): Promise<number | null> {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ error: "No token" });
    return null;
  }
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, getJwtSecret()) as { id?: number };
    if (!payload.id) {
      res.status(401).json({ error: "Invalid token" });
      return null;
    }
    return payload.id;
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
    return null;
  }
}

const PUBLIC_USER_FIELDS = {
  id: usersTable.id,
  email: usersTable.email,
  name: usersTable.name,
  avatarUrl: usersTable.avatarUrl,
  role: usersTable.role,
  plan: usersTable.plan,
  isActive: usersTable.isActive,
};

/* ── Admin login (email + password, role:admin required) ── */
router.post("/auth/admin/login", async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassEnv = process.env.ADMIN_PASSWORD;

  try {
    let [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email.toLowerCase()))
      .limit(1);

    if (!user) {
      // Bootstrap: auto-create admin on first login if env vars match
      if (
        adminEmail &&
        email.toLowerCase() === adminEmail.toLowerCase() &&
        adminPassEnv &&
        password === adminPassEnv
      ) {
        const passwordHash = await bcrypt.hash(password, 12);
        [user] = await db
          .insert(usersTable)
          .values({ email: email.toLowerCase(), passwordHash, name: "Admin", role: "admin" })
          .returning();
      } else {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }
    } else {
      // Verify password
      let valid = await bcrypt.compare(password, user.passwordHash);

      // Env-var fallback for the designated admin email
      if (
        !valid &&
        adminEmail &&
        email.toLowerCase() === adminEmail.toLowerCase() &&
        adminPassEnv &&
        password === adminPassEnv
      ) {
        valid = true;
      }

      if (!valid) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      // Upgrade to admin if logging in via env credentials
      if (user.role !== "admin") {
        if (
          adminEmail &&
          email.toLowerCase() === adminEmail.toLowerCase() &&
          adminPassEnv &&
          password === adminPassEnv
        ) {
          await db.update(usersTable).set({ role: "admin" }).where(eq(usersTable.id, user.id));
          user = { ...user, role: "admin" };
        } else {
          res.status(403).json({ error: "Access denied. Admin privileges required." });
          return;
        }
      }
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role }, "admin");
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch {
    res.status(500).json({ error: "Login failed" });
  }
});

/* ── Admin token verification ── */
router.get("/auth/admin/verify", async (req: Request, res: Response): Promise<void> => {
  const ok = await requireAdminAuth(req, res);
  if (!ok) return;

  const auth = req.headers.authorization!;
  const token = auth.slice(7);
  const payload = jwt.decode(token) as { id?: number };

  if (!payload.id) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  try {
    const [user] = await db
      .select({ id: usersTable.id, email: usersTable.email, name: usersTable.name, role: usersTable.role })
      .from(usersTable)
      .where(eq(usersTable.id, payload.id))
      .limit(1);

    if (!user || user.role !== "admin") {
      res.status(403).json({ error: "Admin access required" });
      return;
    }

    res.json({ user });
  } catch {
    res.status(500).json({ error: "Verification failed" });
  }
});

/* ── Admin change password ── */
router.post("/auth/admin/change-password", async (req: Request, res: Response): Promise<void> => {
  const ok = await requireAdminAuth(req, res);
  if (!ok) return;

  const auth = req.headers.authorization!;
  const token = auth.slice(7);
  const payload = jwt.decode(token) as { id?: number };

  const { currentPassword, newPassword } = req.body as {
    currentPassword?: string;
    newPassword?: string;
  };

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "Current password and new password are required" });
    return;
  }

  if (newPassword.length < 6) {
    res.status(400).json({ error: "New password must be at least 6 characters" });
    return;
  }

  try {
    if (!payload.id) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.id)).limit(1);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    let valid = await bcrypt.compare(currentPassword, user.passwordHash);

    // Also accept env password as current password
    const adminPassEnv = process.env.ADMIN_PASSWORD;
    if (!valid && adminPassEnv && currentPassword === adminPassEnv) {
      valid = true;
    }

    if (!valid) {
      res.status(401).json({ error: "Current password is incorrect" });
      return;
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await db.update(usersTable).set({ passwordHash: newHash }).where(eq(usersTable.id, user.id));

    res.json({ message: "Password changed successfully" });
  } catch {
    res.status(500).json({ error: "Failed to change password" });
  }
});

/* ── User register ── */
router.post("/auth/register", async (req: Request, res: Response): Promise<void> => {
  const { email, password, name } = req.body as {
    email?: string;
    password?: string;
    name?: string;
  };

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }

  try {
    const existing = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email.toLowerCase()))
      .limit(1);
    if (existing.length > 0) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const [user] = await db
      .insert(usersTable)
      .values({
        email: email.toLowerCase(),
        passwordHash,
        name: name || email.split("@")[0],
        role: "user",
      })
      .returning(PUBLIC_USER_FIELDS);

    const token = signToken({ id: user.id, email: user.email, role: user.role }, "user");
    res.status(201).json({ token, user });
  } catch {
    res.status(500).json({ error: "Registration failed" });
  }
});

/* ── User/Admin login (shared endpoint — role is returned in response) ── */
router.post("/auth/login", async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email.toLowerCase()))
      .limit(1);

    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ error: "Your account has been suspended. Please contact support." });
      return;
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role }, "user");
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: user.role,
        plan: user.plan,
      },
    });
  } catch {
    res.status(500).json({ error: "Login failed" });
  }
});

/* ── Verify token + full profile (me) ── */
router.get("/auth/me", async (req: Request, res: Response): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  const [user] = await db
    .select(PUBLIC_USER_FIELDS)
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ user });
});

/* ── Update profile ── */
router.patch("/auth/profile", async (req: Request, res: Response): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  const { name, avatarUrl } = req.body as { name?: string; avatarUrl?: string | null };
  const updates: Partial<typeof usersTable.$inferInsert> = {};
  if (name !== undefined) updates.name = name.trim() || null;
  if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl || null;

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "No fields to update" });
    return;
  }

  const [user] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, userId))
    .returning(PUBLIC_USER_FIELDS);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({ user });
});

/* ── Change password (regular users) ── */
router.patch("/auth/change-password", async (req: Request, res: Response): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  const { currentPassword, newPassword } = req.body as {
    currentPassword?: string;
    newPassword?: string;
  };

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "Current password and new password are required" });
    return;
  }

  if (newPassword.length < 6) {
    res.status(400).json({ error: "New password must be at least 6 characters" });
    return;
  }

  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Current password is incorrect" });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await db.update(usersTable).set({ passwordHash }).where(eq(usersTable.id, userId));

    res.json({ message: "Password changed successfully" });
  } catch {
    res.status(500).json({ error: "Failed to change password" });
  }
});

/* ── Forgot password ── */
router.post("/auth/forgot-password", async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body as { email?: string };

  if (!email) {
    res.status(400).json({ error: "Email is required" });
    return;
  }

  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email.toLowerCase()))
      .limit(1);

    if (!user) {
      res.json({ message: "If that email exists, a reset link has been sent." });
      return;
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000);

    await db
      .update(usersTable)
      .set({ resetToken: token, resetTokenExpiry: expiry })
      .where(eq(usersTable.id, user.id));

    res.json({ message: "If that email exists, a reset link has been sent.", resetToken: token });
  } catch {
    res.status(500).json({ error: "Failed to process request" });
  }
});

/* ── Reset password ── */
router.post("/auth/reset-password", async (req: Request, res: Response): Promise<void> => {
  const { token, newPassword } = req.body as { token?: string; newPassword?: string };

  if (!token || !newPassword) {
    res.status(400).json({ error: "Token and new password are required" });
    return;
  }

  if (newPassword.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }

  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.resetToken, token))
      .limit(1);

    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      res.status(400).json({ error: "Reset link is invalid or has expired" });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await db
      .update(usersTable)
      .set({ passwordHash, resetToken: null, resetTokenExpiry: null })
      .where(eq(usersTable.id, user.id));

    res.json({ message: "Password reset successfully. You can now sign in." });
  } catch {
    res.status(500).json({ error: "Failed to reset password" });
  }
});

export default router;
