import { config } from "dotenv";
import type { Config } from "drizzle-kit";

// drizzle-kit doesn't load Next.js env files automatically
config({ path: ".env.local" });

export default {
  schema: "./lib/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
