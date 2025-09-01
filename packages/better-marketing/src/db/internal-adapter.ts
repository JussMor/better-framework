/**
 * Internal adapter with enhanced functionality for Better Marketing
 */

import type { Adapter, BetterMarketingOptions, MarketingContext, MarketingUser } from "../types";
import { GenericEndpointContext } from "../types/context";
import type { InternalLogger, Logger } from "../utils/logger";
import { getWithHooks } from "./with-hooks";

export function createInternalAdapter(
  adapter: Adapter,
  ctx: {
    options: Omit<BetterMarketingOptions, "logger">;
    hooks: Exclude<BetterMarketingOptions["databaseHooks"], undefined>[];
    logger: InternalLogger;
    generateId: MarketingContext["generateId"];
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
        "marketingUser",
        undefined,
        context
      );
      return createdUser as T & MarketingUser;
    },

    getUserById: async (id: string, context?: GenericEndpointContext) => {
      const user = await adapter.findOne({
        model: "marketingUser",
        where: [{ field: "id", value: id }],
      });
      return user as MarketingUser | null;
    },

    updateUser: async <T>(
      id: string,
      updates: Partial<MarketingUser> & Record<string, any>,
      context?: GenericEndpointContext
    ) => {
      const updatedUser = await updateWithHooks(
        {
          ...updates,
          updatedAt: new Date(),
        },
        [{ field: "id", value: id }],
        "marketingUser",
        undefined,
        context
      );
      return updatedUser as T & MarketingUser;
    },

    deleteUser: async (id: string, context?: GenericEndpointContext) => {
      await adapter.delete({
        model: "marketingUser",
        where: [{ field: "id", value: id }],
      });
      return true;
    },
  };
}

export type InternalAdapter = ReturnType<typeof createInternalAdapter>;
