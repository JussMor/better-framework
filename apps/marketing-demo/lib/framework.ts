import { betterFramework, type Framework } from "better-framework";
import { db } from "./kysely-db";
import { notificationsPlugin } from "./plugins/notifications-plugin";

export const framework: Framework = betterFramework({
  // Kysely SQLite configuration for schema generation support
  database: {
    db: db,
    type: "sqlite" as const,
  },
  secret:
    process.env.FRAMEWORK_SECRET ||
    "your-secret-key-for-development-must-be-at-least-32-characters-long",
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001",

  basePath: "/api/framework",
  plugins: [notificationsPlugin()],

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
