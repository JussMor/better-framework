/**
 * Test utilities for Better Marketing
 */

export function createTestUser() {
  return {
    id: "test-user-" + Date.now(),
    email: "test@example.com",
    firstName: "Test",
    lastName: "User",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function createTestEvent(userId: string) {
  return {
    id: "test-event-" + Date.now(),
    userId,
    eventName: "page_view",
    properties: { page: "/test" },
    timestamp: new Date(),
  };
}
