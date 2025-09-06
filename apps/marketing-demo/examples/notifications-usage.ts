/**
 * Demo usage of custom notifications plugin with type safety
 * This shows how you can use your custom plugin without touching the main library
 */

import { marketing } from "../lib/marketing";

// ========================================
// Server-side usage (API routes, server actions, etc.)
// ========================================

export async function createNotificationExample() {
  try {
    // The custom plugin endpoints are accessible through the marketing.api object
    // Note: Due to current type inference limitations, you might need to use
    // the specific endpoint names as defined in the plugin
    const response = await fetch(
      `${marketing.options.baseURL}${marketing.options.basePath}/notification/create`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "Welcome to the Platform!",
          message: "Thank you for signing up. Let's get started!",
          type: "success", // TypeScript knows this must be "info" | "warning" | "error" | "success"
          userId: "user_123",
          priority: "high", // TypeScript knows this must be "low" | "medium" | "high"
          metadata: {
            source: "signup_flow",
            campaign_id: "welcome_series_1",
          },
        }),
      }
    );

    const notification = await response.json();
    console.log("Created notification:", notification);
    return notification;
  } catch (error) {
    console.error("Failed to create notification:", error);
    throw error;
  }
}

export async function getUserNotificationsExample(userId: string) {
  try {
    // Get all notifications for a user
    const allResponse = await fetch(
      `${marketing.options.baseURL}${marketing.options.basePath}/notification/user/${userId}`
    );
    const allNotifications = await allResponse.json();

    // Get only unread notifications with a limit
    const unreadResponse = await fetch(
      `${marketing.options.baseURL}${marketing.options.basePath}/notification/user/${userId}?unreadOnly=true&limit=10`
    );
    const unreadNotifications = await unreadResponse.json();

    console.log("All notifications:", allNotifications);
    console.log("Unread notifications:", unreadNotifications);

    return { allNotifications, unreadNotifications };
  } catch (error) {
    console.error("Failed to get notifications:", error);
    throw error;
  }
}

export async function markNotificationAsReadExample(notificationId: string) {
  try {
    const response = await fetch(
      `${marketing.options.baseURL}${marketing.options.basePath}/notification/mark-read/${notificationId}`,
      {
        method: "PUT",
      }
    );

    const updatedNotification = await response.json();
    console.log("Marked as read:", updatedNotification);
    return updatedNotification;
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
    throw error;
  }
}

// ========================================
// Client-side usage with React client
// ========================================

/**
 * For client-side usage, you would create a marketing client with the
 * notifications client plugin to get type safety:
 *
 * ```typescript
 * import { createMarketingClient } from "better-marketing/client";
 * import { notificationsClientPlugin } from "../lib/plugins/notifications-client-plugin";
 *
 * const marketingClient = createMarketingClient({
 *   baseURL: "http://localhost:3001",
 *   basePath: "/api/marketing",
 *   plugins: [notificationsClientPlugin()],
 * });
 *
 * // Now you have full type safety in the client too!
 * const notification = await marketingClient.createNotification({
 *   title: "Client notification",
 *   message: "This is type-safe!",
 *   type: "info", // TypeScript will enforce the correct types
 *   userId: "user_456",
 *   priority: "medium",
 * });
 * ```
 */

// ========================================
// Combined usage example
// ========================================

export async function notificationWorkflowExample() {
  const userId = "user_789";
  const baseUrl = `${marketing.options.baseURL}${marketing.options.basePath}`;

  try {
    // 1. Create a welcome notification
    const welcomeResponse = await fetch(`${baseUrl}/notification/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Welcome!",
        message: "Welcome to our platform. We're excited to have you!",
        type: "success",
        userId,
        priority: "high",
        metadata: {
          workflow: "user_onboarding",
          step: "welcome",
        },
      }),
    });
    const welcomeNotification = await welcomeResponse.json();

    // 2. Create an informational notification
    const infoResponse = await fetch(`${baseUrl}/notification/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Complete Your Profile",
        message:
          "Don't forget to complete your profile to get the most out of our platform.",
        type: "info",
        userId,
        priority: "medium",
        metadata: {
          workflow: "user_onboarding",
          step: "profile_completion",
        },
      }),
    });
    const infoNotification = await infoResponse.json();

    // 3. Get all notifications for the user
    const userNotificationsResponse = await fetch(
      `${baseUrl}/notification/user/${userId}`
    );
    const userNotifications = await userNotificationsResponse.json();

    console.log(
      `Created ${userNotifications.notifications.length} notifications for user ${userId}`
    );

    // 4. Mark the welcome notification as read
    await fetch(
      `${baseUrl}/notification/mark-read/${welcomeNotification.notification.id}`,
      {
        method: "PUT",
      }
    );

    // 5. Get only unread notifications
    const unreadResponse = await fetch(
      `${baseUrl}/notification/user/${userId}?unreadOnly=true`
    );
    const unreadNotifications = await unreadResponse.json();

    console.log(
      `User has ${unreadNotifications.notifications.length} unread notifications`
    );

    return {
      welcomeNotification,
      infoNotification,
      allNotifications: userNotifications,
      unreadNotifications,
    };
  } catch (error) {
    console.error("Notification workflow failed:", error);
    throw error;
  }
}

// ========================================
// API Route example for Next.js
// ========================================

/**
 * Example API route that uses the custom plugin:
 *
 * ```typescript
 * // app/api/notifications/route.ts
 * import { marketing } from "@/lib/marketing";
 * import { NextRequest } from "next/server";
 *
 * export async function POST(request: NextRequest) {
 *   try {
 *     const body = await request.json();
 *
 *     const notification = await marketing.api.createNotification({
 *       title: body.title,
 *       message: body.message,
 *       type: body.type,
 *       userId: body.userId,
 *       priority: body.priority || "medium",
 *       metadata: body.metadata || {},
 *     });
 *
 *     return Response.json({ success: true, notification });
 *   } catch (error) {
 *     return Response.json({ success: false, error: error.message }, { status: 500 });
 *   }
 * }
 *
 * export async function GET(request: NextRequest) {
 *   try {
 *     const searchParams = request.nextUrl.searchParams;
 *     const userId = searchParams.get("userId");
 *
 *     if (!userId) {
 *       return Response.json({ error: "userId is required" }, { status: 400 });
 *     }
 *
 *     const notifications = await marketing.api.getUserNotifications({
 *       userId,
 *       unreadOnly: searchParams.get("unreadOnly") === "true",
 *       limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
 *     });
 *
 *     return Response.json({ success: true, notifications });
 *   } catch (error) {
 *     return Response.json({ success: false, error: error.message }, { status: 500 });
 *   }
 * }
 * ```
 */
