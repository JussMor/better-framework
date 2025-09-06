/**
 * Database utilities and schema management for Better Framework
 */

export * from "./field";
export * from "./get-migration";
export * from "./get-schema";
export { getFrameworkTables } from "./get-tables";
export * from "./schema";
export * from "./to-zod";
export * from "./utils";

// CLI compatibility functions
export { getFrameworkTables as getAuthTables } from "./get-tables";
export { getFrameworkAdapter as getAdapter } from "./utils";
