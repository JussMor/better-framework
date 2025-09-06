import { getEndpoints, router } from "./api";
import { BetterFrameworkError } from "./error";
import { init } from "./init";
import type { BetterFrameworkOptions, FrameworkContext } from "./types";
import type { FilterActions } from "./types/api";
import { getBaseURL, getOrigin } from "./utils/url";

/**
 * Initialize Better Framework with the provided options.
 * Returns an object with:
 *  - handler: universal Request handler (Next.js route adapter wraps this)
 *  - api: programmatic server-side API (endpoints mapped by key)
 *  - $context: a promise resolving to the initialized framework context
 *  - options: the resolved options object
 */
export const betterFramework = <O extends BetterFrameworkOptions>(
  options: O
): Framework<O> => {
  const frameworkContextPromise = init(options as O);
  const { api, middlewares } = getEndpoints(
    frameworkContextPromise,
    options as O
  );

  return {
    handler: async (request: Request) => {
      const ctx = await frameworkContextPromise;
      const basePath = ctx.options.basePath || "/api/framework";

      if (!ctx.options.baseURL) {
        const baseURL = getBaseURL(undefined, basePath, request);
        if (baseURL) {
          // Update context with resolved base URL
          ctx.baseURL = baseURL;
          ctx.options.baseURL = getOrigin(ctx.baseURL) || undefined;
        } else {
          throw new BetterFrameworkError(
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
    api: api as FilterActions<typeof api>,
    $ctx: frameworkContextPromise, // Changed from $context to $ctx to match Better Auth
    options: options as O,
    // Expose middlewares for potential inspection/debugging
    middlewares: middlewares,
  };
};

export type Framework<
  O extends BetterFrameworkOptions = BetterFrameworkOptions,
> = {
  handler: (request: Request) => Promise<Response>;
  api: FilterActions<ReturnType<typeof router>["endpoints"]>; // Use router endpoints like Better Auth
  $ctx: Promise<FrameworkContext>; // Changed from $context to $ctx to match Better Auth
  options: BetterFrameworkOptions;
  middlewares: ReturnType<typeof getEndpoints>["middlewares"]; // plugin middlewares
};

// Backward compatibility aliases
export const betterMarketing = betterFramework;
export type Marketing<
  O extends BetterFrameworkOptions = BetterFrameworkOptions,
> = Framework<O>;
export type BetterMarketingOptions = BetterFrameworkOptions;

export type { BetterFrameworkOptions };
