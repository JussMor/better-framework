/**
 * Database utilities for Better Marketing
 */

import { createKyselyAdapter, kyselyAdapter } from "../adapters/kysely-adapter";
import { memoryAdapter } from "../adapters/memory";
import type { BetterMarketingOptions } from "../types";
import { Adapter } from "../types";
import { getMarketingTables } from "./get-tables";

export async function getMarketingAdapter(
  options: BetterMarketingOptions
): Promise<Adapter> {
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

  const { kysely, databaseType } = await createKyselyAdapter(options);
  if (!kysely) {
    throw new Error("Failed to initialize database adapter");
  }
  return kyselyAdapter(kysely, {
    type: databaseType || "sqlite",
    debugLogs:
      "debugLogs" in options.database ? options.database.debugLogs : false,
  })(options);

}
