/**
 * Database utilities for Better Marketing
 */

import { memoryAdapter } from "../adapters/memory";
import type { BetterMarketingOptions, DatabaseAdapter } from "../types";
import { getMarketingTables } from "./get-tables";

export async function getMarketingAdapter(
  options: BetterMarketingOptions
): Promise<DatabaseAdapter> {
  if (!options.database) {
    const tables = getMarketingTables(options);
    const memoryDB = Object.keys(tables).reduce((acc, key) => {
      // @ts-expect-error
      acc[key] = [];
      return acc;
    }, {});

    console.warn(
      "No database configuration provided. Using memory adapter in development"
    );
    return memoryAdapter(memoryDB)(options);
  }

  if (typeof options.database === "function") {
    return options.database(options);
  }

  // TODO: Add support for other database types like Better Auth does
  throw new Error(
    "Database configuration not yet supported. Please use a database adapter function."
  );
}
