/**
 * Database client using Neon serverless driver + Drizzle ORM.
 *
 * Setup:
 * 1. In Vercel dashboard → Storage → Create Database → Postgres (Neon)
 * 2. Copy DATABASE_URL from the database dashboard into .env.local
 * 3. Run: npm run db:push   (creates tables from schema)
 * 4. Optionally seed: npm run db:seed
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    // This should never be called when DATABASE_URL is absent because
    // queries.ts checks HAS_DB first and uses the in-memory fallback.
    throw new Error(
      "DATABASE_URL is not set.\n" +
      "  • For local dev: add it to .env.local\n" +
      "  • On Vercel: add it under Settings → Environment Variables\n" +
      "  • Get the value from: Vercel Dashboard → Storage → your Postgres database"
    );
  }
  const sql = neon(url);
  return drizzle(sql, { schema });
}

// Module-level singleton - safe in Next.js serverless functions
let _db: ReturnType<typeof createDb> | null = null;

export function getDb() {
  if (!_db) _db = createDb();
  return _db;
}

export { schema };
