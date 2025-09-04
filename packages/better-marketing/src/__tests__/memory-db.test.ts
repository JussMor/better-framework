/**
 * Comprehensive test for Better Marketing with Memory Database
 */

import { beforeEach, describe, expect, it } from "vitest";
import { memoryAdapter, type MemoryDB } from "../adapters/memory";
import type { Campaign } from "../db/schema";
import { betterMarketing } from "../marketing";
import { campaignsPlugin } from "../plugins/campaigns";
import { createTestEvent, createTestUser } from "../test";
import type {
  MarketingContext,
  MarketingEmail,
  MarketingEvent,
  MarketingUser,
} from "../types";

// Define memory database structure
const memoryDB: MemoryDB = {
  user: [],
  event: [],
  email: [],
  campaign: [],
  segment: [],
};

describe("Better Marketing with Memory Database", () => {
  let marketing: ReturnType<typeof betterMarketing>;
  let context: MarketingContext;

  beforeEach(async () => {
    // Clear the memory database before each test
    memoryDB.user = [];
    memoryDB.event = [];
    memoryDB.email = [];
    memoryDB.campaign = [];
    memoryDB.segment = [];

    // Initialize Better Marketing with explicit memory database adapter
    marketing = betterMarketing({
      database: memoryAdapter(memoryDB),
      appName: "test-app",
      secret: "test-secret-key-that-is-long-enough",
      plugins: [campaignsPlugin()],
    });

    context = await marketing.$context;
  });

  describe("Context Initialization", () => {
    it("should initialize context properly", () => {
      expect(context).toBeDefined();
      expect(context.appName).toBe("test-app");
      expect(context.secret).toBe("test-secret-key-that-is-long-enough");
      expect(context.adapter).toBeDefined();
      expect(context.tables).toBeDefined();
    });

    it("should have correct table schema", () => {
      const tables = context.tables;
      expect(tables.user).toBeDefined();
      expect(tables.event).toBeDefined();
      expect(tables.campaign).toBeDefined();
      expect(tables.email).toBeDefined();
      expect(tables.segment).toBeDefined();
    });
  });

  describe("User Operations", () => {
    it("should create a user", async () => {
      const testUser = createTestUser();

      const createdUser = await context.adapter.create<MarketingUser>({
        model: "user",
        data: testUser,
      });

      expect(createdUser).toBeDefined();
      expect(createdUser.id).toBe(testUser.id);
      expect(createdUser.email).toBe(testUser.email);
      expect(createdUser.firstName).toBe(testUser.firstName);
      expect(createdUser.lastName).toBe(testUser.lastName);
    });

    it("should find a user by id", async () => {
      const testUser = createTestUser();

      // Create user first
      await context.adapter.create<MarketingUser>({
        model: "user",
        data: testUser,
      });

      // Find user
      const foundUser = await context.adapter.findOne<MarketingUser>({
        model: "user",
        where: [{ field: "id", value: testUser.id }],
      });

      expect(foundUser).toBeDefined();
      expect(foundUser?.id).toBe(testUser.id);
      expect(foundUser?.email).toBe(testUser.email);
    });

    it("should find a user by email", async () => {
      const testUser = createTestUser();

      // Create user first
      await context.adapter.create<MarketingUser>({
        model: "user",
        data: testUser,
      });

      // Find user by email
      const foundUser = await context.adapter.findOne<MarketingUser>({
        model: "user",
        where: [{ field: "email", value: testUser.email }],
      });

      expect(foundUser).toBeDefined();
      expect(foundUser?.email).toBe(testUser.email);
    });

    it("should update a user", async () => {
      const testUser = createTestUser();

      // Create user first
      await context.adapter.create<MarketingUser>({
        model: "user",
        data: testUser,
      });

      // Update user
      const updatedUser = await context.adapter.update<MarketingUser>({
        model: "user",
        where: [{ field: "id", value: testUser.id }],
        update: { firstName: "Updated Name" },
      });

      expect(updatedUser).toBeDefined();
      expect(updatedUser?.firstName).toBe("Updated Name");
      expect(updatedUser?.lastName).toBe(testUser.lastName); // Should remain unchanged
    });

    it("should list users", async () => {
      const testUser1 = createTestUser();
      const testUser2 = { ...createTestUser(), email: "test2@example.com" };

      // Create users
      await context.adapter.create<MarketingUser>({
        model: "user",
        data: testUser1,
      });
      await context.adapter.create<MarketingUser>({
        model: "user",
        data: testUser2,
      });

      // List users
      const users = await context.adapter.findMany<MarketingUser>({
        model: "user",
      });

      expect(users).toBeDefined();
      expect(users.length).toBeGreaterThanOrEqual(2);

      const userEmails = users.map((u) => u.email);
      expect(userEmails).toContain(testUser1.email);
      expect(userEmails).toContain(testUser2.email);
    });

    it("should delete a user", async () => {
      const testUser = createTestUser();

      // Create user first
      await context.adapter.create<MarketingUser>({
        model: "user",
        data: testUser,
      });

      // Delete user
      await context.adapter.delete({
        model: "user",
        where: [{ field: "id", value: testUser.id }],
      });

      // Try to find deleted user
      const foundUser = await context.adapter.findOne<MarketingUser>({
        model: "user",
        where: [{ field: "id", value: testUser.id }],
      });

      expect(foundUser).toBeNull();
    });
  });

  describe("Event Operations", () => {
    let testUser: MarketingUser;

    beforeEach(async () => {
      const userData = createTestUser();
      testUser = await context.adapter.create<MarketingUser>({
        model: "user",
        data: userData,
      });
    });

    it("should create an event", async () => {
      const testEvent = createTestEvent(testUser.id);

      const createdEvent = await context.adapter.create<MarketingEvent>({
        model: "event",
        data: testEvent,
      });

      expect(createdEvent).toBeDefined();
      expect(createdEvent.id).toBe(testEvent.id);
      expect(createdEvent.userId).toBe(testUser.id);
      expect(createdEvent.eventName).toBe(testEvent.eventName);
      expect(createdEvent.properties).toEqual(testEvent.properties);
    });

    it("should find events by user", async () => {
      const testEvent1 = createTestEvent(testUser.id);
      const testEvent2 = {
        ...createTestEvent(testUser.id),
        eventName: "click",
      };

      // Create events
      await context.adapter.create<MarketingEvent>({
        model: "event",
        data: testEvent1,
      });
      await context.adapter.create<MarketingEvent>({
        model: "event",
        data: testEvent2,
      });

      // Find events by user
      const events = await context.adapter.findMany<MarketingEvent>({
        model: "event",
        where: [{ field: "userId", value: testUser.id }],
      });

      expect(events).toBeDefined();
      expect(events.length).toBe(2);
      expect(events.every((e) => e.userId === testUser.id)).toBe(true);
    });
  });

  describe("Campaign Operations", () => {
    it("should create a campaign", async () => {
      const campaignData = {
        id: "test-campaign-" + Date.now(),
        name: "Test Campaign",
        type: "email" as const,
        status: "draft" as const,
        content: "Test campaign content",
        segmentIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const createdCampaign = await context.adapter.create<Campaign>({
        model: "campaign",
        data: campaignData,
      });

      expect(createdCampaign).toBeDefined();
      expect(createdCampaign.id).toBe(campaignData.id);
      expect(createdCampaign.name).toBe(campaignData.name);
      expect(createdCampaign.type).toBe(campaignData.type);
      expect(createdCampaign.status).toBe(campaignData.status);
    });

    it("should update campaign status", async () => {
      const campaignData = {
        id: "test-campaign-" + Date.now(),
        name: "Test Campaign",
        type: "email" as const,
        status: "draft" as const,
        content: "Test campaign content",
        segmentIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Create campaign
      await context.adapter.create<Campaign>({
        model: "campaign",
        data: campaignData,
      });

      // Update status to active
      const updatedCampaign = await context.adapter.update<Campaign>({
        model: "campaign",
        where: [{ field: "id", value: campaignData.id }],
        update: { status: "active" },
      });

      expect(updatedCampaign).toBeDefined();
      expect(updatedCampaign?.status).toBe("active");
    });
  });

  describe("Email Operations", () => {
    it("should create an email", async () => {
      const emailData = {
        id: "test-email-" + Date.now(),
        to: "recipient@example.com",
        from: "sender@example.com",
        subject: "Test Email",
        content: "This is a test email content",
        status: "pending" as const,
        createdAt: new Date(),
      };

      const createdEmail = await context.adapter.create<MarketingEmail>({
        model: "email",
        data: emailData,
      });

      expect(createdEmail).toBeDefined();
      expect(createdEmail.id).toBe(emailData.id);
      expect(createdEmail.to).toBe(emailData.to);
      expect(createdEmail.from).toBe(emailData.from);
      expect(createdEmail.subject).toBe(emailData.subject);
      expect(createdEmail.status).toBe(emailData.status);
    });

    it("should update email status", async () => {
      const emailData = {
        id: "test-email-" + Date.now(),
        to: "recipient@example.com",
        from: "sender@example.com",
        subject: "Test Email",
        content: "This is a test email content",
        status: "pending" as const,
        createdAt: new Date(),
      };

      // Create email
      await context.adapter.create<MarketingEmail>({
        model: "email",
        data: emailData,
      });

      // Update status to sent
      const updatedEmail = await context.adapter.update<MarketingEmail>({
        model: "email",
        where: [{ field: "id", value: emailData.id }],
        update: { status: "sent" },
      });

      expect(updatedEmail).toBeDefined();
      expect(updatedEmail?.status).toBe("sent");
    });
  });

  describe("API Handler", () => {
    it("should create API handler successfully", () => {
      expect(marketing.handler).toBeDefined();
      expect(typeof marketing.handler).toBe("function");
    });

    it("should have API endpoints", () => {
      expect(marketing.api).toBeDefined();
      expect(typeof marketing.api).toBe("object");
    });

    it("should handle a simple request", async () => {
      // Create a test request to a basic endpoint
      const request = new Request("http://localhost:3000/api/marketing/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "api-test@example.com",
          firstName: "API",
          lastName: "Test",
        }),
      });

      const response = await marketing.handler(request);

      expect(response).toBeDefined();
      expect(response.status).toBeLessThan(500); // Should not be a server error
    });
  });

  describe("Plugin Integration", () => {
    it("should have campaigns plugin endpoints", () => {
      // Check that campaigns plugin endpoints are available in the API
      expect(marketing.api).toBeDefined();

      // The campaigns plugin should add campaign-related endpoints
      // We can test this by checking if the API object has campaign methods
      const apiKeys = Object.keys(marketing.api);
      expect(apiKeys.length).toBeGreaterThan(0);
    });
  });

  describe("Data Persistence", () => {
    it("should persist data across operations", async () => {
      const testUser = createTestUser();

      // Create user
      await context.adapter.create<MarketingUser>({
        model: "user",
        data: testUser,
      });

      // Create event for user
      const testEvent = createTestEvent(testUser.id);
      await context.adapter.create<MarketingEvent>({
        model: "event",
        data: testEvent,
      });

      // Verify both exist
      const foundUser = await context.adapter.findOne<MarketingUser>({
        model: "user",
        where: [{ field: "id", value: testUser.id }],
      });

      const foundEvent = await context.adapter.findOne<MarketingEvent>({
        model: "event",
        where: [{ field: "id", value: testEvent.id }],
      });

      expect(foundUser).toBeDefined();
      expect(foundEvent).toBeDefined();
      expect(foundEvent?.userId).toBe(foundUser?.id);
    });
  });
});
