/**
 * Internal adapter with enhanced functionality for Better Marketing
 */

import type {
  BetterMarketingOptions,
  Campaign,
  DatabaseAdapter,
  MarketingEvent,
  MarketingUser,
  Segment,
} from "../types";
import type { Logger } from "../utils/logger";

export interface InternalAdapterContext {
  options: BetterMarketingOptions;
  logger: Logger;
  generateId: (options: { model: string; size?: number }) => string;
}

export function createInternalAdapter(
  adapter: DatabaseAdapter,
  ctx: InternalAdapterContext
) {
  const { options, logger, generateId } = ctx;

  return {
    // User operations - flattened to match Better Auth pattern
    createUser: async (
      data:
        | (Omit<MarketingUser, "id" | "createdAt" | "updatedAt"> & {
            id?: string;
          })
        | (Partial<MarketingUser> & { id?: string })
    ): Promise<MarketingUser> => {
      const now = new Date();
      const userId =
        "id" in data && data.id ? data.id : generateId({ model: "user" });
      const user: MarketingUser = {
        id: userId,
        email: data.email || "",
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        properties: data.properties || {},
        segments: data.segments || [],
        createdAt: now,
        updatedAt: now,
      };

      logger.debug(`Creating user: ${user.email}`);
      return adapter.createUser(user);
    },

    findUserByEmail: async (email: string): Promise<MarketingUser | null> => {
      logger.debug(`Finding user by email: ${email}`);
      return adapter.getUserByEmail(email);
    },

    getUserById: async (id: string): Promise<MarketingUser | null> => {
      return adapter.getUserById(id);
    },

    updateUser: async (
      id: string,
      updates: Partial<MarketingUser>
    ): Promise<MarketingUser> => {
      const updatedUser = {
        ...updates,
        updatedAt: new Date(),
      };

      logger.debug(`Updating user: ${id}`);
      return adapter.updateUser(id, updatedUser);
    },

    deleteUser: async (id: string): Promise<void> => {
      logger.debug(`Deleting user: ${id}`);
      return adapter.deleteUser(id);
    },
    // Event operations - flattened to match Better Auth pattern
    createEvent: async (
      data: Omit<MarketingEvent, "id" | "timestamp">
    ): Promise<MarketingEvent> => {
      const event: MarketingEvent = {
        id: generateId({ model: "event" }),
        ...data,
        timestamp: new Date(),
      };

      logger.debug(
        `Tracking event: ${event.eventName} for user: ${event.userId}`
      );
      return adapter.createEvent(event);
    },

    getEventsByUserId: async (
      userId: string,
      limit?: number
    ): Promise<MarketingEvent[]> => {
      logger.debug(`Finding events for user: ${userId}`);
      return adapter.getEventsByUserId(userId);
    },
    // Campaign operations - flattened to match Better Auth pattern
    createCampaign: async (
      data: Omit<Campaign, "id" | "createdAt" | "updatedAt">
    ): Promise<Campaign> => {
      const now = new Date();
      const campaign: Campaign = {
        id: generateId({ model: "campaign" }),
        ...data,
        createdAt: now,
        updatedAt: now,
      };

      logger.debug(`Creating campaign: ${campaign.name}`);
      return adapter.createCampaign(campaign);
    },

    getCampaignById: async (id: string): Promise<Campaign | null> => {
      return adapter.getCampaignById(id);
    },

    updateCampaign: async (
      id: string,
      updates: Partial<Campaign>
    ): Promise<Campaign> => {
      const updatedCampaign = {
        ...updates,
        updatedAt: new Date(),
      };

      logger.debug(`Updating campaign: ${id}`);
      return adapter.updateCampaign(id, updatedCampaign);
    },

    deleteCampaign: async (id: string): Promise<void> => {
      logger.debug(`Deleting campaign: ${id}`);
      return adapter.deleteCampaign(id);
    },
    raw: adapter,
  };
}
