# Framework Demo App

This is a demo Next.js application that showcases the features of the Better Framework package.

## Features Demonstrated

- **User Management**: Create framework users with custom properties
- **Event Tracking**: Track user interactions and behaviors
- **Email Sending**: Send transactional emails (mock implementation)
- **API Integration**: Full REST API for framework operations
- **Dashboard Interface**: Interactive web interface to test features

## Getting Started

### Prerequisites

Make sure you're in the Better Framework monorepo root and have installed dependencies:

```bash
pnpm install
```

### Build the Better Framework Package

First, build the better-framework package:

```bash
pnpm --filter better-framework build
```

### Start the Demo App

```bash
pnpm --filter framework-demo dev
```

The app will be available at [http://localhost:3001](http://localhost:3001)

## Project Structure

```
apps/framework-demo/
├── app/                          # Next.js app directory
│   ├── api/framework/           # Better Framework API routes
│   ├── dashboard/               # Interactive dashboard
│   ├── layout.tsx              # App layout
│   └── page.tsx                # Home page
├── lib/
│   └── framework.ts            # Better Framework configuration
└── package.json
```

## API Endpoints

The demo exposes the full Better Framework API at `/api/framework/*`:

- `POST /api/framework/user` - Create a user
- `GET /api/framework/user/:id` - Get a user
- `POST /api/framework/track` - Track an event
- `POST /api/framework/email/send` - Send an email
- `POST /api/framework/campaign/create` - Create a campaign
- And many more...

## Configuration

The framework instance is configured in `lib/framework.ts` with:

- **Memory Adapter**: For easy demo setup (no database required)
- **Mock Email Provider**: Logs emails to console
- **Mock SMS Provider**: Logs SMS to console
- **Mock Analytics**: Logs events to console
- **Rate Limiting**: Enabled for demo purposes

## Environment Variables

Optional environment variables:

```env
FRAMEWORK_SECRET=your-secret-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

## Usage Examples

### Creating a User

```typescript
const user = await framework.api.user.create({
  email: "user@example.com",
  firstName: "John",
  lastName: "Doe",
  properties: { signupSource: "website" },
});
```

### Tracking Events

```typescript
await framework.api.track({
  userId: user.id,
  eventName: "purchase",
  properties: { product: "Premium Plan", amount: 99.99 },
});
```

### Sending Emails

```typescript
await framework.api.email.send({
  to: "user@example.com",
  from: "noreply@yourapp.com",
  subject: "Welcome!",
  html: "<h1>Welcome to our platform!</h1>",
});
```

## Development

To make changes to the demo:

1. Edit files in `apps/framework-demo/`
2. The dev server will automatically reload
3. Changes to the `better-framework` package require rebuilding:
   ```bash
   pnpm --filter better-framework build
   ```

## Learn More

- [Better Framework Documentation](../packages/better-framework/README.md)
- [Next.js Documentation](https://nextjs.org/docs)
