import { getEndpoints, router } from "./api";
import { BetterMarketingError } from "./error";
import { init } from "./init";
import type { BetterMarketingOptions, MarketingContext } from "./types";
import { getBaseURL, getOrigin } from "./utils/url";

/**
 * Initialize Better Marketing with the provided options.
 * Returns an object with:
 *  - handler: universal Request handler (Next.js route adapter wraps this)
 *  - api: programmatic server-side API (endpoints mapped by key)
 *  - $context: a promise resolving to the initialized marketing context
 *  - options: the resolved options object
 */
export const betterMarketing = <O extends BetterMarketingOptions>(
  options: O
): Marketing<O> => {
  const marketingContextPromise = init(options as O);
  const { api, middlewares } = getEndpoints(
    marketingContextPromise,
    options as O
  );

  return {
    handler: async (request: Request) => {
      const ctx = await marketingContextPromise;
      const basePath = ctx.options.basePath || "/api/marketing";

      if (!ctx.options.baseURL) {
        const baseURL = getBaseURL(undefined, basePath, request);
        if (baseURL) {
          // Update context with resolved base URL
          ctx.baseURL = baseURL;
          ctx.options.baseURL = getOrigin(ctx.baseURL) || undefined;
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

      const { handler } = router(ctx, ctx.options);
      return handler(request);
    },
    // api follows Better Auth pattern - using router endpoints with FilterActions
    api: api,
    $ctx: marketingContextPromise, // Changed from $context to $ctx to match Better Auth
    options: options as O,
    // Expose middlewares for potential inspection/debugging
    middlewares: middlewares,
  };
};

export type Marketing<
  O extends BetterMarketingOptions = BetterMarketingOptions,
> = {
  handler: (request: Request) => Promise<Response>;
  api: ReturnType<typeof getEndpoints<MarketingContext, O>>["api"]; // Include plugin endpoints directly
  $ctx: Promise<MarketingContext>; // Changed from $context to $ctx to match Better Auth
  options: BetterMarketingOptions;
  middlewares: ReturnType<typeof getEndpoints>["middlewares"]; // plugin middlewares
};

export type { BetterMarketingOptions };
