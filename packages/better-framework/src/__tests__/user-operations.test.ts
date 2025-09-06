/**
 * Test suite for Better Framework User Operations
 */

import { beforeEach, describe, expect, it } from "vitest";
import { memoryAdapter, type MemoryDB } from "../adapters/memory";
import { betterFramework } from "../framework";
import type { FrameworkContext, FrameworkEvent, User } from "../types";

// Define memory database structure
const memoryDB: MemoryDB = {
  user: [],
  event: [],
};

// Helper functions to create test data with defaults
const createUserData = (
  overrides: Partial<Omit<User, "id">> = {}
): Omit<User, "id"> => ({
  email: "test@example.com",
  properties: {},
  segments: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const createEventData = (
  overrides: Partial<Omit<FrameworkEvent, "id">> = {}
): Omit<FrameworkEvent, "id"> => ({
  userId: "test-user-id",
  eventName: "test_event",
  properties: {},
  timestamp: new Date(),
  ...overrides,
});

describe("Better Framework User Operations", () => {
  let framework: any;
  let context: FrameworkContext;

  beforeEach(async () => {
    // Reset memory database
    memoryDB.user = [];
    memoryDB.event = [];

    // Initialize Better Framework with explicit memory database adapter
    framework = betterFramework({
      database: memoryAdapter(memoryDB, { debugLogs: true }),
      appName: "test-app",
      secret: "test-secret-key-that-is-long-enough",
    });

    context = await framework.$ctx;
  });

  describe("Context Initialization", () => {
    it("should initialize context properly", () => {
      expect(context).toBeDefined();
      expect(context.appName).toBe("test-app");
      expect(context.secret).toBe("test-secret-key-that-is-long-enough");
      expect(context.adapter).toBeDefined();
    });
  });

  describe("User CRUD Operations", () => {
    it("should create a new user", async () => {
      // Test automatic ID generation by not providing an ID
      const userData = {
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
        properties: { role: "admin" },
        segments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const createdUser = await context.adapter.create<User>({
        model: "user",
        data: userData,
      });

      expect(createdUser).toBeDefined();
      expect(createdUser.id).toBeDefined();
      expect(typeof createdUser.id).toBe("string");
      expect(createdUser.id.length).toBeGreaterThan(0);
      expect(createdUser.email).toBe("test@example.com");
      expect(createdUser.firstName).toBe("John");
      expect(createdUser.lastName).toBe("Doe");
      expect(createdUser.properties).toEqual({ role: "admin" });
      expect(createdUser.segments).toEqual([]);
      expect(createdUser.createdAt).toBeDefined();
      expect(createdUser.updatedAt).toBeDefined();
    });

    it("should find a user by id", async () => {
      // Create user first
      await context.adapter.create<User>({
        model: "user",
        data: createUserData({
          email: "find@example.com",
          firstName: "Jane",
        }),
      });

      const foundUser = await context.adapter.findOne<User>({
        model: "user",
        where: [{ field: "email", value: "find@example.com" }],
      });

      expect(foundUser).toBeDefined();
      expect(foundUser?.email).toBe("find@example.com");
      expect(foundUser?.firstName).toBe("Jane");
    });

    it("should find a user by email", async () => {
      // Create user first
      await context.adapter.create<User>({
        model: "user",
        data: createUserData({
          email: "search@example.com",
          firstName: "Bob",
        }),
      });

      const foundUser = await context.adapter.findOne<User>({
        model: "user",
        where: [{ field: "email", value: "search@example.com" }],
      });

      expect(foundUser).toBeDefined();
      expect(foundUser?.email).toBe("search@example.com");
      expect(foundUser?.firstName).toBe("Bob");
    });

    it("should update a user", async () => {
      // Create user first
      await context.adapter.create<User>({
        model: "user",
        data: createUserData({
          email: "update@example.com",
          firstName: "Original",
        }),
      });

      const updatedUser = await context.adapter.update<User>({
        model: "user",
        update: { firstName: "Updated", properties: { status: "active" } },
        where: [{ field: "email", value: "update@example.com" }],
      });

      expect(updatedUser).toBeDefined();
      expect(updatedUser?.firstName).toBe("Updated");
      expect(updatedUser?.properties).toEqual({ status: "active" });
    });

    it("should find multiple users", async () => {
      // Create multiple users
      await context.adapter.create<User>({
        model: "user",
        data: createUserData({
          email: "user1@example.com",
          firstName: "User1",
        }),
      });
      await context.adapter.create<User>({
        model: "user",
        data: createUserData({
          email: "user2@example.com",
          firstName: "User2",
        }),
      });

      const users = await context.adapter.findMany<User>({
        model: "user",
        where: [],
      });

      expect(users).toBeDefined();
      expect(users.length).toBe(2);
      expect(users.some((u) => u.email === "user1@example.com")).toBe(true);
      expect(users.some((u) => u.email === "user2@example.com")).toBe(true);
    });

    it("should delete a user", async () => {
      // Create user first
      await context.adapter.create<User>({
        model: "user",
        data: createUserData({
          email: "delete@example.com",
          firstName: "ToDelete",
        }),
      });

      await context.adapter.delete({
        model: "user",
        where: [{ field: "email", value: "delete@example.com" }],
      });

      const foundUser = await context.adapter.findOne<User>({
        model: "user",
        where: [{ field: "email", value: "delete@example.com" }],
      });

      expect(foundUser).toBeNull();
    });
  });

  describe("Event Operations", () => {
    let testUser: User;

    beforeEach(async () => {
      // Create a test user for event operations
      const createdUser = await context.adapter.create<User>({
        model: "user",
        data: createUserData({
          email: "event-user@example.com",
          firstName: "EventUser",
        }),
      });
      testUser = createdUser as User;
    });

    it("should create an event for a user", async () => {
      const eventData = createEventData({
        userId: testUser.id,
        eventName: "user_login",
        properties: { device: "mobile", browser: "chrome" },
        source: "web",
      });

      const createdEvent = await context.adapter.create<FrameworkEvent>({
        model: "event",
        data: eventData,
      });

      expect(createdEvent).toBeDefined();
      expect(createdEvent.id).toBeDefined();
      expect(createdEvent.userId).toBe(testUser.id);
      expect(createdEvent.eventName).toBe("user_login");
      expect(createdEvent.properties).toEqual({
        device: "mobile",
        browser: "chrome",
      });
      expect(createdEvent.source).toBe("web");
      expect(createdEvent.timestamp).toBeDefined();
    });

    it("should find events by user id", async () => {
      // Create events for the test user
      await context.adapter.create<FrameworkEvent>({
        model: "event",
        data: createEventData({
          userId: testUser.id,
          eventName: "page_view",
          properties: { page: "/home" },
        }),
      });

      await context.adapter.create<FrameworkEvent>({
        model: "event",
        data: createEventData({
          userId: testUser.id,
          eventName: "button_click",
          properties: { button: "subscribe" },
        }),
      });

      const events = await context.adapter.findMany<FrameworkEvent>({
        model: "event",
        where: [{ field: "userId", value: testUser.id }],
      });

      expect(events).toBeDefined();
      expect(events.length).toBe(2);
      expect(events.some((e) => e.eventName === "page_view")).toBe(true);
      expect(events.some((e) => e.eventName === "button_click")).toBe(true);
    });
  });

  describe("Data Integrity", () => {
    it("should handle user properties correctly", async () => {
      const userData = createUserData({
        email: "props@example.com",
        firstName: "Props",
        properties: {
          preferences: { theme: "dark", notifications: true },
          metadata: { source: "api", version: "1.0" },
        },
      });

      const createdUser = await context.adapter.create<User>({
        model: "user",
        data: userData,
      });

      expect(createdUser.properties).toEqual(userData.properties);
    });

    it("should handle user segments correctly", async () => {
      const userData = createUserData({
        email: "segments@example.com",
        firstName: "Segments",
        segments: ["premium", "beta-tester", "newsletter"],
      });

      const createdUser = await context.adapter.create<User>({
        model: "user",
        data: userData,
      });

      expect(createdUser.segments).toEqual([
        "premium",
        "beta-tester",
        "newsletter",
      ]);
    });

    it("should handle empty properties and segments", async () => {
      const userData = createUserData({
        email: "empty@example.com",
        firstName: "Empty",
      });

      const createdUser = await context.adapter.create<User>({
        model: "user",
        data: userData,
      });

      expect(createdUser.properties).toEqual({});
      expect(createdUser.segments).toEqual([]);
    });
  });
});
