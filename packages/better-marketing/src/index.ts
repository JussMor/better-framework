/**
 * Better Marketing - A comprehensive marketing framework for TypeScript applications
 */

export * from "./types";

// Core functionality
export * from "./core";
export { init } from "./init";
export { betterMarketing, type BetterMarketingOptions } from "./marketing";
export type { Marketing } from "./marketing";

// Error handling
export * from "./error";

// Logger
export { createLogger, logger } from "./utils/logger";

// Utilities
export * from "./api/call";
export * from "./api/to-marketing-endpoints";
export { generateApiKey } from "./crypto";
export * from "./test";
// Note: capitalizeFirstLetter is available from "better-marketing/client/react" if needed
// Plugins
export * from "./plugins";
