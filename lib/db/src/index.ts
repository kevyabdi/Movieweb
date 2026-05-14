import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const isProduction = process.env.NODE_ENV === "production";

let _pool: pg.Pool | null = null;
let _db: NodePgDatabase<typeof schema> | null = null;

function getPool(): pg.Pool {
  if (_pool) return _pool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Add it to your Vercel environment variables and redeploy.",
    );
  }

  _pool = new Pool({
    connectionString,
    max: isProduction ? 2 : 10,
    idleTimeoutMillis: isProduction ? 10_000 : 30_000,
    connectionTimeoutMillis: isProduction ? 5_000 : 10_000,
    ssl: isProduction ? { rejectUnauthorized: false } : undefined,
  });

  return _pool;
}

export const pool: pg.Pool = new Proxy({} as pg.Pool, {
  get(_target, prop) {
    return (getPool() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export const db: NodePgDatabase<typeof schema> = new Proxy(
  {} as NodePgDatabase<typeof schema>,
  {
    get(_target, prop) {
      if (!_db) {
        _db = drizzle(getPool(), { schema });
      }
      return (_db as unknown as Record<string | symbol, unknown>)[prop];
    },
  },
);

export * from "./schema";
