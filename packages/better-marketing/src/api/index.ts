import { APIError, createRouter, type Middleware } from "better-call";
import type { MarketingContext } from "../types";
import { createMarketingMiddleware } from "./call";
import { ok } from "./routes/ok";
import { error } from "./routes/error";
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

const originCheckMiddleware = createMarketingMiddleware(async (ctx) => {
  if (ctx.request?.method !== "POST" || !ctx.request) {
    return;
  }

  const origin =
    ctx.headers?.get("origin") || ctx.headers?.get("referer") || "";
  const { context } = ctx;
  const trustedOrigins: string[] = Array.isArray(context.options.trustedOrigins)
    ? context.options.trustedOrigins
    : context.options.trustedOrigins || [];

  const usesCookies = ctx.headers?.has("cookie");

  const validateOrigin = (originToCheck: string) => {
    if (!originToCheck) {
      return;
    }

    const isTrustedOrigin = trustedOrigins.some(
      (trustedOrigin) =>
        originToCheck === trustedOrigin ||
        originToCheck.endsWith(trustedOrigin.replace(/^https?:\/\//, ""))
    );

    if (!isTrustedOrigin) {
      ctx.context.logger?.error(`Invalid origin: ${originToCheck}`);
      ctx.context.logger?.info(
        `If it's a valid URL, please add ${originToCheck} to trustedOrigins in your marketing config\n`,
        `Current list of trustedOrigins: ${trustedOrigins}`
      );
      throw new APIError("FORBIDDEN", { message: "Invalid origin" });
    }
  };

  if (usesCookies && !context.options.advanced?.disableCSRFCheck) {
    validateOrigin(origin);
  }
});

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
    ...pluginEndpoints,
    ok,
    error,
  };

  const api = toMarketingEndpoints(endpoints, ctx);

  return {
    api: api as typeof endpoints,
    middlewares,
  };
}

export const router = (ctx: MarketingContext, options?: any) => {
  const { api, middlewares } = getEndpoints(ctx, options);
  const basePath = ctx.options?.basePath || "/api/marketing";

  return createRouter(api, {
    routerContext: ctx,
    openapi: { disabled: true },
    basePath,
    routerMiddleware: [
      {
        path: "/**",
        middleware: originCheckMiddleware,
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
