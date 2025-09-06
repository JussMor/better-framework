/**
 * Framework database tables schema generator
 */

import type { BetterFrameworkOptions } from "../types";
import { FieldAttribute } from "./field";

export type FrameworkDbSchema = Record<
  string,
  {
    /**
     * The name of the table in the database
     */
    modelName: string;
    /**
     * The fields of the table
     */
    fields: Record<string, FieldAttribute>;
    /**
     * Whether to disable migrations for this table
     * @default false
     */
    disableMigrations?: boolean;
    /**
     * The order of the table
     */
    order?: number;
  }
>;

// this is the new schema definition,

export const getFrameworkTables = (
  options: BetterFrameworkOptions
): FrameworkDbSchema => {
  const pluginSchema = options.plugins?.reduce(
    (acc, plugin) => {
      const schema = plugin.schema;
      if (!schema) return acc;
      for (const [key, value] of Object.entries(schema)) {
        acc[key] = {
          fields: {
            ...acc[key]?.fields,
            ...value.fields,
          },
          modelName: value.modelName || key,
        };
      }
      return acc;
    },
    {} as Record<
      string,
      { fields: Record<string, FieldAttribute>; modelName: string }
    >
  );

  const { user, event, ...pluginTables } = pluginSchema || {};

  return {
    user: {
      modelName: options.user?.modelName || "user",
      fields: {
        email: {
          type: "string",
          unique: true,
          required: true,
          fieldName: options.user?.fields?.email || "email",
          sortable: true,
        },
        firstName: {
          type: "string",
          required: false,
          fieldName: options.user?.fields?.firstName || "firstName",
        },
        lastName: {
          type: "string",
          required: false,
          fieldName: options.user?.fields?.lastName || "lastName",
        },
        phone: {
          type: "string",
          required: false,
          fieldName: options.user?.fields?.phone || "phone",
        },
        properties: {
          type: "json",
          required: false,
          defaultValue: () => ({}),
          fieldName: options.user?.fields?.properties || "properties",
        },
        segments: {
          type: "json",
          required: false,
          defaultValue: () => [],
          fieldName: options.user?.fields?.segments || "segments",
        },
        createdAt: {
          type: "date",
          defaultValue: () => new Date(),
          required: true,
          fieldName: options.user?.fields?.createdAt || "createdAt",
        },
        updatedAt: {
          type: "date",
          defaultValue: () => new Date(),
          onUpdate: () => new Date(),
          required: true,
          fieldName: options.user?.fields?.updatedAt || "updatedAt",
        },
        ...user?.fields,
        ...options.user?.additionalFields,
      },
      order: 1,
    },
    event: {
      modelName: options.event?.modelName || "event",
      fields: {
        userId: {
          type: "string",
          references: {
            model: options.user?.modelName || "user",
            field: "id",
            onDelete: "cascade",
          },
          required: true,
          fieldName: options.event?.fields?.userId || "userId",
        },
        eventName: {
          type: "string",
          required: true,
          fieldName: options.event?.fields?.eventName || "eventName",
        },
        properties: {
          type: "json",
          required: false,
          defaultValue: () => ({}),
          fieldName: options.event?.fields?.properties || "properties",
        },
        timestamp: {
          type: "date",
          defaultValue: () => new Date(),
          required: true,
          fieldName: options.event?.fields?.timestamp || "timestamp",
        },
        sessionId: {
          type: "string",
          required: false,
          fieldName: options.event?.fields?.sessionId || "sessionId",
        },
        source: {
          type: "string",
          required: false,
          fieldName: options.event?.fields?.source || "source",
        },
        ...event?.fields,
        ...options.event?.additionalFields,
      },
      order: 2,
    },
    ...pluginTables,
  } satisfies FrameworkDbSchema;
};
