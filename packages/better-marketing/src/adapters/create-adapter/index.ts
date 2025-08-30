/**
 * Create adapter utility for Better Marketing
 */

import { generateId } from "../../core/utils";
import type {
  Campaign,
  DatabaseAdapter,
  MarketingEvent,
  MarketingUser,
  Segment,
} from "../../types";
import type { BetterMarketingDbSchema, CreateAdapterOptions } from "./types";

export * from "./types";

/**
 * Get the default Better Marketing schema
 */
export function getMarketingSchema(): BetterMarketingDbSchema {
  return {
    marketingUser: {
      modelName: "marketing_users",
      fields: {
        id: { type: "string", required: true, unique: true },
        email: { type: "string", required: true, unique: true },
        firstName: { type: "string", required: false },
        lastName: { type: "string", required: false },
        phone: { type: "string", required: false },
        properties: { type: "json", required: false },
        segments: { type: "json", required: false },
        createdAt: {
          type: "date",
          required: true,
          defaultValue: () => new Date(),
        },
        updatedAt: {
          type: "date",
          required: true,
          defaultValue: () => new Date(),
        },
      },
    },
    marketingEvent: {
      modelName: "marketing_events",
      fields: {
        id: { type: "string", required: true, unique: true },
        userId: {
          type: "string",
          required: true,
          references: { model: "marketing_users", field: "id" },
        },
        eventName: { type: "string", required: true },
        properties: { type: "json", required: false },
        timestamp: {
          type: "date",
          required: true,
          defaultValue: () => new Date(),
        },
        sessionId: { type: "string", required: false },
        source: { type: "string", required: false },
      },
    },
    campaign: {
      modelName: "campaigns",
      fields: {
        id: { type: "string", required: true, unique: true },
        name: { type: "string", required: true },
        type: { type: "string", required: true },
        status: { type: "string", required: true },
        subject: { type: "string", required: false },
        content: { type: "string", required: true },
        segmentIds: { type: "json", required: true },
        scheduledAt: { type: "date", required: false },
        createdAt: {
          type: "date",
          required: true,
          defaultValue: () => new Date(),
        },
        updatedAt: {
          type: "date",
          required: true,
          defaultValue: () => new Date(),
        },
      },
    },
    segment: {
      modelName: "segments",
      fields: {
        id: { type: "string", required: true, unique: true },
        name: { type: "string", required: true },
        description: { type: "string", required: false },
        conditions: { type: "json", required: true },
        userCount: { type: "number", required: false },
        createdAt: {
          type: "date",
          required: true,
          defaultValue: () => new Date(),
        },
        updatedAt: {
          type: "date",
          required: true,
          defaultValue: () => new Date(),
        },
      },
    },
  };
}

/**
 * Create a Better Marketing database adapter
 */
export function createAdapter({
  config,
  adapter,
}: CreateAdapterOptions): DatabaseAdapter {
  const schema = getMarketingSchema();

  // Apply plural table names if configured
  if (config.usePlural) {
    Object.keys(schema).forEach((key) => {
      const model = schema[key as keyof BetterMarketingDbSchema];
      if (!model.modelName.endsWith("s")) {
        model.modelName += "s";
      }
    });
  }

  /**
   * Get the actual field name from the schema
   */
  const getFieldName = ({
    model,
    field,
  }: {
    model: string;
    field: string;
  }): string => {
    // Find the schema model
    const schemaModel = Object.values(schema).find(
      (s) => s.modelName === model
    );
    if (!schemaModel) return field;

    const fieldConfig = schemaModel.fields[field];
    return fieldConfig?.fieldName || field;
  };

  // Create the custom adapter instance
  const adapterInstance = adapter({ getFieldName, schema });

  /**
   * Transform data before storing to database
   */
  const transformToDB = (data: any, model: string): any => {
    const schemaModel = Object.values(schema).find(
      (s) => s.modelName === model
    );
    if (!schemaModel) return data;

    const transformed: any = { ...data };

    for (const [field, value] of Object.entries(data)) {
      const fieldConfig = schemaModel.fields[field];
      if (!fieldConfig) continue;

      // Handle type transformations based on database capabilities
      if (fieldConfig.type === "json" && !config.supportsJSON) {
        transformed[field] = value ? JSON.stringify(value) : null;
      } else if (fieldConfig.type === "boolean" && !config.supportsBooleans) {
        transformed[field] = value ? 1 : 0;
      } else if (fieldConfig.type === "date" && !config.supportsDates) {
        transformed[field] =
          value instanceof Date ? value.toISOString() : value;
      }
    }

    return transformed;
  };

  /**
   * Transform data from database
   */
  const transformFromDB = (data: any, model: string): any => {
    const schemaModel = Object.values(schema).find(
      (s) => s.modelName === model
    );
    if (!schemaModel || !data) return data;

    const transformed: any = { ...data };

    for (const [field, value] of Object.entries(data)) {
      const fieldConfig = schemaModel.fields[field];
      if (!fieldConfig) continue;

      // Handle type transformations from database
      if (
        fieldConfig.type === "json" &&
        !config.supportsJSON &&
        typeof value === "string"
      ) {
        try {
          transformed[field] = JSON.parse(value);
        } catch {
          transformed[field] = value;
        }
      } else if (fieldConfig.type === "boolean" && !config.supportsBooleans) {
        transformed[field] = Boolean(value);
      } else if (
        fieldConfig.type === "date" &&
        !config.supportsDates &&
        typeof value === "string"
      ) {
        transformed[field] = new Date(value);
      }
    }

    return transformed;
  };

  return {
    name: config.adapterName || config.adapterId,

    // User operations
    async createUser(userData) {
      const data = {
        id: generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
        ...userData,
      };

      const transformed = transformToDB(data, schema.marketingUser.modelName);
      const result = await adapterInstance.create<MarketingUser>(
        schema.marketingUser.modelName,
        transformed
      );
      return transformFromDB(result, schema.marketingUser.modelName);
    },

    async getUserById(id) {
      const result = await adapterInstance.findOne<MarketingUser>(
        schema.marketingUser.modelName,
        [{ field: "id", operator: "eq", value: id }]
      );
      return result
        ? transformFromDB(result, schema.marketingUser.modelName)
        : null;
    },

    async getUserByEmail(email) {
      const result = await adapterInstance.findOne<MarketingUser>(
        schema.marketingUser.modelName,
        [{ field: "email", operator: "eq", value: email }]
      );
      return result
        ? transformFromDB(result, schema.marketingUser.modelName)
        : null;
    },

    async updateUser(id, updates) {
      const data = {
        ...updates,
        updatedAt: new Date(),
      };

      const transformed = transformToDB(data, schema.marketingUser.modelName);
      const result = await adapterInstance.update<MarketingUser>(
        schema.marketingUser.modelName,
        [{ field: "id", operator: "eq", value: id }],
        transformed
      );
      return transformFromDB(result, schema.marketingUser.modelName);
    },

    async deleteUser(id) {
      await adapterInstance.delete(schema.marketingUser.modelName, [
        { field: "id", operator: "eq", value: id },
      ]);
    },

    // Event operations
    async createEvent(eventData) {
      const data = {
        id: generateId(),
        timestamp: new Date(),
        ...eventData,
      };

      const transformed = transformToDB(data, schema.marketingEvent.modelName);
      const result = await adapterInstance.create<MarketingEvent>(
        schema.marketingEvent.modelName,
        transformed
      );
      return transformFromDB(result, schema.marketingEvent.modelName);
    },

    async getEventsByUserId(userId, limit = 100) {
      const results = await adapterInstance.findMany<MarketingEvent>(
        schema.marketingEvent.modelName,
        {
          where: [{ field: "userId", operator: "eq", value: userId }],
          limit,
          orderBy: { field: "timestamp", direction: "desc" },
        }
      );
      return results.map((r) =>
        transformFromDB(r, schema.marketingEvent.modelName)
      );
    },

    // Campaign operations
    async createCampaign(campaignData) {
      const data = {
        id: generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
        ...campaignData,
      };

      const transformed = transformToDB(data, schema.campaign.modelName);
      const result = await adapterInstance.create<Campaign>(
        schema.campaign.modelName,
        transformed
      );
      return transformFromDB(result, schema.campaign.modelName);
    },

    async getCampaignById(id) {
      const result = await adapterInstance.findOne<Campaign>(
        schema.campaign.modelName,
        [{ field: "id", operator: "eq", value: id }]
      );
      return result ? transformFromDB(result, schema.campaign.modelName) : null;
    },

    async updateCampaign(id, updates) {
      const data = {
        ...updates,
        updatedAt: new Date(),
      };

      const transformed = transformToDB(data, schema.campaign.modelName);
      const result = await adapterInstance.update<Campaign>(
        schema.campaign.modelName,
        [{ field: "id", operator: "eq", value: id }],
        transformed
      );
      return transformFromDB(result, schema.campaign.modelName);
    },

    async deleteCampaign(id) {
      await adapterInstance.delete(schema.campaign.modelName, [
        { field: "id", operator: "eq", value: id },
      ]);
    },

    // Segment operations
    async createSegment(segmentData) {
      const data = {
        id: generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
        ...segmentData,
      };

      const transformed = transformToDB(data, schema.segment.modelName);
      const result = await adapterInstance.create<Segment>(
        schema.segment.modelName,
        transformed
      );
      return transformFromDB(result, schema.segment.modelName);
    },

    async getSegmentById(id) {
      const result = await adapterInstance.findOne<Segment>(
        schema.segment.modelName,
        [{ field: "id", operator: "eq", value: id }]
      );
      return result ? transformFromDB(result, schema.segment.modelName) : null;
    },

    async updateSegment(id, updates) {
      const data = {
        ...updates,
        updatedAt: new Date(),
      };

      const transformed = transformToDB(data, schema.segment.modelName);
      const result = await adapterInstance.update<Segment>(
        schema.segment.modelName,
        [{ field: "id", operator: "eq", value: id }],
        transformed
      );
      return transformFromDB(result, schema.segment.modelName);
    },

    async deleteSegment(id) {
      await adapterInstance.delete(schema.segment.modelName, [
        { field: "id", operator: "eq", value: id },
      ]);
    },

    async getUsersInSegment(segmentId) {
      // TODO: Implement segment evaluation logic
      // For now, return empty array
      return [];
    },
  };
}
