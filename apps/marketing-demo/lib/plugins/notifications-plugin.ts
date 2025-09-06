import {
  BetterMarketingPlugin,
  createMarketingEndpoint,
} from "better-marketing";
import { z } from "zod";

const createNotification = () =>
  createMarketingEndpoint(
    "/notification/create",
    {
      method: "POST",
      metadata: { isAction: true },
      body: z.object({
        title: z.string(),
        message: z.string(),
        type: z.enum(["info", "warning", "error", "success"]).default("info"),
        userId: z.string(),
        priority: z.enum(["low", "medium", "high"]).default("medium"),
        metadata: z.record(z.string(), z.any()).optional(),
      }),
    },
    async (ctx) => {
      try {
        const now = new Date();
        const id = ctx.context.generateId({ model: "notification" });

        const notificationData = {
          id,
          title: ctx.body.title,
          message: ctx.body.message,
          type: ctx.body.type,
          userId: ctx.body.userId,
          priority: ctx.body.priority,
          metadata: ctx.body.metadata || {},
          read: false,
          createdAt: now,
          updatedAt: now,
        };

        // Store in database using the adapter
        await ctx.context.adapter.create({
          model: "notification",
          data: notificationData,
        });

        return { notification: notificationData };
      } catch (error) {
        console.error("Notification creation error:", error);
        throw error;
      }
    }
  );

const getNotification = () =>
  createMarketingEndpoint(
    "/notification/get/:id",
    {
      method: "GET",
      metadata: { isAction: true },
      params: z.object({ id: z.string() }),
    },
    async (ctx) => {
      const notification = await ctx.context.adapter.findOne({
        model: "notification",
        where: [{ field: "id", value: ctx.params.id }],
      });

      if (!notification) {
        throw new Error(`Notification with id ${ctx.params.id} not found`);
      }

      return { notification };
    }
  );

const getUserNotifications = () =>
  createMarketingEndpoint(
    "/notification/user/:userId",
    {
      method: "GET",
      metadata: { isAction: true },
      params: z.object({ userId: z.string() }),
      query: z.object({
        unreadOnly: z.boolean().optional(),
        limit: z.number().optional(),
      }),
    },
    async (ctx) => {
      const where: any[] = [{ field: "userId", value: ctx.params.userId }];

      if (ctx.query.unreadOnly) {
        where.push({ field: "read", value: false });
      }

      const notifications = await ctx.context.adapter.findMany({
        model: "notification",
        where,
        limit: ctx.query.limit,
        sortBy: { field: "createdAt", direction: "desc" },
      });

      return { notifications: notifications || [] };
    }
  );

const markAsRead = () =>
  createMarketingEndpoint(
    "/notification/mark-read/:id",
    {
      method: "PUT",
      metadata: { isAction: true },
      params: z.object({ id: z.string() }),
    },
    async (ctx) => {
      const notification = await ctx.context.adapter.update({
        model: "notification",
        where: [{ field: "id", value: ctx.params.id }],
        update: {
          read: true,
          updatedAt: new Date(),
        },
      });

      return { notification };
    }
  );

const deleteNotification = () =>
  createMarketingEndpoint(
    "/notification/delete/:id",
    {
      method: "DELETE",
      metadata: { isAction: true },
      params: z.object({ id: z.string() }),
    },
    async (ctx) => {
      await ctx.context.adapter.delete({
        model: "notification",
        where: [{ field: "id", value: ctx.params.id }],
      });

      return { success: true };
    }
  );

// Export the plugin
export const notificationsPlugin = () =>
  ({
    id: "notifications",
    endpoints: {
      createNotification: createNotification(),
      getNotification: getNotification(),
      getUserNotifications: getUserNotifications(),
      markAsRead: markAsRead(),
      deleteNotification: deleteNotification(),
    },
    // Optional: Define database schema for the notification table
    schema: {
      notification: {
        fields: {
          title: {
            type: "string" as const,
            required: true,
          },
          message: {
            type: "string" as const,
            required: true,
          },
          type: {
            type: "string" as const,
            required: true,
            defaultValue: "info",
          },
          userId: {
            type: "string" as const,
            required: true,
          },
          priority: {
            type: "string" as const,
            required: true,
            defaultValue: "medium",
          },
          metadata: {
            type: "json" as const, // JSON type for metadata
            required: false,
          },
          read: {
            type: "boolean" as const,
            required: true,
            defaultValue: false,
          },
          createdAt: {
            type: "date" as const,
            required: true,
            input: false, // Auto-generated
          },
          updatedAt: {
            type: "date" as const,
            required: true,
            input: false, // Auto-generated
          },
        },
      },
    },
  }) satisfies BetterMarketingPlugin;

export type NotificationsPlugin = ReturnType<typeof notificationsPlugin>;
