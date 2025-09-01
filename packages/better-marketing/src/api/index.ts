import {
  APIError,
  createRouter,
  type Endpoint,
  type Middleware,
} from "better-call";
import type {
  BetterMarketingOptions,
  MarketingContext,
  UnionToIntersection,
} from "../types";
import { createMarketingMiddleware } from "./call";
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
import { BetterMarketingPlugin } from "../types/plugins";
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

export function getEndpoints<
  C extends MarketingContext,
  Option extends BetterMarketingOptions,
>(ctx: Promise<C> | C, options?: Option) {
  console.log(
    "Processing plugins:",
    options?.plugins?.map((p: any) => ({
      id: p.id,
      hasEndpoints: !!p.endpoints,
      endpointKeys: p.endpoints ? Object.keys(p.endpoints) : [],
    }))
  );

  // Collect plugin endpoints; keep them typed as Endpoint where possible
  const pluginEndpoints: Record<string, Endpoint> =
    options?.plugins?.reduce(
      (acc: Record<string, Endpoint>, plugin: any) => {
        console.log(
          "Processing plugin:",
          plugin.id,
          "with endpoints:",
          Object.keys(plugin.endpoints || {})
        );
        if (plugin?.endpoints && typeof plugin.endpoints === "object") {
          for (const [k, v] of Object.entries(plugin.endpoints)) {
            console.log(`Checking endpoint ${k}:`, {
              exists: !!v,
              type: typeof v,
              hasHandler:
                v &&
                (typeof v === "object" || typeof v === "function") &&
                "handler" in (v as any),
              hasPath:
                v &&
                (typeof v === "object" || typeof v === "function") &&
                "path" in (v as any),
              hasOptions:
                v &&
                (typeof v === "object" || typeof v === "function") &&
                "options" in (v as any),
            });
            if (v && (typeof v === "object" || typeof v === "function")) {
              console.log(`Endpoint ${k} details:`, {
                keys: Object.keys(v as any),
                handlerType: typeof (v as any).handler,
                path: (v as any).path,
                options: (v as any).options,
              });
            }
            if (
              v &&
              (typeof v === "object" || typeof v === "function") &&
              "handler" in (v as any) &&
              "path" in (v as any) &&
              "options" in (v as any)
            ) {
              console.log(`Adding plugin endpoint: ${k} -> ${(v as any).path}`);
              acc[k] = v as unknown as Endpoint;
            } else {
              console.log(`Skipping endpoint ${k} - validation failed`);
            }
          }
        }
        return acc;
      },
      {} as Record<string, Endpoint>
    ) || {};

  type PluginEndpoints = UnionToIntersection<
    Option["plugins"] extends Array<infer T>
      ? T extends BetterMarketingPlugin
        ? T extends {
            endpoints: infer E;
          }
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

  console.log("Final endpoints:", Object.keys(endpoints));
  console.log("Plugin endpoints:", Object.keys(pluginEndpoints));

  const api = toMarketingEndpoints(endpoints, ctx);

  return { api: api as typeof endpoints & PluginEndpoints, middlewares };
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
