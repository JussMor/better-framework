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

import {
  Adapter,
  BetterFrameworkOptions,
  FrameworkContext,
  User,
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
      user: Omit<User, "id" | "createdAt" | "updatedAt"> &
        Partial<User> &
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
      return createdUser as T & User;
    },

    getUserById: async (id: string, context?: GenericEndpointContext) => {
      const user = await adapter.findOne({
        model: "user",
        where: [{ field: "id", value: id }],
      });
      return user as User | null;
    },

    updateUser: async <T>(
      id: string,
      updates: Partial<User> & Record<string, any>,
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
      return updatedUser as T & User;
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
