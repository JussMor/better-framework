/**
 * Database schema definitions for Better Marketing
 */

import type { FieldAttribute } from "./field";

export interface MarketingUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  properties?: Record<string, any>;
  segments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketingEvent {
  id: string;
  userId: string;
  eventName: string;
  properties?: Record<string, any>;
  timestamp: Date;
  sessionId?: string;
  source?: string;
}

export interface Campaign {
  id: string;
  name: string;
  type: "email" | "sms" | "push" | "webhook";
  status: "draft" | "active" | "paused" | "completed";
  subject?: string;
  content: string;
  segmentIds: string[];
  scheduledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Segment {
  id: string;
  name: string;
  description?: string;
  conditions: Array<{
    property: string;
    operator: string;
    value: any;
  }>;
  userCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Marketing database schema definition
 */
export const marketingSchema = {
  marketingUser: {
    modelName: "marketing_users",
    fields: {
      id: {
        type: "string" as const,
        required: true,
        unique: true,
      },
      email: {
        type: "string" as const,
        required: true,
        unique: true,
        transform: {
          input: (value: string) => value.toLowerCase(),
        },
      },
      firstName: {
        type: "string" as const,
        required: false,
      },
      lastName: {
        type: "string" as const,
        required: false,
      },
      phone: {
        type: "string" as const,
        required: false,
      },
      properties: {
        type: "json" as const,
        required: false,
        defaultValue: {},
      },
      segments: {
        type: "json" as const,
        required: false,
        defaultValue: [],
      },
      createdAt: {
        type: "date" as const,
        required: true,
        defaultValue: () => new Date(),
      },
      updatedAt: {
        type: "date" as const,
        required: true,
        defaultValue: () => new Date(),
      },
    } satisfies Record<string, FieldAttribute>,
  },
  marketingEvent: {
    modelName: "marketing_events",
    fields: {
      id: {
        type: "string" as const,
        required: true,
        unique: true,
      },
      userId: {
        type: "string" as const,
        required: true,
        references: {
          model: "marketing_users",
          field: "id",
          onDelete: "cascade",
        },
      },
      eventName: {
        type: "string" as const,
        required: true,
      },
      properties: {
        type: "json" as const,
        required: false,
        defaultValue: {},
      },
      timestamp: {
        type: "date" as const,
        required: true,
        defaultValue: () => new Date(),
      },
      sessionId: {
        type: "string" as const,
        required: false,
      },
      source: {
        type: "string" as const,
        required: false,
      },
    } satisfies Record<string, FieldAttribute>,
  },
  campaign: {
    modelName: "campaigns",
    fields: {
      id: {
        type: "string" as const,
        required: true,
        unique: true,
      },
      name: {
        type: "string" as const,
        required: true,
      },
      type: {
        type: "string" as const,
        required: true,
      },
      status: {
        type: "string" as const,
        required: true,
        defaultValue: "draft",
      },
      subject: {
        type: "string" as const,
        required: false,
      },
      content: {
        type: "string" as const,
        required: true,
      },
      segmentIds: {
        type: "json" as const,
        required: true,
        defaultValue: [],
      },
      scheduledAt: {
        type: "date" as const,
        required: false,
      },
      createdAt: {
        type: "date" as const,
        required: true,
        defaultValue: () => new Date(),
      },
      updatedAt: {
        type: "date" as const,
        required: true,
        defaultValue: () => new Date(),
      },
    } satisfies Record<string, FieldAttribute>,
  },
  segment: {
    modelName: "segments",
    fields: {
      id: {
        type: "string" as const,
        required: true,
        unique: true,
      },
      name: {
        type: "string" as const,
        required: true,
      },
      description: {
        type: "string" as const,
        required: false,
      },
      conditions: {
        type: "json" as const,
        required: true,
        defaultValue: [],
      },
      userCount: {
        type: "number" as const,
        required: false,
      },
      createdAt: {
        type: "date" as const,
        required: true,
        defaultValue: () => new Date(),
      },
      updatedAt: {
        type: "date" as const,
        required: true,
        defaultValue: () => new Date(),
      },
    } satisfies Record<string, FieldAttribute>,
  },
} as const;

export type MarketingDbSchema = typeof marketingSchema;
