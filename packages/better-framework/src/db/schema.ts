/**
 * Database schema definitions for Better Framework
 */

import { z } from "zod/v4";
import { BetterFrameworkError } from "../error";
import type { BetterFrameworkOptions } from "../types";
import { FrameworkPluginSchema } from "../types/plugins";
import type { FieldAttribute } from "./field";

/**
 * Framework database schema definitions using Zod
 */

export const frameworkUserSchema = z.object({
  id: z.string(),
  email: z.string().transform((val) => val.toLowerCase()),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  properties: z.record(z.string(), z.any()).default({}),
  segments: z.array(z.string()).default([]),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const frameworkEventSchema = z.object({
  id: z.string(),
  userId: z.string(),
  eventName: z.string(),
  properties: z.record(z.string(), z.any()).default({}),
  timestamp: z.date().default(() => new Date()),
  sessionId: z.string().optional(),
  source: z.string().optional(),
});

/**
 * Infer TypeScript types from Zod schemas
 */
export type FrameworkUser = z.infer<typeof frameworkUserSchema>;
export type FrameworkEvent = z.infer<typeof frameworkEventSchema>;

/**
 * Parse output data using schema fields
 */
export function parseOutputData<T extends Record<string, any>>(
  data: T,
  schema: {
    fields: Record<string, FieldAttribute>;
  }
) {
  const fields = schema.fields;
  const parsedData: Record<string, any> = {};
  for (const key in data) {
    const field = fields[key];
    if (!field) {
      parsedData[key] = data[key];
      continue;
    }
    if (field.returned === false) {
      continue;
    }
    parsedData[key] = data[key];
  }
  return parsedData as T;
}

/**
 * Parse input data with schema validation
 */
export function parseInputData<T extends Record<string, any>>(
  data: T,
  schema: {
    fields: Record<string, FieldAttribute>;
    action?: "create" | "update";
  }
): Partial<T> {
  const action = schema.action || "create";
  const fields = schema.fields;
  const parsedData: Record<string, any> = {};
  for (const key in fields) {
    if (key in data) {
      if (fields[key].input === false) {
        if (fields[key].defaultValue) {
          parsedData[key] = fields[key].defaultValue;
          continue;
        }
        continue;
      }
      if (fields[key].validator?.input && data[key] !== undefined) {
        parsedData[key] = fields[key].validator.input.parse(data[key]);
        continue;
      }
      if (fields[key].transform?.input && data[key] !== undefined) {
        parsedData[key] = fields[key].transform?.input(data[key]);
        continue;
      }
      parsedData[key] = data[key];
      continue;
    }

    if (fields[key].defaultValue && action === "create") {
      parsedData[key] = fields[key].defaultValue;
      continue;
    }

    if (fields[key].required && action === "create") {
      throw new BetterFrameworkError(`${key} is required`);
    }
  }
  return parsedData as Partial<T>;
}

/**
 * Get all fields for a specific table including plugin fields
 */
export function getAllFields(options: BetterFrameworkOptions, table: string) {
  let schema: Record<string, any> = {};

  // Add plugin fields
  for (const plugin of options.plugins || []) {
    if (plugin.schema && plugin.schema[table]) {
      schema = {
        ...schema,
        ...plugin.schema[table].fields,
      };
    }
  }
  return schema;
}

/**
 * Parse framework user output
 */
export function parseFrameworkUserOutput(
  options: BetterFrameworkOptions,
  user: FrameworkUser
) {
  const schema = getAllFields(options, "user");
  return parseOutputData(user, { fields: schema });
}

/**
 * Parse framework user input
 */
export function parseFrameworkUserInput(
  options: BetterFrameworkOptions,
  user?: Record<string, any>,
  action?: "create" | "update"
) {
  const schema = getAllFields(options, "user");
  return parseInputData(user || {}, { fields: schema, action });
}

/**
 * Parse framework event output
 */
export function parseFrameworkEventOutput(
  options: BetterFrameworkOptions,
  event: FrameworkEvent
) {
  const schema = getAllFields(options, "event");
  return parseOutputData(event, { fields: schema });
}

/**
 * Parse framework event input
 */
export function parseFrameworkEventInput(
  options: BetterFrameworkOptions,
  event?: Record<string, any>,
  action?: "create" | "update"
) {
  const schema = getAllFields(options, "event");
  return parseInputData(event || {}, { fields: schema, action });
}

/**
 * Merge schema with additional fields from plugins
 */
export function mergeSchema<S extends FrameworkPluginSchema>(
  schema: S,
  newSchema?: {
    [K in keyof S]?: {
      modelName?: string;
      fields?: {
        [P: string]: string;
      };
    };
  }
) {
  if (!newSchema) {
    return schema;
  }
  for (const table in newSchema) {
    const newModelName = newSchema[table]?.modelName;
    if (newModelName) {
      schema[table].modelName = newModelName;
    }
    for (const field in schema[table].fields) {
      const newField = newSchema[table]?.fields?.[field];
      if (!newField) {
        continue;
      }
      schema[table].fields[field].fieldName = newField;
    }
  }
  return schema;
}
