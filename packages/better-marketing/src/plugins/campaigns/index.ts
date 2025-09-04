import { z } from "zod";
import { createMarketingEndpoint } from "../../api/call";
import type { BetterMarketingPlugin } from "../../types/plugins";

/**
 * Campaign endpoints using the database adapter for persistence.
 */
const createCampaign = () =>
  createMarketingEndpoint(
    "/campaign/create",
    {
      method: "POST",
      metadata: { isAction: true },
      body: z.object({
        name: z.string(),
        type: z.string().default("email"),
        status: z.string().default("draft"),
        subject: z.string().optional(),
        content: z.string().default(""),
        segmentIds: z.string().optional(),
        scheduledAt: z.string().optional(),
      }),
    },
    async (ctx) => {
      try {
        const now = new Date();
        // Generate an id (similar strategy as user.create). We prefer generateId -> fallback.
        const generatedId = ctx.context.generateId({ model: "campaign" });
        const fallbackId = ctx.context.generateId({
          model: "campaign",
          size: 16,
        });
        const id =
          (typeof generatedId === "string" && generatedId) ||
          (typeof fallbackId === "string" && fallbackId) ||
          "cmp_" + Math.random().toString(36).slice(2, 10);

        // Data to save to database (without id - let database auto-generate)
        const campaignDataForDB = {
          id, // explicitly provide since adapter.create path does not auto-populate id
          name: ctx.body.name,
          type: ctx.body.type,
          status: ctx.body.status,
          subject: ctx.body.subject || null,
          content: ctx.body.content,
          segmentIds: ctx.body.segmentIds || null,
          scheduledAt: ctx.body.scheduledAt
            ? new Date(ctx.body.scheduledAt)
            : null,
          createdAt: now,
          updatedAt: now,
        };

        console.log("Creating campaign with data:", campaignDataForDB);

        // Save to database
        const createdCampaign = await ctx.context.adapter.create({
          model: "campaign",
          data: campaignDataForDB,
          forceAllowId: true,
        });

        console.log("Created campaign (raw):", createdCampaign);

        // Normalize returned row to ensure all expected fields exist and have correct types
        const dbCampaign: any = createdCampaign || {};

        const normalizedCampaign = {
          id: dbCampaign.id || id,
          name: dbCampaign.name || ctx.body.name,
          type: dbCampaign.type || ctx.body.type || "email",
          status: dbCampaign.status || ctx.body.status || "draft",
          subject: dbCampaign.subject ?? null,
          content: dbCampaign.content ?? "",
          segmentIds:
            dbCampaign.segmentIds === undefined ? null : dbCampaign.segmentIds,
          scheduledAt: dbCampaign.scheduledAt
            ? new Date(dbCampaign.scheduledAt)
            : null,
          createdAt: dbCampaign.createdAt
            ? new Date(dbCampaign.createdAt)
            : now,
          updatedAt: dbCampaign.updatedAt
            ? new Date(dbCampaign.updatedAt)
            : now,
        };

        console.log("Created campaign (normalized):", normalizedCampaign);
        return { campaign: normalizedCampaign };
      } catch (error) {
        console.error("Campaign creation error:", error);
        throw error;
      }
    }
  );

const getCampaign = () =>
  createMarketingEndpoint(
    "/campaign/get/:id",
    {
      method: "GET",
      metadata: { isAction: true },
      params: z.object({ id: z.string() }),
    },
    async (ctx) => {
      // Query campaign from database
      const campaign = await ctx.context.adapter.findOne({
        model: "campaign",
        where: [{ field: "id", value: ctx.params.id }],
      });

      if (!campaign) {
        throw new Error(`Campaign with id ${ctx.params.id} not found`);
      }

      return { campaign };
    }
  );

const updateCampaign = () =>
  createMarketingEndpoint(
    "/campaign/update/:id",
    {
      method: "PUT",
      metadata: { isAction: true },
      params: z.object({ id: z.string() }),
      body: z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        metadata: z.record(z.string(), z.any()).optional(),
      }),
    },
    async (ctx) => {
      return {
        campaign: {
          id: ctx.params.id,
          // Keep provided fields else stub fallback
          name: ctx.body.name || `Campaign ${ctx.params.id}`,
          description: ctx.body.description || null,
          metadata: ctx.body.metadata || {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };
    }
  );

const deleteCampaign = () =>
  createMarketingEndpoint(
    "/campaign/delete/:id",
    {
      method: "DELETE",
      metadata: { isAction: true },
      params: z.object({ id: z.string() }),
    },
    async (ctx) => {
      return { success: true };
    }
  );

const listCampaigns = () =>
  createMarketingEndpoint(
    "/campaign/list",
    {
      method: "GET",
      metadata: { isAction: true },
    },
    async (ctx) => {
      // Query campaigns from database
      const campaigns = await ctx.context.adapter.findMany({
        model: "campaign",
      });
      console.log(campaigns);

      return { campaigns: campaigns || [] };
    }
  );

export const campaignsPlugin = () =>
  ({
    id: "campaigns",
    endpoints: {
      createCampaign: createCampaign(),
      getCampaign: getCampaign(),
      updateCampaign: updateCampaign(),
      deleteCampaign: deleteCampaign(),
      listCampaigns: listCampaigns(),
    },
  }) satisfies BetterMarketingPlugin;

export type CampaignsPlugin = ReturnType<typeof campaignsPlugin>;
