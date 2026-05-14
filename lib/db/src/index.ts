import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const isProduction = process.env.NODE_ENV === "production";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Keep pool tiny for serverless — each Vercel function instance gets its own pool
  max: isProduction ? 2 : 10,
  idleTimeoutMillis: isProduction ? 10_000 : 30_000,
  // Higher timeout for Supabase cold starts
  connectionTimeoutMillis: 10_000,
  // Supabase always requires SSL; local Replit Postgres does not
  ssl: isProduction ? { rejectUnauthorized: false } : undefined,
});

export const db = drizzle(pool, { schema });

export * from "./schema";
