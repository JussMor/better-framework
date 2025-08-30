/**
 * Better Marketing - A comprehensive marketing framework for TypeScript applications
 */

export * from "./types";

// Core functionality
export * from "./core";
export { createMarketingHandler } from "./core/handler";
export { init, type MarketingContext } from "./init";
export { betterMarketing, type BetterMarketingOptions } from "./marketing";

// Database adapters
// export { drizzleAdapter } from "./adapters/drizzle";
export { kyselyAdapter } from "./adapters/kysely";
// export { mongooseAdapter } from "./adapters/mongoose";
// export { prismaAdapter } from "./adapters/prisma";

// Framework integrations
// export { expressHandler } from "./frameworks/express";
// export { fastifyHandler } from "./frameworks/fastify";
// export { honoHandler } from "./frameworks/hono";
// export { nestjsHandler } from "./frameworks/nestjs";
// export { nextjsHandler } from "./frameworks/nextjs";
// export { svelteKitHandler } from "./frameworks/sveltekit";

// Email providers
// export { mailgunProvider } from "./email-providers/mailgun";
// export { postmarkProvider } from "./email-providers/postmark";
// export { resendProvider } from "./email-providers/resend";
// export { sendgridProvider } from "./email-providers/sendgrid";

// SMS providers
// export { twilioProvider } from "./sms-providers/twilio";

// Analytics providers
// export { googleAnalyticsProvider } from "./analytics-providers/google-analytics";
// export { mixpanelProvider } from "./analytics-providers/mixpanel";

// Plugins
// export { abTestingPlugin } from "./plugins/ab-testing";
// export { attributionPlugin } from "./plugins/attribution";
// export { automationPlugin } from "./plugins/automation";
// export { campaignsPlugin } from "./plugins/campaigns";
// export { leadScoringPlugin } from "./plugins/lead-scoring";
// export { personalizationPlugin } from "./plugins/personalization";
// export { segmentationPlugin } from "./plugins/segmentation";
// export { webhooksPlugin } from "./plugins/webhooks";

// Client integrations
// export { angularIntegration } from "./client/angular";
// export { nextjsIntegration } from "./client/nextjs";
export { reactIntegration } from "./client/react";
// export { svelteIntegration } from "./client/svelte";
// export { vueIntegration } from "./client/vue";

// Utilities
export { generateApiKey } from "./crypto";
export * from "./test";
