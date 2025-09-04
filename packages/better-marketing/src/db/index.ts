/**
 * Database utilities and schema management for Better Marketing
 */

export * from "./field";
export * from "./get-migration";
export * from "./get-schema";
export { getMarketingTables } from "./get-tables";
export * from "./schema";
export * from "./to-zod";
export * from "./utils";

// CLI compatibility functions
export { getMarketingTables as getAuthTables } from "./get-tables";
export { getMarketingAdapter as getAdapter } from "./utils";
