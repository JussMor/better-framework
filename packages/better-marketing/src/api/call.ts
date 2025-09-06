import { createEndpoint, createMiddleware } from "better-call";
import { FrameworkContext } from "../types";

/**
 * Minimal middleware/endpoint wiring for Better Framework using better-call.
 * This mirrors the pattern used in better-auth so endpoint hooks and middleware
 * can be composed consistently.
 */
export const optionsMiddleware = createMiddleware(async () => {
  // placeholder context for framework endpoints
  return {} as FrameworkContext;
});

export const createFrameworkMiddleware = createMiddleware.create({
  use: [
    optionsMiddleware,
    // second middleware slot for post-hook usage
    createMiddleware(async () => {
      return {} as { returned?: unknown; responseHeaders?: Headers };
    }),
  ],
});

export const createFrameworkEndpoint = createEndpoint.create({
  use: [optionsMiddleware],
});

export type FrameworkEndpoint = ReturnType<typeof createFrameworkEndpoint>;
export type FrameworkMiddleware = ReturnType<typeof createFrameworkMiddleware>;
