import { betterMarketing } from "better-marketing";
import { memoryAdapter } from "better-marketing/adapters/memory";

export const marketing = betterMarketing({
  database: memoryAdapter(),
  secret: process.env.MARKETING_SECRET || "your-secret-key-for-development",
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001",
  basePath: "/api/marketing",

  // Email provider configuration (mock for demo)
  emailProvider: {
    name: "demo-email",
    sendEmail: async (options) => {
      console.log("📧 Sending email:", {
        to: options.to,
        from: options.from,
        subject: options.subject,
      });

      // Simulate email sending
      return {
        success: true,
        messageId: `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      };
    },
  },

  // SMS provider configuration (mock for demo)
  smsProvider: {
    name: "demo-sms",
    sendSMS: async (options) => {
      console.log("📱 Sending SMS:", {
        to: options.to,
        from: options.from,
        body: options.body,
      });

      // Simulate SMS sending
      return {
        success: true,
        messageId: `sms_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      };
    },
  },

  // Analytics providers (mock for demo)
  // analyticsProviders: [
  //   {
  //     name: "demo-analytics",
  //     track: async (options) => {
  //       console.log("📊 Analytics event:", {
  //         userId: options.userId,
  //         eventName: options.eventName,
  //         properties: options.properties,
  //       });
  //       return { success: true };
  //     },
  //   },
  // ],

  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },

  // Rate limiting
  rateLimit: {
    enabled: true,
    window: 15 * 60 * 1000, // 15 minutes
    max: 100, // requests per window
  },
});
