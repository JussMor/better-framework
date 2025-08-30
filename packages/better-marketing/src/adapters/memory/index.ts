/**
 * Memory adapter for Better Marketing - for development and testing
 */

import type {
  BetterMarketingOptions,
  Campaign,
  DatabaseAdapter,
  MarketingEvent,
  MarketingUser,
  Segment,
} from "../../types";

interface MemoryDB {
  marketingUser: MarketingUser[];
  marketingEvent: MarketingEvent[];
  campaign: Campaign[];
  segment: Segment[];
}

export const memoryAdapter =
  (memoryDB: Partial<MemoryDB> = {}) =>
  (options: BetterMarketingOptions): DatabaseAdapter => {
    const db: MemoryDB = {
      marketingUser: [],
      marketingEvent: [],
      campaign: [],
      segment: [],
      ...memoryDB,
    };

    return {
      name: "memory-adapter",

      // User operations
      async createUser(
        user: Omit<MarketingUser, "id" | "createdAt" | "updatedAt">
      ): Promise<MarketingUser> {
        const fullUser: MarketingUser = {
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
          ...user,
        };
        db.marketingUser.push(fullUser);
        return fullUser;
      },

      async getUserById(id: string): Promise<MarketingUser | null> {
        return db.marketingUser.find((u) => u.id === id) || null;
      },

      async getUserByEmail(email: string): Promise<MarketingUser | null> {
        return db.marketingUser.find((u) => u.email === email) || null;
      },

      async updateUser(
        id: string,
        updates: Partial<MarketingUser>
      ): Promise<MarketingUser> {
        const index = db.marketingUser.findIndex((u) => u.id === id);
        if (index === -1) {
          throw new Error(`User with id ${id} not found`);
        }

        const user = { ...db.marketingUser[index], ...updates };
        db.marketingUser[index] = user;
        return user;
      },

      async deleteUser(id: string): Promise<void> {
        const index = db.marketingUser.findIndex((u) => u.id === id);
        if (index !== -1) {
          db.marketingUser.splice(index, 1);
        }
      },

      // Event operations
      async createEvent(
        event: Omit<MarketingEvent, "id" | "timestamp">
      ): Promise<MarketingEvent> {
        const fullEvent: MarketingEvent = {
          id: crypto.randomUUID(),
          timestamp: new Date(),
          ...event,
        };
        db.marketingEvent.push(fullEvent);
        return fullEvent;
      },

      async getEventsByUserId(userId: string): Promise<MarketingEvent[]> {
        return db.marketingEvent.filter((e) => e.userId === userId);
      },

      // Campaign operations
      async createCampaign(
        campaign: Omit<Campaign, "id" | "createdAt" | "updatedAt">
      ): Promise<Campaign> {
        const fullCampaign: Campaign = {
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
          ...campaign,
        };
        db.campaign.push(fullCampaign);
        return fullCampaign;
      },

      async getCampaignById(id: string): Promise<Campaign | null> {
        return db.campaign.find((c) => c.id === id) || null;
      },

      async updateCampaign(
        id: string,
        updates: Partial<Campaign>
      ): Promise<Campaign> {
        const index = db.campaign.findIndex((c) => c.id === id);
        if (index === -1) {
          throw new Error(`Campaign with id ${id} not found`);
        }

        const campaign = { ...db.campaign[index], ...updates };
        db.campaign[index] = campaign;
        return campaign;
      },

      async deleteCampaign(id: string): Promise<void> {
        const index = db.campaign.findIndex((c) => c.id === id);
        if (index !== -1) {
          db.campaign.splice(index, 1);
        }
      },

      // Segment operations
      async createSegment(
        segment: Omit<Segment, "id" | "createdAt" | "updatedAt">
      ): Promise<Segment> {
        const fullSegment: Segment = {
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
          ...segment,
        };
        db.segment.push(fullSegment);
        return fullSegment;
      },

      async getSegmentById(id: string): Promise<Segment | null> {
        return db.segment.find((s) => s.id === id) || null;
      },

      async updateSegment(
        id: string,
        updates: Partial<Segment>
      ): Promise<Segment> {
        const index = db.segment.findIndex((s) => s.id === id);
        if (index === -1) {
          throw new Error(`Segment with id ${id} not found`);
        }

        const segment = { ...db.segment[index], ...updates };
        db.segment[index] = segment;
        return segment;
      },

      async deleteSegment(id: string): Promise<void> {
        const index = db.segment.findIndex((s) => s.id === id);
        if (index !== -1) {
          db.segment.splice(index, 1);
        }
      },

      async getUsersInSegment(segmentId: string): Promise<MarketingUser[]> {
        // Simple implementation - in reality this would evaluate segment conditions
        return db.marketingUser.filter((u) => u.segments?.includes(segmentId));
      },
    };
  };
