import { z } from "zod";
import { createFrameworkEndpoint } from "../call";

export const createUser = () =>
  createFrameworkEndpoint(
    "/user/create",
    {
      method: "POST",
      metadata: { isAction: true },
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

      // Use the internal adapter to create user - let adapter handle ID generation
      const user = await ctx.context.internalAdapter.createUser({
        email: body.email,
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.phone,
        properties: body.properties || {},
        segments: [], // Initialize with empty segments array
      });

      return {
        user,
      };
    }
  );

export const getUser = () =>
  createFrameworkEndpoint(
    "/user/get/:id",
    {
      method: "GET",
      metadata: { isAction: true },
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
  createFrameworkEndpoint(
    "/user/update/:id",
    {
      method: "PUT",
      metadata: { isAction: true },
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

      return {
        user,
      };
    }
  );

export const deleteUser = () =>
  createFrameworkEndpoint(
    "/user/delete/:id",
    {
      method: "DELETE",
      metadata: { isAction: true },
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

      return {
        success: true,
      };
    }
  );
