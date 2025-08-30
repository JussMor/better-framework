/**
 * Integration tests for Better Marketing using memory adapter
 */

import { betterMarketing } from "../marketing";

describe("Better Marketing with Memory Adapter", () => {
  let marketing: ReturnType<typeof betterMarketing>;

  beforeEach(async () => {
    // Initialize Better Marketing with default memory adapter
    marketing = betterMarketing({
      secret: "test-secret-key-for-testing-purposes-only",
      baseURL: "http://localhost:3000",
      trustedOrigins: ["http://localhost:3000"],
    } as any);
  });

  describe("User Management", () => {
    it("should create a user", async () => {
      const userData = {
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
      };

      const user = await marketing.api.user.create(userData);

      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.firstName).toBe(userData.firstName);
      expect(user.lastName).toBe(userData.lastName);
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it("should get user by ID", async () => {
      const userData = {
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
      };

      const createdUser = await marketing.api.user.create(userData);
      const retrievedUser = await marketing.api.user.get(createdUser.id);

      expect(retrievedUser).toBeDefined();
      expect(retrievedUser?.id).toBe(createdUser.id);
      expect(retrievedUser?.email).toBe(userData.email);
    });

    it("should get user by email", async () => {
      const userData = {
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
      };

      await marketing.api.user.create(userData);
      const retrievedUser = await marketing.api.user.getByEmail(userData.email);

      expect(retrievedUser).toBeDefined();
      expect(retrievedUser?.email).toBe(userData.email);
    });

    it("should update user", async () => {
      const userData = {
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
      };

      const createdUser = await marketing.api.user.create(userData);
      const updates = {
        firstName: "Updated",
        lastName: "Name",
      };

      const updatedUser = await marketing.api.user.update(
        createdUser.id,
        updates
      );

      expect(updatedUser.firstName).toBe(updates.firstName);
      expect(updatedUser.lastName).toBe(updates.lastName);
      expect(updatedUser.email).toBe(userData.email);
    });

    it("should delete user", async () => {
      const userData = {
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
      };

      const createdUser = await marketing.api.user.create(userData);
      await marketing.api.user.delete(createdUser.id);

      const retrievedUser = await marketing.api.user.get(createdUser.id);
      expect(retrievedUser).toBeNull();
    });
  });

  describe("Event Tracking", () => {
    it("should track an event", async () => {
      const userData = {
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
      };

      const user = await marketing.api.user.create(userData);

      const eventData = {
        userId: user.id,
        eventName: "page_view",
        properties: { page: "/home", referrer: "google.com" },
      };

      const event = await marketing.api.track(eventData);

      expect(event).toBeDefined();
      expect(event.id).toBeDefined();
      expect(event.userId).toBe(user.id);
      expect(event.eventName).toBe(eventData.eventName);
      expect(event.properties).toEqual(eventData.properties);
      expect(event.timestamp).toBeInstanceOf(Date);
    });
  });

  describe("Campaign Management", () => {
    it("should create a campaign", async () => {
      const campaignData = {
        name: "Welcome Campaign",
        type: "email" as const,
        subject: "Welcome to our platform!",
        content: "Welcome email content...",
        segmentIds: [],
      };

      const campaign = await marketing.api.campaign.create(campaignData);

      expect(campaign).toBeDefined();
      expect(campaign.id).toBeDefined();
      expect(campaign.name).toBe(campaignData.name);
      expect(campaign.type).toBe(campaignData.type);
      expect(campaign.status).toBe("draft");
      expect(campaign.createdAt).toBeInstanceOf(Date);
      expect(campaign.updatedAt).toBeInstanceOf(Date);
    });

    it("should get campaign by ID", async () => {
      const campaignData = {
        name: "Welcome Campaign",
        type: "email" as const,
        subject: "Welcome to our platform!",
        content: "Welcome email content...",
        segmentIds: [],
      };

      const createdCampaign = await marketing.api.campaign.create(campaignData);
      const retrievedCampaign = await marketing.api.campaign.get(
        createdCampaign.id
      );

      expect(retrievedCampaign).toBeDefined();
      expect(retrievedCampaign?.id).toBe(createdCampaign.id);
      expect(retrievedCampaign?.name).toBe(campaignData.name);
    });

    it("should update campaign", async () => {
      const campaignData = {
        name: "Welcome Campaign",
        type: "email" as const,
        subject: "Welcome to our platform!",
        content: "Welcome email content...",
        segmentIds: [],
      };

      const createdCampaign = await marketing.api.campaign.create(campaignData);
      const updates = {
        name: "Updated Campaign Name",
        status: "active" as const,
      };

      const updatedCampaign = await marketing.api.campaign.update(
        createdCampaign.id,
        updates
      );

      expect(updatedCampaign.name).toBe(updates.name);
      expect(updatedCampaign.status).toBe(updates.status);
    });

    it("should delete campaign", async () => {
      const campaignData = {
        name: "Welcome Campaign",
        type: "email" as const,
        subject: "Welcome to our platform!",
        content: "Welcome email content...",
        segmentIds: [],
      };

      const createdCampaign = await marketing.api.campaign.create(campaignData);
      await marketing.api.campaign.delete(createdCampaign.id);

      const retrievedCampaign = await marketing.api.campaign.get(
        createdCampaign.id
      );
      expect(retrievedCampaign).toBeNull();
    });
  });

  describe("Segment Management", () => {
    it("should create a segment", async () => {
      const segmentData = {
        name: "Active Users",
        description: "Users who have been active in the last 30 days",
        conditions: [
          {
            property: "lastActivity",
            operator: "greater_than" as const,
            value: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          },
        ],
      };

      const segment = await marketing.api.segment.create(segmentData);

      expect(segment).toBeDefined();
      expect(segment.id).toBeDefined();
      expect(segment.name).toBe(segmentData.name);
      expect(segment.description).toBe(segmentData.description);
      expect(segment.conditions).toEqual(segmentData.conditions);
      expect(segment.createdAt).toBeInstanceOf(Date);
      expect(segment.updatedAt).toBeInstanceOf(Date);
    });

    it("should get segment by ID", async () => {
      const segmentData = {
        name: "Active Users",
        description: "Users who have been active in the last 30 days",
        conditions: [],
      };

      const createdSegment = await marketing.api.segment.create(segmentData);
      const retrievedSegment = await marketing.api.segment.get(
        createdSegment.id
      );

      expect(retrievedSegment).toBeDefined();
      expect(retrievedSegment?.id).toBe(createdSegment.id);
      expect(retrievedSegment?.name).toBe(segmentData.name);
    });

    it("should update segment", async () => {
      const segmentData = {
        name: "Active Users",
        description: "Users who have been active in the last 30 days",
        conditions: [],
      };

      const createdSegment = await marketing.api.segment.create(segmentData);
      const updates = {
        name: "Updated Segment Name",
        description: "Updated description",
      };

      const updatedSegment = await marketing.api.segment.update(
        createdSegment.id,
        updates
      );

      expect(updatedSegment.name).toBe(updates.name);
      expect(updatedSegment.description).toBe(updates.description);
    });

    it("should delete segment", async () => {
      const segmentData = {
        name: "Active Users",
        description: "Users who have been active in the last 30 days",
        conditions: [],
      };

      const createdSegment = await marketing.api.segment.create(segmentData);
      await marketing.api.segment.delete(createdSegment.id);

      const retrievedSegment = await marketing.api.segment.get(
        createdSegment.id
      );
      expect(retrievedSegment).toBeNull();
    });
  });

  describe("Request Handler", () => {
    it("should handle API requests", async () => {
      const request = new Request("http://localhost:3000/api/marketing/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({
          email: "handler-test@example.com",
          firstName: "Handler",
          lastName: "Test",
        }),
      });

      const response = await marketing.handler(request);
      expect(response).toBeDefined();
      expect(response.status).toBe(200);
    });
  });
});
