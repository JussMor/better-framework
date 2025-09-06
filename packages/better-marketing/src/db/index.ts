/**
 * Database utilities and schema management for Better Framework
 */

export * from "./field";
export * from "./get-migration";
export * from "./get-schema";
export {
  getMarketingTables as getFrameworkTables,
  getMarketingTables,
} from "./get-tables";
export * from "./schema";
export * from "./to-zod";
export * from "./utils";

// Legacy compatibility functions
export { getMarketingTables as getAuthTables } from "./get-tables";
export { getMarketingAdapter as getAdapter } from "./utils";
