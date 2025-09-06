# Better Framework

A comprehensive framework framework for TypeScript applications, inspired by the Better Auth approach.

## Features

- **User Management**: Create and manage framework users with custom properties
- **Event Tracking**: Track user events and behaviors
- **Campaign Management**: Create and send framework campaigns
- **Segmentation**: Create user segments based on properties and behaviors
- **Email & SMS**: Send transactional and framework messages
- **Analytics Integration**: Connect with multiple analytics providers
- **Plugin System**: Extensible architecture with plugins
- **Database Agnostic**: Support for multiple database adapters
- **Type-Safe**: Full TypeScript support

## Installation

```bash
npm install better-framework
# or
yarn add better-framework
# or
pnpm add better-framework
```

## Quick Start

```typescript
import { betterFramework } from "better-framework";
import { memoryAdapter } from "better-framework/adapters/memory";

const framework = betterFramework({
  database: memoryAdapter(),
  secret: "your-secret-key-here",
  baseURL: "http://localhost:3000",
  basePath: "/api/framework",
  emailProvider: {
    name: "resend",
    sendEmail: async (options) => {
      // Your email sending logic
      return { success: true, messageId: "msg_123" };
    },
  },
});

// Use as a request handler (Next.js example)
export async function POST(request: Request) {
  return framework.handler(request);
}

// Or use the API directly
const user = await framework.api.user.create({
  email: "user@example.com",
  firstName: "John",
  lastName: "Doe",
});

await framework.api.track({
  userId: user.id,
  eventName: "page_view",
  properties: { page: "/dashboard" },
});
```

## Configuration

### Basic Configuration

```typescript
import { betterFramework } from "better-framework";

const framework = betterFramework({
  // Required
  database: yourDatabaseAdapter(),
  secret: "your-secret-key",

  // Optional
  baseURL: "https://your-domain.com",
  basePath: "/api/framework", // Default: "/api/framework"
  trustedOrigins: ["https://your-frontend.com"],

  // Email provider
  emailProvider: {
    name: "your-provider",
    sendEmail: async (options) => {
      /* ... */
    },
  },

  // SMS provider
  smsProvider: {
    name: "your-provider",
    sendSMS: async (options) => {
      /* ... */
    },
  },

  // Analytics providers
  analyticsProviders: [
    {
      name: "google-analytics",
      track: async (options) => {
        /* ... */
      },
    },
  ],

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

  // Plugins
  plugins: [
    // Add your plugins here
  ],
});
```

## Database Adapters

Better Framework supports multiple database adapters:

```typescript
// Memory adapter (for development/testing)
import { memoryAdapter } from "better-framework/adapters/memory";
const framework = betterFramework({
  database: memoryAdapter(),
});

// Prisma adapter
import { prismaAdapter } from "better-framework/adapters/prisma";
const framework = betterFramework({
  database: prismaAdapter(prisma),
});

// Kysely adapter
import { kyselyAdapter } from "better-framework/adapters/kysely";
const framework = betterFramework({
  database: kyselyAdapter(db),
});
```

## API Reference

### User Management

```typescript
// Create user
const user = await framework.api.user.create({
  email: "user@example.com",
  firstName: "John",
  lastName: "Doe",
  phone: "+1234567890",
  properties: { signupSource: "website" },
});

// Get user
const user = await framework.api.user.get("user-id");

// Update user
const updatedUser = await framework.api.user.update("user-id", {
  firstName: "Jane",
});

// Delete user
await framework.api.user.delete("user-id");

// Find by email
const user = await framework.api.user.getByEmail("user@example.com");
```

### Event Tracking

```typescript
// Track event
const event = await framework.api.track({
  userId: "user-id",
  eventName: "purchase",
  properties: {
    product: "Premium Plan",
    amount: 99.99,
  },
  sessionId: "session-123",
  source: "webapp",
});
```

### Campaign Management

```typescript
// Create campaign
const campaign = await framework.api.campaign.create({
  name: "Welcome Series",
  type: "email",
  status: "draft",
  subject: "Welcome to our platform!",
  content: "<h1>Welcome!</h1>",
  segmentIds: ["segment-1", "segment-2"],
});

// Send campaign
await framework.api.campaign.send("campaign-id");
```

### Segmentation

```typescript
// Create segment
const segment = await framework.api.segment.create({
  name: "Premium Users",
  description: "Users with premium subscription",
  conditions: {
    properties: {
      plan: "premium",
    },
  },
});

// Get users in segment
const users = await framework.api.segment.getUsers("segment-id");
```

### Direct Messaging

```typescript
// Send email
const result = await framework.api.email.send({
  to: "user@example.com",
  from: "noreply@yourapp.com",
  subject: "Welcome!",
  html: "<h1>Welcome to our platform!</h1>",
  text: "Welcome to our platform!",
});

// Send SMS
const result = await framework.api.sms.send({
  to: "+1234567890",
  from: "+0987654321",
  body: "Welcome to our platform!",
});
```

## Framework Integrations

### Next.js

```typescript
// app/api/framework/[...better-framework]/route.ts
import { framework } from "@/lib/framework";

export async function GET(request: Request) {
  return framework.handler(request);
}

export async function POST(request: Request) {
  return framework.handler(request);
}
```

### Express.js

```typescript
import express from "express";
import { framework } from "./lib/framework";

const app = express();

app.all("/api/framework/*", async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const request = new Request(url, {
    method: req.method,
    headers: req.headers as any,
    body: req.method !== "GET" ? JSON.stringify(req.body) : undefined,
  });

  const response = await framework.handler(request);
  const text = await response.text();

  res.status(response.status);
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  res.send(text);
});
```

## Plugins

Better Framework supports a plugin system for extending functionality:

```typescript
const myPlugin = {
  name: "my-plugin",
  version: "1.0.0",
  init: async (config) => {
    console.log("Plugin initialized");
  },
  hooks: {
    "user:created": async (user) => {
      console.log("User created:", user.email);
    },
    "event:tracked": async (event) => {
      console.log("Event tracked:", event.eventName);
    },
  },
  api: {
    customMethod: () => {
      return "Hello from plugin!";
    },
  },
};

const framework = betterFramework({
  // ... other config
  plugins: [myPlugin],
});
```

## Development

This project follows the Better Auth architecture pattern for consistency and maintainability.

## License

MIT
