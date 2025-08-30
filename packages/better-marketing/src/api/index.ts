import { APIError, type Middleware, createRouter } from "better-call";
import type { MarketingContext } from "../types";
import { getAnalytics, trackEvent } from "./routes/analytics";
import {
  createCampaign,
  deleteCampaign,
  getCampaign,
  updateCampaign,
} from "./routes/campaign";
import { sendBulkEmail, sendEmail } from "./routes/email";
import { createUser, deleteUser, getUser, updateUser } from "./routes/user";
import { toMarketingEndpoints } from "./to-marketing-endpoints";

function originCheckMiddlewareFactory(ctx: MarketingContext): Middleware {
  const m: Middleware = async (
    req: Request,
    next: (r: Request) => Promise<Response>
  ) => {
    const origin = req.headers.get("Origin");
    const corsHeaders: Record<string, string> = {
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };
    if (origin && ctx.options.trustedOrigins?.includes(origin)) {
      // attach CORS header on the response via next
      const res = await next(req);
      res.headers.set("Access-Control-Allow-Origin", origin);
      for (const [k, v] of Object.entries(corsHeaders)) {
        res.headers.set(k, v);
      }
      return res;
    }

    // Allow preflight without auth check
    if (req.method === "OPTIONS") {
      return new Response("", { status: 200, headers: corsHeaders });
    }

    return next(req);
  };
  return m;
}

export function getEndpoints(
  ctx: Promise<MarketingContext> | MarketingContext,
  options?: any
) {
  const pluginEndpoints = options?.plugins?.reduce(
    (acc: any, plugin: any) => {
      return {
        ...acc,
        ...plugin.endpoints,
      };
    },
    {} as Record<string, any>
  );

  const middlewares =
    options?.plugins
      ?.map((plugin: any) =>
        plugin.middlewares?.map((m: any) => {
          const middleware = (async (context: any) => {
            const marketingCtx = await ctx;
            return m.middleware({
              ...context,
              context: {
                ...marketingCtx,
                ...context.context,
              },
            });
          }) as Middleware;
          middleware.options = m.middleware.options;
          return {
            path: m.path,
            middleware,
          };
        })
      )
      .filter((p: any) => p !== undefined)
      .flat() || [];

  // Create base marketing endpoints similar to Better Auth
  const baseEndpoints = {
    // User management
    createUser: createUser(),
    getUser: getUser(),
    updateUser: updateUser(),
    deleteUser: deleteUser(),

    // Campaign management
    createCampaign: createCampaign(),
    getCampaign: getCampaign(),
    updateCampaign: updateCampaign(),
    deleteCampaign: deleteCampaign(),

    // Email operations
    sendEmail: sendEmail(),
    sendBulkEmail: sendBulkEmail(),

    // Analytics
    trackEvent: trackEvent(),
    getAnalytics: getAnalytics(),
  };

  const endpoints = {
    ...baseEndpoints,
    ...(pluginEndpoints || {}),
  } as Record<string, any>;

  const api = toMarketingEndpoints(
    { ...(endpoints as any) } as any,
    ctx as any
  );

  return {
    api: api as typeof endpoints,
    middlewares,
    baseApi: baseEndpoints,
  };
}

export const router = (ctx: MarketingContext, options?: any) => {
  const { api, middlewares } = getEndpoints(ctx, options);
  const basePath = new URL(
    (ctx as any).options?.baseURL || (ctx as any).options?.basePath || "/"
  ).pathname;

  return createRouter(api, {
    routerContext: ctx,
    openapi: { disabled: true },
    basePath,
    routerMiddleware: [
      {
        path: "/**",
        middleware: originCheckMiddlewareFactory(ctx),
      },
      ...middlewares,
    ],
    async onRequest(req) {
      const disabledPaths = (ctx.options as any)?.disabledPaths || [];
      const path = new URL(req.url).pathname.replace(basePath, "");
      if (disabledPaths.includes(path)) {
        return new Response("Not Found", { status: 404 });
      }

      for (const plugin of (ctx.options as any).plugins || []) {
        if ((plugin as any).onRequest) {
          const response = await (plugin as any).onRequest(req, ctx);
          if (response && "response" in response) {
            return response.response;
          }
        }
      }

      // No default rate limiter for marketing yet
      return;
    },
    async onResponse(res) {
      for (const plugin of (ctx.options as any).plugins || []) {
        if ((plugin as any).onResponse) {
          const response = await (plugin as any).onResponse(res, ctx);
          if (response) {
            return response.response;
          }
        }
      }
      return res;
    },
    onError(e) {
      if (e instanceof APIError && e.status === "FOUND") {
        return;
      }
      if (options?.onAPIError?.throw) {
        throw e;
      }
      if (options?.onAPIError?.onError) {
        options.onAPIError.onError(e, ctx);
        return;
      }

      if ((ctx.options as any).logger?.disabled !== true) {
        if (e instanceof APIError) {
          ctx.logger?.error(e.message);
        } else {
          ctx.logger?.error(
            e && typeof e === "object" && "name" in e ? (e as any).name : "",
            e as any
          );
        }
      }
    },
  });
};

export type RouterReturn = ReturnType<typeof router>;
