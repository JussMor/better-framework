/**
 * Internal adapter with enhanced functionality for Better Marketing
 */

import type { Adapter, BetterMarketingOptions, MarketingUser } from "../types";
import { GenericEndpointContext } from "../types/context";
import type { Logger } from "../utils/logger";
import { getWithHooks } from "./with-hooks";

export function createInternalAdapter(
  adapter: Adapter,
  ctx: {
    options: BetterMarketingOptions;
    hooks: Exclude<BetterMarketingOptions["databaseHooks"], undefined>[];
    logger: Logger;
    generateId: (options: { model: string; size?: number }) => string;
  }
) {
  const { createWithHooks, updateWithHooks, updateManyWithHooks } =
    getWithHooks(adapter, ctx);

  return {
    // User operations - flattened to match Better Auth pattern
    createUser: async <T>(
      user: Omit<MarketingUser, "id" | "createdAt" | "updatedAt"> &
        Partial<MarketingUser> &
        Record<string, any>,
      context?: GenericEndpointContext
    ) => {
      const createdUser = await createWithHooks(
        {
          createdAt: new Date(),
          updatedAt: new Date(),
          ...user,
          email: user.email?.toLowerCase(),
        },
        "user",
        undefined,
        context
      );
      return createdUser as T & MarketingUser;
    },
  };
}
