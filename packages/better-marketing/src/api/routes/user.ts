import { z } from "zod";
import { createMarketingEndpoint } from "../call";

export const createUser = () =>
  createMarketingEndpoint(
    "/user/create",
    {
      method: "POST",
      body: z.object({
        email: z.string().email(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        phone: z.string().optional(),
        properties: z.record(z.string(), z.any()).optional(),
      }),
    },
    async (ctx) => {
      const { body } = ctx;

      // Use the internal adapter to create user
      const user = await ctx.context.internalAdapter.createUser({
        id: ctx.context.generateId({ model: "marketingUser" }),
        email: body.email,
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.phone,
        properties: body.properties || {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Execute plugin hooks
      await ctx.context.pluginManager.executeUserCreatedHooks?.(user);

      return {
        user,
      };
    }
  );

export const getUser = () =>
  createMarketingEndpoint(
    "/user/get/:id",
    {
      method: "GET",
      params: z.object({
        id: z.string(),
      }),
    },
    async (ctx) => {
      const { id } = ctx.params;

      const user = await ctx.context.internalAdapter.getUserById(id);

      if (!user) {
        throw new Error("User not found");
      }

      return {
        user,
      };
    }
  );

export const updateUser = () =>
  createMarketingEndpoint(
    "/user/update/:id",
    {
      method: "PUT",
      params: z.object({
        id: z.string(),
      }),
      body: z.object({
        email: z.string().email().optional(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        phone: z.string().optional(),
        properties: z.record(z.string(), z.any()).optional(),
      }),
    },
    async (ctx) => {
      const { id } = ctx.params;
      const { body } = ctx;

      const existingUser = await ctx.context.internalAdapter.getUserById(id);

      if (!existingUser) {
        throw new Error("User not found");
      }

      const user = await ctx.context.internalAdapter.updateUser(id, {
        ...body,
        updatedAt: new Date(),
      });

      // Execute plugin hooks
      await ctx.context.pluginManager.executeUserUpdatedHooks?.(
        user,
        existingUser
      );

      return {
        user,
      };
    }
  );

export const deleteUser = () =>
  createMarketingEndpoint(
    "/user/delete/:id",
    {
      method: "DELETE",
      params: z.object({
        id: z.string(),
      }),
    },
    async (ctx) => {
      const { id } = ctx.params;

      const user = await ctx.context.internalAdapter.getUserById(id);

      if (!user) {
        throw new Error("User not found");
      }

      await ctx.context.internalAdapter.deleteUser(id);

      // Execute plugin hooks
      await ctx.context.pluginManager.executeUserDeletedHooks?.(user);

      return {
        success: true,
      };
    }
  );
