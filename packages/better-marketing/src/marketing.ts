import { BetterMarketingError } from "./error";
import { init, type MarketingContext } from "./init";
import type { BetterMarketingOptions } from "./types";
import { getBaseURL } from "./utils/url";

export const betterMarketing = <O extends BetterMarketingOptions>(
  options: O & Record<never, never>
): {
  handler: (request: Request) => Promise<Response>;
  api: MarketingContext["api"];
  context: Promise<MarketingContext>;
} => {
  const marketingContext = init(options as O);

  return {
    handler: async (request: Request) => {
      const ctx = await marketingContext;
      const basePath = ctx.options.basePath || "/api/marketing";

      if (!ctx.options.baseURL) {
        const baseURL = getBaseURL(undefined, basePath, request);
        if (baseURL) {
          // Update context with resolved base URL
          ctx.options.baseURL = baseURL;
        } else {
          throw new BetterMarketingError(
            "Could not get base URL from request. Please provide a valid base URL."
          );
        }
      }

      // Set trusted origins from request if not configured
      if (
        !ctx.options.trustedOrigins ||
        ctx.options.trustedOrigins.length === 0
      ) {
        const origin = request.headers.get("origin");
        if (origin) {
          ctx.options.trustedOrigins = [origin];
        }
      }

      return ctx.handler(request);
    },

    get api() {
      // Return a proxy that waits for context to be ready
      return new Proxy({} as MarketingContext["api"], {
        get: (_, prop) => {
          return async (...args: any[]) => {
            const ctx = await marketingContext;
            const apiMethod = (ctx.api as any)[prop];
            if (typeof apiMethod === "function") {
              return apiMethod(...args);
            }
            if (typeof apiMethod === "object" && apiMethod !== null) {
              return apiMethod;
            }
            throw new Error(`API method ${String(prop)} not found`);
          };
        },
      });
    },

    context: marketingContext,
  };
};

export type { BetterMarketingOptions };
