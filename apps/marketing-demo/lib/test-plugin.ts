/**
 * Minimal test plugin that exactly mimics the campaigns plugin structure
 * This will help isolate whether the issue is with the custom plugin structure
 * or with the client type inference system
 */

import { createMarketingEndpoint } from "better-framework/api/call";
import type { BetterFrameworkPlugin } from "better-framework/types";
import { z } from "zod";

// Exact same pattern as campaigns plugin
const testEndpoint = () =>
  createMarketingEndpoint(
    "/test/hello",
    {
      method: "GET",
      metadata: { isAction: false },
    },
    async () => {
      return { message: "Hello from test plugin!" };
    }
  );

const createTest = () =>
  createMarketingEndpoint(
    "/test/create",
    {
      method: "POST",
      metadata: { isAction: true },
      body: z.object({
        name: z.string(),
      }),
    },
    async (ctx) => {
      return {
        success: true,
        data: { id: "test_123", name: ctx.body.name },
      };
    }
  );

// Server plugin - exact same pattern as campaigns
export const testPlugin = () =>
  ({
    id: "test",
    endpoints: {
      testEndpoint: testEndpoint(),
      createTest: createTest(),
    },
  }) satisfies BetterFrameworkPlugin;

// Client plugin - exact same pattern as campaigns
export const testClientPlugin = () =>
  ({
    id: "test",
    $InferServerPlugin: {} as ReturnType<typeof testPlugin>,
  }) satisfies import("better-framework/client").MarketingClientPlugin;

export type TestPlugin = ReturnType<typeof testPlugin>;
