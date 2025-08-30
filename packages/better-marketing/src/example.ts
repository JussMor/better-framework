/**
 * Example usage of Better Marketing
 * This file demonstrates how to use the Better Marketing framework
 */

import { memoryAdapter } from "./adapters/memory-adapter";
import { betterMarketing } from "./marketing";

// Example configuration
const marketing = betterMarketing({
  database: memoryAdapter(),
  secret: "your-secret-key-here",
  baseURL: "http://localhost:3000",
  basePath: "/api/marketing",
  emailProvider: {
    name: "console",
    sendEmail: async (options) => {
      console.log("Sending email:", options);
      return {
        success: true,
        messageId: "email-id-" + Math.random().toString(36).substring(7),
      };
    },
    sendBulkEmail: async (options) => {
      console.log("Sending bulk email:", options);
      return {
        success: true,
        results: options.messages.map((message, index) => ({
          success: true,
          messageId: `email-${index}-${Math.random().toString(36).substring(7)}`,
        })),
      };
    },
  },
  plugins: [],
});

// Example usage
export async function exampleUsage() {
  // Access the API
  const api = marketing.api;

  // Create a user
  const user = await api.user.create({
    email: "user@example.com",
    firstName: "John",
    lastName: "Doe",
    properties: {
      signupSource: "website",
    },
  });

  console.log("Created user:", user);

  // Track an event
  const event = await api.track({
    userId: user.id,
    eventName: "page_view",
    properties: {
      page: "/dashboard",
      source: "direct",
    },
  });

  console.log("Tracked event:", event);

  // Send an email
  const emailResult = await api.email.send({
    to: user.email,
    from: "noreply@example.com",
    subject: "Welcome!",
    text: "Welcome to our platform!",
    html: "<h1>Welcome to our platform!</h1>",
  });

  console.log("Email sent:", emailResult);

  return { user, event, emailResult };
}

// Export for testing
export { marketing };
