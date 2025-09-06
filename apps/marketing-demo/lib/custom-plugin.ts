// Example custom plugin for Better Framework
// This shows how to create and add plugins to your marketing framework

import { createMarketingEndpoint } from "better-framework/api/call";
import type { BetterFrameworkPlugin } from "better-framework/types";
import { z } from "zod";

// Custom endpoint functions
const getStatus = () =>
  createMarketingEndpoint(
    "/custom/status",
    {
      method: "GET",
      metadata: { isAction: false },
    },
    async () => {
      return {
        status: "ok",
        message: "Custom plugin is working!",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
      };
    }
  );

const createCustomData = () =>
  createMarketingEndpoint(
    "/custom/data",
    {
      method: "POST",
      metadata: { isAction: true },
      body: z.object({
        name: z.string().min(1, "Name is required"),
        type: z.string().default("default"),
        data: z.record(z.string(), z.unknown()).optional(),
        tags: z.array(z.string()).optional(),
      }),
    },
    async (ctx) => {
      try {
        // Generate a unique ID
        const id =
          ctx.context.generateId({ model: "customData" }) ||
          `custom_${Math.random().toString(36).slice(2, 10)}`;

        const customData = {
          id,
          name: ctx.body.name,
          type: ctx.body.type,
          data: ctx.body.data || {},
          tags: ctx.body.tags || [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Here you could save to database if needed
        // await ctx.context.adapter.create("customData", customData);

        return {
          success: true,
          data: customData,
          message: "Custom data created successfully",
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }
  );

const listCustomData = () =>
  createMarketingEndpoint(
    "/custom/data/list",
    {
      method: "GET",
      metadata: { isAction: false },
      query: z.object({
        page: z.string().optional().default("1"),
        limit: z.string().optional().default("10"),
        type: z.string().optional(),
      }),
    },
    async (ctx) => {
      const page = parseInt(ctx.query.page, 10);
      const limit = parseInt(ctx.query.limit, 10);

      // Mock data - in real implementation, you'd fetch from database
      const mockData = Array.from({ length: 5 }, (_, i) => ({
        id: `custom_${i + 1}`,
        name: `Custom Item ${i + 1}`,
        type: ctx.query.type || "default",
        createdAt: new Date(),
      }));

      return {
        data: mockData.slice((page - 1) * limit, page * limit),
        pagination: {
          page,
          limit,
          total: mockData.length,
          totalPages: Math.ceil(mockData.length / limit),
        },
      };
    }
  );

// Simple server-side plugin
export function myCustomPlugin(): BetterFrameworkPlugin {
  return {
    id: "my-custom-plugin",

    // Initialize the plugin - called when framework starts
    init: () => {
      console.log("Custom plugin initialized with endpoints");
      // Return void for simplicity, or return context/options modifications
    },

    // Define custom endpoints
    endpoints: {
      status: getStatus(),
      createData: createCustomData(),
      listData: listCustomData(),
    },

    // Add custom middlewares
    middlewares: [
      {
        path: "/custom/*",
        middleware: async (ctx: unknown, next: () => Promise<unknown>) => {
          console.log("Custom middleware executed");
          return next();
        },
      },
    ],
  };
}

// ✅ Client-side plugin for the framework client
export function myCustomClientPlugin() {
  return {
    id: "my-custom-plugin",
    // This tells the client about the server plugin's shape for type inference
    $InferServerPlugin: {} as ReturnType<typeof myCustomPlugin>,
  } satisfies import("better-framework/client").MarketingClientPlugin;
}
