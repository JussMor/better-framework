import { getEndpoints, router } from "./api";
import { BetterMarketingError } from "./error";
import { init } from "./init";
import type { BetterMarketingOptions, MarketingContext } from "./types";
import { FilterActions, InferAPI } from "./types/api";
import { getBaseURL, getOrigin } from "./utils/url";

export const betterMarketing = <O extends BetterMarketingOptions>(
  options: O & Record<never, never>
): Marketing => {
  const marketingContextPromise = init(options as O);
  const { api } = getEndpoints(marketingContextPromise, options as O);

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
    api: api as InferAPI<typeof api>,
    $context: marketingContextPromise,
    options: options as O,
  };
};

export type Marketing = {
  handler: (request: Request) => Promise<Response>;
  api: FilterActions<ReturnType<typeof router>["endpoints"]>;
  $context: Promise<MarketingContext>;
  options: BetterMarketingOptions;
};

export type { BetterMarketingOptions };
