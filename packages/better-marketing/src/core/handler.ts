/**
 * HTTP request handler for Better Marketing
 */

import type { BetterMarketingConfig, MarketingAPI } from "../types";
import { PluginManager } from "./plugin-manager";

interface RouteHandler {
  method: string;
  path: string;
  handler: (
    request: Request,
    params: Record<string, string>
  ) => Promise<Response>;
}

export function createMarketingHandler(
  config: BetterMarketingConfig,
  api: MarketingAPI,
  pluginManager: PluginManager
): (request: Request) => Promise<Response> {
  const routes: RouteHandler[] = [
    // User routes
    {
      method: "POST",
      path: "/users",
      handler: async (request) => {
        const userData = await request.json();
        const user = await api.user.create(userData);
        return new Response(JSON.stringify(user), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
    {
      method: "GET",
      path: "/users/:id",
      handler: async (request, params) => {
        const user = await api.user.get(params.id);
        if (!user) {
          return new Response("User not found", { status: 404 });
        }
        return new Response(JSON.stringify(user), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
    {
      method: "PUT",
      path: "/users/:id",
      handler: async (request, params) => {
        const updates = await request.json();
        const user = await api.user.update(params.id, updates);
        return new Response(JSON.stringify(user), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
    {
      method: "DELETE",
      path: "/users/:id",
      handler: async (request, params) => {
        await api.user.delete(params.id);
        return new Response("", { status: 204 });
      },
    },

    // Event tracking
    {
      method: "POST",
      path: "/events",
      handler: async (request) => {
        const eventData = await request.json();
        const event = await api.track(eventData);
        return new Response(JSON.stringify(event), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        });
      },
    },

    // Campaign routes
    {
      method: "POST",
      path: "/campaigns",
      handler: async (request) => {
        const campaignData = await request.json();
        const campaign = await api.campaign.create(campaignData);
        return new Response(JSON.stringify(campaign), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
    {
      method: "GET",
      path: "/campaigns/:id",
      handler: async (request, params) => {
        const campaign = await api.campaign.get(params.id);
        if (!campaign) {
          return new Response("Campaign not found", { status: 404 });
        }
        return new Response(JSON.stringify(campaign), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
    {
      method: "PUT",
      path: "/campaigns/:id",
      handler: async (request, params) => {
        const updates = await request.json();
        const campaign = await api.campaign.update(params.id, updates);
        return new Response(JSON.stringify(campaign), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
    {
      method: "DELETE",
      path: "/campaigns/:id",
      handler: async (request, params) => {
        await api.campaign.delete(params.id);
        return new Response("", { status: 204 });
      },
    },
    {
      method: "POST",
      path: "/campaigns/:id/send",
      handler: async (request, params) => {
        const result = await api.campaign.send(params.id);
        return new Response(JSON.stringify(result), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },

    // Segment routes
    {
      method: "POST",
      path: "/segments",
      handler: async (request) => {
        const segmentData = await request.json();
        const segment = await api.segment.create(segmentData);
        return new Response(JSON.stringify(segment), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
    {
      method: "GET",
      path: "/segments/:id",
      handler: async (request, params) => {
        const segment = await api.segment.get(params.id);
        if (!segment) {
          return new Response("Segment not found", { status: 404 });
        }
        return new Response(JSON.stringify(segment), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
    {
      method: "GET",
      path: "/segments/:id/users",
      handler: async (request, params) => {
        const users = await api.segment.getUsers(params.id);
        return new Response(JSON.stringify(users), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },

    // Direct messaging routes
    {
      method: "POST",
      path: "/email/send",
      handler: async (request) => {
        const emailData = await request.json();
        const result = await api.email.send(emailData);
        return new Response(JSON.stringify(result), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
    {
      method: "POST",
      path: "/email/send-bulk",
      handler: async (request) => {
        const bulkData = await request.json();
        const result = await api.email.sendBulk(bulkData);
        return new Response(JSON.stringify(result), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
    {
      method: "POST",
      path: "/sms/send",
      handler: async (request) => {
        const smsData = await request.json();
        const result = await api.sms.send(smsData);
        return new Response(JSON.stringify(result), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
    {
      method: "POST",
      path: "/sms/send-bulk",
      handler: async (request) => {
        const bulkData = await request.json();
        const result = await api.sms.sendBulk(bulkData);
        return new Response(JSON.stringify(result), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  ];

  return async function handler(request: Request): Promise<Response> {
    try {
      // Check origin for CORS
      const origin = request.headers.get("Origin");
      const corsHeaders: Record<string, string> = {
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      };

      if (origin && config.trustedOrigins?.includes(origin)) {
        corsHeaders["Access-Control-Allow-Origin"] = origin;
      }

      // Handle preflight requests
      if (request.method === "OPTIONS") {
        return new Response("", {
          status: 200,
          headers: corsHeaders,
        });
      }

      const url = new URL(request.url);
      const path = url.pathname.replace(config.baseURL || "/api/marketing", "");
      const method = request.method;

      // Find matching route
      const route = findRoute(routes, method, path);
      if (!route) {
        return new Response("Not Found", {
          status: 404,
          headers: corsHeaders,
        });
      }

      // Authenticate request (basic API key for now)
      const authHeader = request.headers.get("Authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return new Response("Unauthorized", {
          status: 401,
          headers: corsHeaders,
        });
      }

      // Call route handler
      const response = await route.handler(request, route.params || {});

      // Add CORS headers to response
      for (const [key, value] of Object.entries(corsHeaders)) {
        response.headers.set(key, value);
      }

      return response;
    } catch (error) {
      console.error("Marketing handler error:", error);
      return new Response(
        JSON.stringify({
          error: "Internal Server Error",
          message: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  };
}

function findRoute(
  routes: RouteHandler[],
  method: string,
  path: string
): (RouteHandler & { params?: Record<string, string> }) | null {
  for (const route of routes) {
    if (route.method !== method) continue;

    const params = matchPath(route.path, path);
    if (params !== null) {
      return { ...route, params };
    }
  }
  return null;
}

function matchPath(
  pattern: string,
  path: string
): Record<string, string> | null {
  const patternParts = pattern.split("/");
  const pathParts = path.split("/");

  if (patternParts.length !== pathParts.length) {
    return null;
  }

  const params: Record<string, string> = {};

  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    const pathPart = pathParts[i];

    if (patternPart.startsWith(":")) {
      // Parameter
      const paramName = patternPart.slice(1);
      params[paramName] = pathPart;
    } else if (patternPart !== pathPart) {
      // Literal mismatch
      return null;
    }
  }

  return params;
}
