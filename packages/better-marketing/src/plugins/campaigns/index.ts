import { z } from "zod";
import { createMarketingEndpoint } from "../../api/call";
import type { BetterMarketingPlugin } from "../../types/plugins";

/**
 * Campaign endpoints (minimal stub implementation).
 * Replace internalAdapter usage with real persistence later.
 */
const createCampaign = () =>
  createMarketingEndpoint(
    "/campaign/create",
    {
      method: "POST",
      metadata: { isAction: true },
      body: z.object({
        name: z.string(),
        description: z.string().optional(),
        metadata: z.record(z.string(), z.any()).optional(),
      }),
    },
    async (ctx) => {
      const id = ctx.context.generateId({ model: "campaign", size: 16 });
      const now = new Date();
      return {
        campaign: {
          id: typeof id === "string" ? id : "cmp_" + Date.now().toString(36),
          name: ctx.body.name,
          description: ctx.body.description || null,
          metadata: ctx.body.metadata || {},
          createdAt: now,
          updatedAt: now,
        },
      };
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
      // Placeholder (no DB yet)
      return {
        campaign: {
          id: ctx.params.id,
          name: `Campaign ${ctx.params.id}`,
          description: null,
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };
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
    async () => {
      return { campaigns: [] };
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
  }) satisfies BetterMarketingPlugin<{
    createCampaign: ReturnType<typeof createCampaign>;
    getCampaign: ReturnType<typeof getCampaign>;
    updateCampaign: ReturnType<typeof updateCampaign>;
    deleteCampaign: ReturnType<typeof deleteCampaign>;
    listCampaigns: ReturnType<typeof listCampaigns>;
  }>;

export type CampaignsPlugin = ReturnType<typeof campaignsPlugin>;
