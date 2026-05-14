import { Router, type IRouter, type Request, type Response } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { pool } from "@workspace/db";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

router.get("/health", async (_req: Request, res: Response): Promise<void> => {
  const start = Date.now();

  let dbStatus: "ok" | "error" = "error";
  let dbLatencyMs: number | null = null;
  let dbError: string | null = null;

  try {
    const dbStart = Date.now();
    await pool.query("SELECT 1");
    dbLatencyMs = Date.now() - dbStart;
    dbStatus = "ok";
  } catch (err) {
    dbError = err instanceof Error ? err.message : "Unknown database error";
  }

  const overall = dbStatus === "ok" ? "ok" : "degraded";
  const totalMs = Date.now() - start;

  const payload = {
    status: overall,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    latencyMs: totalMs,
    checks: {
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
        ...(dbError ? { error: dbError } : {}),
      },
    },
    env: {
      node: process.version,
      environment: process.env.NODE_ENV ?? "unknown",
      databaseConfigured: !!process.env.DATABASE_URL,
      sessionSecretConfigured: !!process.env.SESSION_SECRET,
      allowedOrigins: process.env.ALLOWED_ORIGINS ?? "(all)",
    },
  };

  res.status(overall === "ok" ? 200 : 503).json(payload);
});

export default router;
