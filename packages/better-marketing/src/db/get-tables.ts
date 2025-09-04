/**
 * Marketing database tables schema generator
 */

import type { BetterMarketingOptions } from "../types";
import { FieldAttribute } from "./field";

export type MarketingDbSchema = Record<
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

export const getMarketingTables = (
  options: BetterMarketingOptions
): MarketingDbSchema => {
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

  const { user, event, campaign, segment, email, ...pluginTables } =
    pluginSchema || {};

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
    campaign: {
      modelName: options.campaign?.modelName || "campaign",
      fields: {
        name: {
          type: "string",
          required: true,
          fieldName: options.campaign?.fields?.name || "name",
        },
        type: {
          type: "string",
          required: true,
          fieldName: options.campaign?.fields?.type || "type",
        },
        status: {
          type: "string",
          required: true,
          defaultValue: () => "draft",
          fieldName: options.campaign?.fields?.status || "status",
        },
        subject: {
          type: "string",
          required: false,
          fieldName: options.campaign?.fields?.subject || "subject",
        },
        content: {
          type: "string",
          required: true,
          fieldName: options.campaign?.fields?.content || "content",
        },
        segmentIds: {
          type: "json",
          required: false,
          defaultValue: () => [],
          fieldName: options.campaign?.fields?.segmentIds || "segmentIds",
        },
        scheduledAt: {
          type: "date",
          required: false,
          fieldName: options.campaign?.fields?.scheduledAt || "scheduledAt",
        },
        createdAt: {
          type: "date",
          defaultValue: () => new Date(),
          required: true,
          fieldName: options.campaign?.fields?.createdAt || "createdAt",
        },
        updatedAt: {
          type: "date",
          defaultValue: () => new Date(),
          onUpdate: () => new Date(),
          required: true,
          fieldName: options.campaign?.fields?.updatedAt || "updatedAt",
        },
        ...campaign?.fields,
        ...options.campaign?.additionalFields,
      },
      order: 3,
    },
    segment: {
      modelName: options.segment?.modelName || "segment",
      fields: {
        name: {
          type: "string",
          required: true,
          fieldName: options.segment?.fields?.name || "name",
        },
        description: {
          type: "string",
          required: false,
          fieldName: options.segment?.fields?.description || "description",
        },
        conditions: {
          type: "json",
          required: false,
          defaultValue: () => [],
          fieldName: options.segment?.fields?.conditions || "conditions",
        },
        userCount: {
          type: "number",
          required: false,
          fieldName: options.segment?.fields?.userCount || "userCount",
        },
        createdAt: {
          type: "date",
          defaultValue: () => new Date(),
          required: true,
          fieldName: options.segment?.fields?.createdAt || "createdAt",
        },
        updatedAt: {
          type: "date",
          defaultValue: () => new Date(),
          onUpdate: () => new Date(),
          required: true,
          fieldName: options.segment?.fields?.updatedAt || "updatedAt",
        },
        ...segment?.fields,
        ...options.segment?.additionalFields,
      },
      order: 4,
    },
    email: {
      modelName: options.email?.modelName || "email",
      fields: {
        to: {
          type: "string",
          required: true,
          fieldName: options.email?.fields?.to || "to",
        },
        from: {
          type: "string",
          required: true,
          fieldName: options.email?.fields?.from || "from",
        },
        subject: {
          type: "string",
          required: true,
          fieldName: options.email?.fields?.subject || "subject",
        },
        content: {
          type: "string",
          required: true,
          fieldName: options.email?.fields?.content || "content",
        },
        status: {
          type: "string",
          required: true,
          defaultValue: () => "pending",
          fieldName: options.email?.fields?.status || "status",
        },
        messageId: {
          type: "string",
          required: false,
          fieldName: options.email?.fields?.messageId || "messageId",
        },
        createdAt: {
          type: "date",
          defaultValue: () => new Date(),
          required: true,
          fieldName: options.email?.fields?.createdAt || "createdAt",
        },
        ...email?.fields,
        ...options.email?.additionalFields,
      },
      order: 5,
    },
    ...pluginTables,
  } satisfies MarketingDbSchema;
};
