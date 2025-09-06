/**
 * Internal adapter with enhanced functionality for       const updatedUser = await updateWithHooks(
        {
          ...updates,
          updatedAt: new Date(),
        },
        [{ field: "id", value: id }],
        "user",
        undefined,
        context
      );keting
 */

import type {
  Adapter,
  BetterFrameworkOptions,
  FrameworkContext,
  FrameworkUser,
} from "../types";
import { GenericEndpointContext } from "../types/context";
import type { InternalLogger } from "../utils/logger";
import { getWithHooks } from "./with-hooks";

export function createInternalAdapter(
  adapter: Adapter,
  ctx: {
    options: Omit<BetterFrameworkOptions, "logger">;
    hooks: Exclude<BetterFrameworkOptions["databaseHooks"], undefined>[];
    logger: InternalLogger;
    generateId: FrameworkContext["generateId"];
  }
) {
  const { createWithHooks, updateWithHooks, updateManyWithHooks } =
    getWithHooks(adapter, ctx);

  return {
    // User operations - flattened to match Better Auth pattern
    createUser: async <T>(
      user: Omit<FrameworkUser, "id" | "createdAt" | "updatedAt"> &
        Partial<FrameworkUser> &
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
      return createdUser as T & FrameworkUser;
    },

    getUserById: async (id: string, context?: GenericEndpointContext) => {
      const user = await adapter.findOne({
        model: "user",
        where: [{ field: "id", value: id }],
      });
      return user as FrameworkUser | null;
    },

    updateUser: async <T>(
      id: string,
      updates: Partial<FrameworkUser> & Record<string, any>,
      context?: GenericEndpointContext
    ) => {
      const updatedUser = await updateWithHooks(
        {
          ...updates,
          updatedAt: new Date(),
        },
        [{ field: "id", value: id }],
        "user",
        undefined,
        context
      );
      return updatedUser as T & FrameworkUser;
    },

    deleteUser: async (id: string, context?: GenericEndpointContext) => {
      await adapter.delete({
        model: "user",
        where: [{ field: "id", value: id }],
      });
      return true;
    },
  };
}

export type InternalAdapter = ReturnType<typeof createInternalAdapter>;
