/**
 * Better Framework - A comprehensive framework framework for TypeScript applications
 */

export * from "./types";

// Core functionality
export * from "./core";
export { betterFramework, type BetterFrameworkOptions } from "./framework";
export type { Framework } from "./framework";
export { init } from "./init";

// Error handling
export * from "./error";

// Logger
export { createLogger, logger } from "./utils/logger";

// Utilities
export * from "./api/call";
export * from "./api/to-framework-endpoints";
export { generateApiKey } from "./crypto";
// Note: capitalizeFirstLetter is available from "better-framework/client/react" if needed
// Plugins
export * from "./types/plugins";
