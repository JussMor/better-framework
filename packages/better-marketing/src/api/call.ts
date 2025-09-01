import { createEndpoint, createMiddleware } from "better-call";
import { MarketingContext } from "../types";

/**
 * Minimal middleware/endpoint wiring for Better Marketing using better-call.
 * This mirrors the pattern used in better-auth so endpoint hooks and middleware
 * can be composed consistently.
 */
export const optionsMiddleware = createMiddleware(async () => {
  // placeholder context for marketing endpoints
  return {} as MarketingContext;
});

export const createMarketingMiddleware = createMiddleware.create({
  use: [
    optionsMiddleware,
    // second middleware slot for post-hook usage
    createMiddleware(async () => {
      return {} as { returned?: unknown; responseHeaders?: Headers };
    }),
  ],
});

export const createMarketingEndpoint = createEndpoint.create({
  use: [optionsMiddleware],
});

export type MarketingEndpoint = ReturnType<typeof createMarketingEndpoint>;
export type MarketingMiddleware = ReturnType<typeof createMarketingMiddleware>;
