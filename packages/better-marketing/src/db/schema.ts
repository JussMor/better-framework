/**
 * Database schema definitions for Better Marketing
 */

import { z } from "zod/v4";
import { BetterMarketingError } from "../error";
import type { BetterMarketingOptions } from "../types";
import { MarketingPluginSchema } from "../types/plugins";
import type { FieldAttribute } from "./field";

/**
 * Marketing database schema definitions using Zod
 */

export const marketingUserSchema = z.object({
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

export const marketingEventSchema = z.object({
  id: z.string(),
  userId: z.string(),
  eventName: z.string(),
  properties: z.record(z.string(), z.any()).default({}),
  timestamp: z.date().default(() => new Date()),
  sessionId: z.string().optional(),
  source: z.string().optional(),
});

export const campaignSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["email", "sms", "push", "webhook"]),
  status: z.enum(["draft", "active", "paused", "completed"]).default("draft"),
  subject: z.string().optional(),
  content: z.string(),
  segmentIds: z.array(z.string()).default([]),
  scheduledAt: z.date().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const segmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  conditions: z
    .array(
      z.object({
        property: z.string(),
        operator: z.string(),
        value: z.any(),
      })
    )
    .default([]),
  userCount: z.number().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const marketingEmailSchema = z.object({
  id: z.string(),
  to: z.string(),
  from: z.string(),
  subject: z.string(),
  content: z.string(),
  status: z.enum(["sent", "failed", "pending"]).default("pending"),
  messageId: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
});

/**
 * Infer TypeScript types from Zod schemas
 */
export type MarketingUser = z.infer<typeof marketingUserSchema>;
export type MarketingEvent = z.infer<typeof marketingEventSchema>;
export type MarketingEmail = z.infer<typeof marketingEmailSchema>;
export type Campaign = z.infer<typeof campaignSchema>;
export type Segment = z.infer<typeof segmentSchema>;

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
      throw new BetterMarketingError(`${key} is required`);
    }
  }
  return parsedData as Partial<T>;
}

/**
 * Get all fields for a specific table including plugin fields
 */
export function getAllFields(options: BetterMarketingOptions, table: string) {
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
 * Parse marketing user output
 */
export function parseMarketingUserOutput(
  options: BetterMarketingOptions,
  user: MarketingUser
) {
  const schema = getAllFields(options, "user");
  return parseOutputData(user, { fields: schema });
}

/**
 * Parse marketing user input
 */
export function parseMarketingUserInput(
  options: BetterMarketingOptions,
  user?: Record<string, any>,
  action?: "create" | "update"
) {
  const schema = getAllFields(options, "user");
  return parseInputData(user || {}, { fields: schema, action });
}

/**
 * Parse marketing event output
 */
export function parseMarketingEventOutput(
  options: BetterMarketingOptions,
  event: MarketingEvent
) {
  const schema = getAllFields(options, "event");
  return parseOutputData(event, { fields: schema });
}

/**
 * Parse marketing event input
 */
export function parseMarketingEventInput(
  options: BetterMarketingOptions,
  event?: Record<string, any>,
  action?: "create" | "update"
) {
  const schema = getAllFields(options, "event");
  return parseInputData(event || {}, { fields: schema, action });
}

/**
 * Parse campaign output
 */
export function parseCampaignOutput(
  options: BetterMarketingOptions,
  campaign: Campaign
) {
  const schema = getAllFields(options, "campaign");
  return parseOutputData(campaign, { fields: schema });
}

/**
 * Parse campaign input
 */
export function parseCampaignInput(
  options: BetterMarketingOptions,
  campaign?: Record<string, any>,
  action?: "create" | "update"
) {
  const schema = getAllFields(options, "campaign");
  return parseInputData(campaign || {}, { fields: schema, action });
}

/**
 * Parse segment output
 */
export function parseSegmentOutput(
  options: BetterMarketingOptions,
  segment: Segment
) {
  const schema = getAllFields(options, "segment");
  return parseOutputData(segment, { fields: schema });
}

/**
 * Parse segment input
 */
export function parseSegmentInput(
  options: BetterMarketingOptions,
  segment?: Record<string, any>,
  action?: "create" | "update"
) {
  const schema = getAllFields(options, "segment");
  return parseInputData(segment || {}, { fields: schema, action });
}

/**
 * Parse marketing email output
 */
export function parseMarketingEmailOutput(
  options: BetterMarketingOptions,
  email: MarketingEmail
) {
  const schema = getAllFields(options, "email");
  return parseOutputData(email, { fields: schema });
}

/**
 * Parse marketing email input
 */
export function parseMarketingEmailInput(
  options: BetterMarketingOptions,
  email?: Record<string, any>,
  action?: "create" | "update"
) {
  const schema = getAllFields(options, "email");
  return parseInputData(email || {}, { fields: schema, action });
}

/**
 * Merge schema with additional fields from plugins
 */
export function mergeSchema<S extends MarketingPluginSchema>(
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
