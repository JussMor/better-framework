import { z } from "zod";
import { createMarketingEndpoint } from "../call";

export const sendEmail = () =>
  createMarketingEndpoint(
    "/emails/send",
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
      const { body } = ctx;

      if (!ctx.context.options.emailProvider) {
        throw new Error("Email provider not configured");
      }

      // Send email using configured provider
      const result = await ctx.context.options.emailProvider.sendEmail({
        to: body.to,
        from:
          body.from ||
          ctx.context.options.emailProvider.defaultFrom ||
          "noreply@example.com",
        subject: body.subject,
        html: body.content,
      });

      // Store email record in database
      const email = await ctx.context.internalAdapter.createWithHooks(
        {
          id: ctx.context.generateId({ model: "marketingEmail" }),
          to: body.to,
          from:
            body.from ||
            ctx.context.options.emailProvider.defaultFrom ||
            "noreply@example.com",
          subject: body.subject,
          content: body.content,
          status: result.success ? "sent" : "failed",
          messageId: result.messageId || null,
          createdAt: new Date(),
        },
        "marketingEmail"
      );

      // Execute plugin hooks for email sent
      await ctx.context.pluginManager.executeEmailSentHooks?.(email);

      return {
        success: result.success,
        messageId: result.messageId,
        emailId: email.id,
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
