/**
 * Environment utilities for Better Marketing
 */

export const env = {
  BETTER_MARKETING_SECRET: process.env.BETTER_MARKETING_SECRET,
  MARKETING_SECRET: process.env.MARKETING_SECRET,
  NODE_ENV: process.env.NODE_ENV,
};

export const isProduction = env.NODE_ENV === "production";
export const isDevelopment = env.NODE_ENV === "development";
