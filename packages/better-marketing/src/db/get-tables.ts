/**
 * Marketing database tables schema generator
 */

import type { BetterMarketingOptions } from "../types";

export interface MarketingDbSchema {
  [key: string]: {
    tableName: string;
    fields: Record<string, any>;
  };
  marketingUser: {
    tableName: string;
    fields: Record<string, any>;
  };
  marketingEvent: {
    tableName: string;
    fields: Record<string, any>;
  };
  marketingEmail: {
    tableName: string;
    fields: Record<string, any>;
  };
  campaign: {
    tableName: string;
    fields: Record<string, any>;
  };
  segment: {
    tableName: string;
    fields: Record<string, any>;
  };
}

export function getMarketingTables(
  options: BetterMarketingOptions
): MarketingDbSchema {
  return {
    marketingUser: {
      tableName: "marketing_users",
      fields: {
        id: { type: "string", required: true, unique: true },
        email: { type: "string", required: true, unique: true },
        firstName: { type: "string", required: false },
        lastName: { type: "string", required: false },
        phone: { type: "string", required: false },
        properties: { type: "json", required: false },
        segments: { type: "json", required: false },
        createdAt: { type: "date", required: true },
        updatedAt: { type: "date", required: true },
      },
    },
    marketingEvent: {
      tableName: "marketing_events",
      fields: {
        id: { type: "string", required: true, unique: true },
        userId: { type: "string", required: true },
        eventName: { type: "string", required: true },
        properties: { type: "json", required: false },
        timestamp: { type: "date", required: true },
        sessionId: { type: "string", required: false },
        source: { type: "string", required: false },
      },
    },
    marketingEmail: {
      tableName: "marketing_emails",
      fields: {
        id: { type: "string", required: true, unique: true },
        to: { type: "string", required: true },
        from: { type: "string", required: true },
        subject: { type: "string", required: true },
        content: { type: "string", required: true },
        status: { type: "string", required: true },
        messageId: { type: "string", required: false },
        createdAt: { type: "date", required: true },
      },
    },
    campaign: {
      tableName: "campaigns",
      fields: {
        id: { type: "string", required: true, unique: true },
        name: { type: "string", required: true },
        type: { type: "string", required: true },
        status: { type: "string", required: true },
        subject: { type: "string", required: false },
        content: { type: "string", required: true },
        segmentIds: { type: "json", required: true },
        scheduledAt: { type: "date", required: false },
        createdAt: { type: "date", required: true },
        updatedAt: { type: "date", required: true },
      },
    },
    segment: {
      tableName: "segments",
      fields: {
        id: { type: "string", required: true, unique: true },
        name: { type: "string", required: true },
        description: { type: "string", required: false },
        conditions: { type: "json", required: true },
        userCount: { type: "number", required: false },
        createdAt: { type: "date", required: true },
        updatedAt: { type: "date", required: true },
      },
    },
  };
}
