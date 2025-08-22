/**
 * Prisma database adapter for Better Marketing
 */

import type { DatabaseAdapter } from "../../types";

export function prismaAdapter(prisma: any): DatabaseAdapter {
  return {
    name: "prisma",

    // User operations
    async createUser(userData) {
      return await prisma.marketingUser.create({
        data: {
          ...userData,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    },

    async getUserById(id) {
      return await prisma.marketingUser.findUnique({
        where: { id },
      });
    },

    async getUserByEmail(email) {
      return await prisma.marketingUser.findUnique({
        where: { email },
      });
    },

    async updateUser(id, updates) {
      return await prisma.marketingUser.update({
        where: { id },
        data: {
          ...updates,
          updatedAt: new Date(),
        },
      });
    },

    async deleteUser(id) {
      await prisma.marketingUser.delete({
        where: { id },
      });
    },

    // Event operations
    async createEvent(eventData) {
      return await prisma.marketingEvent.create({
        data: eventData,
      });
    },

    async getEventsByUserId(userId, limit = 100) {
      return await prisma.marketingEvent.findMany({
        where: { userId },
        orderBy: { timestamp: "desc" },
        take: limit,
      });
    },

    // Campaign operations
    async createCampaign(campaignData) {
      return await prisma.campaign.create({
        data: {
          ...campaignData,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    },

    async getCampaignById(id) {
      return await prisma.campaign.findUnique({
        where: { id },
      });
    },

    async updateCampaign(id, updates) {
      return await prisma.campaign.update({
        where: { id },
        data: {
          ...updates,
          updatedAt: new Date(),
        },
      });
    },

    async deleteCampaign(id) {
      await prisma.campaign.delete({
        where: { id },
      });
    },

    // Segment operations
    async createSegment(segmentData) {
      return await prisma.segment.create({
        data: {
          ...segmentData,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    },

    async getSegmentById(id) {
      return await prisma.segment.findUnique({
        where: { id },
      });
    },

    async updateSegment(id, updates) {
      return await prisma.segment.update({
        where: { id },
        data: {
          ...updates,
          updatedAt: new Date(),
        },
      });
    },

    async deleteSegment(id) {
      await prisma.segment.delete({
        where: { id },
      });
    },

    async getUsersInSegment(segmentId) {
      // This would need a more complex implementation based on segment conditions
      // For now, return empty array
      return [];
    },
  };
}
