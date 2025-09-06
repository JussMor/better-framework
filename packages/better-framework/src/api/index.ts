import { APIError, createRouter, type Middleware } from "better-call";
import type {
  BetterFrameworkOptions,
  FrameworkContext,
  UnionToIntersection,
} from "../types";
import { createFrameworkMiddleware } from "./call";
import { error } from "./routes/error";
import { ok } from "./routes/ok";
// import { getAnalytics, trackEvent } from "./routes/analytics";
// import {
//   createCampaign,
//   deleteCampaign,
//   getCampaign,
//   updateCampaign,
// } from "./routes/campaign";
// import { sendBulkEmail, sendEmail } from "./routes/email";
import { BetterFrameworkPlugin } from "../types/plugins";
import { createUser, deleteUser, getUser, updateUser } from "./routes/user";
import { toFrameworkEndpoints } from "./to-framework-endpoints";

const originCheckMiddleware = createFrameworkMiddleware(async (ctx) => {
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
        `If it's a valid URL, please add ${originToCheck} to trustedOrigins in your framework config\n`,
        `Current list of trustedOrigins: ${trustedOrigins}`
      );
      throw new APIError("FORBIDDEN", { message: "Invalid origin" });
    }
  };

  if (usesCookies && !context.options.advanced?.disableCSRFCheck) {
    validateOrigin(origin);
  }
});

export function getEndpoints<
  C extends FrameworkContext,
  Option extends BetterFrameworkOptions,
>(ctx: Promise<C> | C, options?: Option) {
  // Simple plugin endpoint collection like Better Auth
  const pluginEndpoints =
    options?.plugins?.reduce(
      (acc, plugin) => {
        return {
          ...acc,
          ...plugin.endpoints,
        };
      },
      {} as Record<string, any>
    ) || {};

  type PluginEndpoints = UnionToIntersection<
    Option["plugins"] extends Array<infer T>
      ? T extends BetterFrameworkPlugin
        ? T extends { endpoints: infer E }
          ? E
          : {}
        : {}
      : {}
  >;
  const middlewares =
    options?.plugins
      ?.map((plugin: any) =>
        plugin.middlewares?.map((m: any) => {
          const middleware = (async (context: any) => {
            const frameworkCtx = await ctx;
            return m.middleware({
              ...context,
              context: {
                ...frameworkCtx,
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

  // Create base framework endpoints similar to Better Auth
  const baseEndpoints = {
    // User management
    createUser: createUser(),
    getUser: getUser(),
    updateUser: updateUser(),
    deleteUser: deleteUser(),

    // // Campaign management
    // createCampaign: createCampaign(),
    // getCampaign: getCampaign(),
    // updateCampaign: updateCampaign(),
    // deleteCampaign: deleteCampaign(),

    // // Email operations
    // sendEmail: sendEmail(),
    // sendBulkEmail: sendBulkEmail(),

    // // Analytics
    // trackEvent: trackEvent(),
    // getAnalytics: getAnalytics(),
  };

  const endpoints = {
    ...baseEndpoints,
    ...pluginEndpoints,
    ok,
    error,
  } as const;

  const api = toFrameworkEndpoints(endpoints, ctx);

  return {
    api: api as typeof endpoints & PluginEndpoints,
    middlewares,
  };
}

export const router = (ctx: FrameworkContext, options?: any) => {
  const { api, middlewares } = getEndpoints(ctx, options);
  const basePath = ctx.options?.basePath || "/api/framework";

  const routerInstance = createRouter(api, {
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

      // No default rate limiter for framework yet
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

  // Return router with endpoints exposed, following Better Auth pattern
  return {
    ...routerInstance,
    endpoints: api, // Expose endpoints like Better Auth
  };
};

export type RouterReturn = ReturnType<typeof router>;
