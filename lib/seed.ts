/**
 * Initializes the database with the required singleton lab status row.
 * Run: npm run db:seed
 *
 * Requires DATABASE_URL to be set in .env.local
 */

import { config } from "dotenv";
config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

async function seed() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql, { schema });

  console.log("Initializing database...");

  await db
    .insert(schema.labStatus)
    .values({
      id: "singleton",
      currentState: "closed",
      updatedBy: "system",
      notes: "Lab is closed. Submit a request to schedule access.",
    })
    .onConflictDoNothing();

  console.log("Done. Lab status initialized.");
}

seed().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
