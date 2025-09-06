import { betterFramework } from "better-framework";
import { campaignsPlugin } from "better-framework/plugins/campaigns";
import { db } from "./kysely-db";

export const marketing = betterFramework({
  // Kysely SQLite configuration for schema generation support
  database: {
    db: db,
    type: "sqlite" as const,
  },
  secret:
    process.env.MARKETING_SECRET ||
    "your-secret-key-for-development-must-be-at-least-32-characters-long",
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001",

  basePath: "/api/framework",
  plugins: [campaignsPlugin()],

  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },

  // Rate limiting
  rateLimit: {
    enabled: true,
    window: 15 * 60 * 1000, // 15 minutes
    max: 100, // requests per window
  },
});

