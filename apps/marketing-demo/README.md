# Marketing Demo App

This is a demo Next.js application that showcases the features of the Better Marketing package.

## Features Demonstrated

- **User Management**: Create marketing users with custom properties
- **Event Tracking**: Track user interactions and behaviors
- **Email Sending**: Send transactional emails (mock implementation)
- **API Integration**: Full REST API for marketing operations
- **Dashboard Interface**: Interactive web interface to test features

## Getting Started

### Prerequisites

Make sure you're in the Better Marketing monorepo root and have installed dependencies:

```bash
pnpm install
```

### Build the Better Marketing Package

First, build the better-marketing package:

```bash
pnpm --filter better-marketing build
```

### Start the Demo App

```bash
pnpm --filter marketing-demo dev
```

The app will be available at [http://localhost:3001](http://localhost:3001)

## Project Structure

```
apps/marketing-demo/
├── app/                          # Next.js app directory
│   ├── api/marketing/           # Better Marketing API routes
│   ├── dashboard/               # Interactive dashboard
│   ├── layout.tsx              # App layout
│   └── page.tsx                # Home page
├── lib/
│   └── marketing.ts            # Better Marketing configuration
└── package.json
```

## API Endpoints

The demo exposes the full Better Marketing API at `/api/marketing/*`:

- `POST /api/marketing/user` - Create a user
- `GET /api/marketing/user/:id` - Get a user
- `POST /api/marketing/track` - Track an event
- `POST /api/marketing/email/send` - Send an email
- `POST /api/marketing/campaign/create` - Create a campaign
- And many more...

## Configuration

The marketing instance is configured in `lib/marketing.ts` with:

- **Memory Adapter**: For easy demo setup (no database required)
- **Mock Email Provider**: Logs emails to console
- **Mock SMS Provider**: Logs SMS to console
- **Mock Analytics**: Logs events to console
- **Rate Limiting**: Enabled for demo purposes

## Environment Variables

Optional environment variables:

```env
MARKETING_SECRET=your-secret-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

## Usage Examples

### Creating a User

```typescript
const user = await marketing.api.user.create({
  email: "user@example.com",
  firstName: "John",
  lastName: "Doe",
  properties: { signupSource: "website" },
});
```

### Tracking Events

```typescript
await marketing.api.track({
  userId: user.id,
  eventName: "purchase",
  properties: { product: "Premium Plan", amount: 99.99 },
});
```

### Sending Emails

```typescript
await marketing.api.email.send({
  to: "user@example.com",
  from: "noreply@yourapp.com",
  subject: "Welcome!",
  html: "<h1>Welcome to our platform!</h1>",
});
```

## Development

To make changes to the demo:

1. Edit files in `apps/marketing-demo/`
2. The dev server will automatically reload
3. Changes to the `better-marketing` package require rebuilding:
   ```bash
   pnpm --filter better-marketing build
   ```

## Learn More

- [Better Marketing Documentation](../packages/better-marketing/README.md)
- [Next.js Documentation](https://nextjs.org/docs)
