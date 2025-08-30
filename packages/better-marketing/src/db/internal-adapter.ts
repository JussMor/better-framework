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
    // Enhanced user operations
    user: {
      async create(
        data: Omit<MarketingUser, "id" | "createdAt" | "updatedAt">
      ): Promise<MarketingUser> {
        const now = new Date();
        const user: MarketingUser = {
          id: generateId({ model: "user" }),
          ...data,
          segments: data.segments || [],
          createdAt: now,
          updatedAt: now,
        };

        logger.debug(`Creating user: ${user.email}`);
        return adapter.createUser(user);
      },

      async findByEmail(email: string): Promise<MarketingUser | null> {
        logger.debug(`Finding user by email: ${email}`);
        return adapter.getUserByEmail(email);
      },

      async update(
        id: string,
        updates: Partial<MarketingUser>
      ): Promise<MarketingUser> {
        const updatedUser = {
          ...updates,
          updatedAt: new Date(),
        };

        logger.debug(`Updating user: ${id}`);
        return adapter.updateUser(id, updatedUser);
      },

      async delete(id: string): Promise<void> {
        logger.debug(`Deleting user: ${id}`);
        return adapter.deleteUser(id);
      },

      async get(id: string): Promise<MarketingUser | null> {
        return adapter.getUserById(id);
      },
    },

    // Enhanced event operations
    event: {
      async create(
        data: Omit<MarketingEvent, "id" | "timestamp">
      ): Promise<MarketingEvent> {
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

      async findByUser(
        userId: string,
        limit?: number
      ): Promise<MarketingEvent[]> {
        logger.debug(`Finding events for user: ${userId}`);
        return adapter.getEventsByUserId(userId);
      },
    },

    // Enhanced campaign operations
    campaign: {
      async create(
        data: Omit<Campaign, "id" | "createdAt" | "updatedAt">
      ): Promise<Campaign> {
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

      async get(id: string): Promise<Campaign | null> {
        return adapter.getCampaignById(id);
      },

      async update(id: string, updates: Partial<Campaign>): Promise<Campaign> {
        const updatedCampaign = {
          ...updates,
          updatedAt: new Date(),
        };

        logger.debug(`Updating campaign: ${id}`);
        return adapter.updateCampaign(id, updatedCampaign);
      },

      async delete(id: string): Promise<void> {
        logger.debug(`Deleting campaign: ${id}`);
        return adapter.deleteCampaign(id);
      },
    },

    // Enhanced segment operations
    segment: {
      async create(
        data: Omit<Segment, "id" | "createdAt" | "updatedAt">
      ): Promise<Segment> {
        const now = new Date();
        const segment: Segment = {
          id: generateId({ model: "segment" }),
          ...data,
          createdAt: now,
          updatedAt: now,
        };

        logger.debug(`Creating segment: ${segment.name}`);
        return adapter.createSegment(segment);
      },

      async get(id: string): Promise<Segment | null> {
        return adapter.getSegmentById(id);
      },

      async update(id: string, updates: Partial<Segment>): Promise<Segment> {
        const updatedSegment = {
          ...updates,
          updatedAt: new Date(),
        };

        logger.debug(`Updating segment: ${id}`);
        return adapter.updateSegment(id, updatedSegment);
      },

      async delete(id: string): Promise<void> {
        logger.debug(`Deleting segment: ${id}`);
        return adapter.deleteSegment(id);
      },

      async getUsers(segmentId: string): Promise<MarketingUser[]> {
        logger.debug(`Getting users in segment: ${segmentId}`);
        return adapter.getUsersInSegment(segmentId);
      },
    },

    // Utility methods
    raw: adapter,
  };
}
