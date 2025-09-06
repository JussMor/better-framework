/**
 * Environment utilities for Better Framework
 */

export const env = {
  BETTER_FRAMEWORK_SECRET: process.env.BETTER_FRAMEWORK_SECRET,
  FRAMEWORK_SECRET: process.env.FRAMEWORK_SECRET,
  NODE_ENV: process.env.NODE_ENV,
};

export const isProduction = env.NODE_ENV === "production";
export const isDevelopment = env.NODE_ENV === "development";
