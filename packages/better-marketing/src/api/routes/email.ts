import { z } from "zod";
import { createMarketingEndpoint } from "../call";

export const sendEmail = () =>
  createMarketingEndpoint(
    "/email/send",
    {
      method: "POST",
      body: z.object({
        to: z.string().email(),
        subject: z.string(),
        content: z.string(),
        from: z.string().email().optional(),
      }),
    },
    async (ctx) => {
      // Placeholder implementation
      return {
        success: true,
        messageId: ctx.context.generateId({ model: "message" }),
      };
    }
  );

export const sendBulkEmail = () =>
  createMarketingEndpoint(
    "/email/send-bulk",
    {
      method: "POST",
      body: z.object({
        to: z.array(z.string().email()),
        subject: z.string(),
        content: z.string(),
        from: z.string().email().optional(),
      }),
    },
    async (ctx) => {
      // Placeholder implementation
      return {
        success: true,
        messageIds: ctx.body.to.map(() =>
          ctx.context.generateId({ model: "message" })
        ),
      };
    }
  );
