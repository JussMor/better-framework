/**
 * Database utilities for Better Framework
 */

import { createKyselyAdapter, kyselyAdapter } from "../adapters/kysely-adapter";
import { memoryAdapter } from "../adapters/memory";
import { BetterFrameworkError } from "../error";
import type { BetterFrameworkOptions } from "../types";
import { Adapter } from "../types";
import { FieldAttribute } from "./field";
import { getFrameworkTables } from "./get-tables";

export async function getFrameworkAdapter(
  options: BetterFrameworkOptions
): Promise<Adapter> {
  if (!options.database) {
    const tables = getFrameworkTables(options);
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
    throw new BetterFrameworkError("Failed to initialize database adapter");
  }
  return kyselyAdapter(kysely, {
    type: databaseType || "sqlite",
    debugLogs:
      "debugLogs" in options.database ? options.database.debugLogs : false,
  })(options);
}

export function convertToDB<T extends Record<string, any>>(
  fields: Record<string, FieldAttribute>,
  values: T
) {
  let result: Record<string, any> = values.id
    ? {
        id: values.id,
      }
    : {};
  for (const key in fields) {
    const field = fields[key];
    const value = values[key];
    if (value === undefined) {
      continue;
    }

    // Apply input transformation if available
    if (field.transform?.input && value !== undefined) {
      result[field.fieldName || key] = field.transform.input(value);
      continue;
    }

    // Handle array types that need JSON serialization
    if (
      (field.type === "string[]" ||
        field.type === "number[]" ||
        field.type === "json") &&
      value !== null
    ) {
      result[field.fieldName || key] =
        typeof value === "string" ? value : JSON.stringify(value);
      continue;
    }

    // Handle date conversion
    if (field.type === "date" && value instanceof Date) {
      result[field.fieldName || key] = value;
      continue;
    }

    result[field.fieldName || key] = value;
  }
  return result as T;
}

export function convertFromDB<T extends Record<string, any>>(
  fields: Record<string, FieldAttribute>,
  values: T | null
) {
  if (!values) {
    return null;
  }
  let result: Record<string, any> = {
    id: values.id,
  };
  for (const [key, field] of Object.entries(fields)) {
    const dbValue = values[field.fieldName || key];

    if (dbValue === undefined || dbValue === null) {
      result[key] = dbValue;
      continue;
    }

    // Apply output transformation if available
    if (field.transform?.output) {
      result[key] = field.transform.output(dbValue);
      continue;
    }

    // Handle JSON parsing for arrays and objects
    if (
      field.type === "string[]" ||
      field.type === "number[]" ||
      field.type === "json"
    ) {
      try {
        result[key] =
          typeof dbValue === "string" ? JSON.parse(dbValue) : dbValue;
      } catch {
        result[key] = dbValue;
      }
      continue;
    }

    // Handle date conversion
    if (field.type === "date") {
      if (dbValue instanceof Date) {
        result[key] = dbValue;
      } else if (typeof dbValue === "string" || typeof dbValue === "number") {
        result[key] = new Date(dbValue);
      } else {
        result[key] = dbValue;
      }
      continue;
    }

    result[key] = dbValue;
  }
  return result as T;
}
