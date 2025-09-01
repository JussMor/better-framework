/**
 * Better Marketing - A comprehensive marketing framework for TypeScript applications
 */

export * from "./types";

// Core functionality
export * from "./core";
export { init } from "./init";
export { betterMarketing, type BetterMarketingOptions } from "./marketing";

// Utilities
export * from "./api/call";
export * from "./api/to-marketing-endpoints";
export { generateApiKey } from "./crypto";
export * from "./test";
