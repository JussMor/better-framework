/**
 * Better Framework - A comprehensive framework for TypeScript applications
 */

export * from "./types";

// Core functionality
export * from "./core";
export { init } from "./init";
export {
  betterFramework,
  betterMarketing,
  type BetterFrameworkOptions,
  type BetterMarketingOptions,
} from "./marketing";
export type { Framework, Marketing } from "./marketing";

// Error handling
export * from "./error";

// Logger
export { createLogger, logger } from "./utils/logger";

// Utilities
export * from "./api/call";
export * from "./api/to-marketing-endpoints";
export { generateApiKey } from "./crypto";
export * from "./test";
// Note: capitalizeFirstLetter is available from "better-framework/client/react" if needed
// Plugins
export * from "./plugins";
