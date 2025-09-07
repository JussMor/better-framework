# Better Framework (Monorepo)

> **Build your backend once, get a type-safe frontend SDK automatically**

A minimal full-stack framework that provides automatic frontend SDK generation from backend API definitions. Define your endpoints once on the server, and get a fully type-safe client with IntelliSense, error handling, and automatic route resolution.

This repo includes:

- `packages/better-framework`: core framework (server + automatic client SDK generation)
- `apps/marketing-demo`: Next.js demo showcasing internal users and notifications

## Key Features

✨ **Automatic SDK Generation**: Write backend endpoints, get type-safe frontend client automatically  
🔒 **Full Type Safety**: End-to-end TypeScript with inference from server to client  
🚀 **Zero Config**: Dynamic proxy client with automatic route resolution  
🔌 **Plugin-Driven**: Extensible with custom endpoints and schemas  
📱 **Framework Agnostic**: Works with Next.js, React, Vue, or any frontend

## How it works: Backend → Frontend SDK

### 1. Define your backend endpoint

```ts
// On the server
const createUser = () =>
  createFrameworkEndpoint(
    "/user/create",
    {
      method: "POST",
      body: z.object({
        email: z.string().email(),
        firstName: z.string().optional(),
      }),
    },
    async (ctx) => {
      const user = await ctx.context.internalAdapter.createUser(ctx.body);
      return { user };
    }
  );
```

### 2. Get automatic type-safe client

```ts
// On the frontend - automatically generated!
const result = await client.user.create({
  email: "demo@example.com",
  firstName: "John",
  fetchOptions: { throw: true }, // Get typed data directly
});
// result.user is fully typed from server definition ✨
```

### 3. Access the raw framework API (advanced)

For direct access to the framework's internal methods:

```ts
// Direct API access (bypasses the generated client)
const user = await framework.api.createUser({
  email: "demo@example.com",
  firstName: "John",
});

// Or access the full framework context
const context = await framework.$ctx;
const adapter = context.internalAdapter;
const directUser = await adapter.createUser({
  email: "demo@example.com",
  segments: [],
});
```

## Getting Started

### 1. Installation

```bash
# Clone and install
git clone <repo-url>
pnpm install
```

### 2. Development

```bash
# Start the demo app
pnpm turbo dev --filter framework-demo

# Open http://localhost:3001
# Navigate to /users or /notifications to see the SDK in action
```

### 3. Build everything

```bash
pnpm turbo build
```

### 4. Use in your project

```bash
# Install the framework
npm install better-framework

# Set up your backend
# Set up your client
# Start building type-safe APIs!
```

## CLI Tools (Development)

The framework includes a powerful CLI for project scaffolding and database management. Since the CLI is not yet published, you can use it directly from the monorepo:

### Setup CLI for development

```bash
# Build the CLI
cd packages/cli
pnpm build

# Link globally (optional)
npm link

# Or run directly with pnpm
pnpm --filter @better-framework/cli start [command]
```

### Available Commands

#### `better-framework init`

Bootstrap a new Better Framework project with interactive setup:

```bash
# Interactive project setup
node packages/cli/dist/index.mjs init

# Or if linked globally
better-framework init
```

Features:

- 📦 **Project scaffolding**: Creates starter files and folder structure
- 🔧 **Dependency management**: Installs required packages
- ⚙️ **Configuration setup**: Generates framework config with database
- 🔑 **Secret generation**: Creates secure authentication secrets
- 📱 **Framework selection**: Supports Next.js, Express, and more
- 🗄️ **Database adapters**: Configures SQLite, PostgreSQL, MySQL, etc.

#### `better-framework generate`

Generate database schema and types from your framework configuration:

```bash
# Generate schema from current config
node packages/cli/dist/index.mjs generate

# Specify custom config file
node packages/cli/dist/index.mjs generate --config ./custom-config.ts

# Custom output directory
node packages/cli/dist/index.mjs generate --output ./generated
```

Features:

- 🏗️ **Schema generation**: Creates database schema from plugins
- 📝 **Type generation**: Generates TypeScript types
- 🔄 **Auto-sync**: Keeps schema in sync with code changes
- 🎯 **Smart detection**: Analyzes your endpoints and plugins

#### `better-framework migrate`

Run database migrations:

```bash
# Run pending migrations
node packages/cli/dist/index.mjs migrate

# Auto-confirm all prompts
node packages/cli/dist/index.mjs migrate --yes
```

Features:

- 🚀 **Auto-migration**: Generates and runs migrations
- 📊 **Schema diff**: Shows changes before applying
- 🛡️ **Safe migrations**: Validates before execution
- 📝 **Migration history**: Tracks applied changes

#### `better-framework secret`

Generate secure secrets for your application:

```bash
# Generate a new auth secret
node packages/cli/dist/index.mjs secret
```

Output:

```bash
Add the following to your .env file:
# Auth Secret
BETTER_AUTH_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

#### `better-framework info`

Display framework and project information:

```bash
# Show framework version and config info
node packages/cli/dist/index.mjs info
```

### CLI Development Workflow

1. **Initialize project**:

   ```bash
   better-framework init
   # Follow interactive prompts
   ```

2. **Generate schema**:

   ```bash
   better-framework generate
   # Creates schema files and types
   ```

3. **Run migrations**:

   ```bash
   better-framework migrate
   # Applies database changes
   ```

4. **Development cycle**:
   ```bash
   # Add new endpoints/plugins
   # Re-generate schema
   better-framework generate
   # Apply changes
   better-framework migrate
   ```

### CLI Configuration

The CLI reads configuration from your framework setup file:

```ts
// framework.ts
export const framework = betterFramework({
  database: {
    /* ... */
  },
  plugins: [
    /* ... */
  ],
  // CLI will use this config for generation and migration
});
```

### Future CLI Features (Roadmap)

- 📦 **Plugin marketplace**: Install community plugins
- 🔄 **Code generation**: Generate CRUD endpoints
- 📊 **Analytics**: Performance and usage insights
- 🧪 **Testing**: Generate test files
- 🚀 **Deployment**: Deploy to various platforms

## Concepts

The framework provides three levels of API access:

### 1. **Generated Client SDK** (Recommended)

The automatic type-safe client generated from your backend endpoints:

```ts
await client.user.create({ email, firstName, fetchOptions: { throw: true } });
await client.notification.user({ userId, query: { unreadOnly: true } });
```

### 2. **Framework API** (Direct server access)

Direct access to framework methods for advanced use cases:

```ts
await framework.api.createUser({ email, firstName });
await framework.api.getUserNotifications({ userId, unreadOnly: true });
```

### 3. **Raw Adapter** (Lowest level)

Direct database adapter access:

```ts
const ctx = await framework.$ctx;
await ctx.internalAdapter.createUser({ email, segments: [] });
```

### Client Generation Rules

- **Endpoints**: declare with `createFrameworkEndpoint(path, options, handler)`.
- **Paths and params**: use Express-style `:param` segments. Example: `/notification/get/:id`.
- **Client generation**: dynamic proxy maps static path segments to properties in camelCase and exposes a callable at the deepest static segment.
- **Params input**: pass route params at top-level (or via `params: { ... }`) plus optional `query` and `fetchOptions`.

### Route → Client shape mapping

Given these server routes:

- `/user/get/:id` → `client.user.get({ id })`
- `/notification/create` → `client.notification.create({ ...body })`
- `/notification/get/:id` → `client.notification.get({ id })`
- `/notification/user/:userId` → `client.notification.user({ userId, unreadOnly?, limit? })`

General rules:

- Static segments become nested properties (kebab-case → camelCase): `/foo-bar/baz` → `client.fooBar.baz(...)`.
- Param segments (`:id`) are skipped in the property path but their names are still inferred as required input keys for the callable.
- The callable is at the deepest static segment of the path.

### Input shape

For a given endpoint signature `(ctx: { body, query, params }) => output` the client call looks like:

```ts
await client.some.static.segment({
  // body fields (if any)
  // query fields (optional under `query` OR hoisted when declared)
  query?: { ... },
  // route params as top-level keys (or nested under `params`)
  ...params,
  params?: { ...params },
  // optional fetch options
  fetchOptions?: BetterFetchOption
})
```

## Using internal Users

The core package ships internal user endpoints:

- POST `/user/create` → `client.user.create({ email, firstName?, lastName?, phone?, properties? })`
- GET `/user/get/:id` → `client.user.get({ id })`
- PUT `/user/update/:id` → `client.user.update({ id, ...fieldsToUpdate })`
- DELETE `/user/delete/:id` → `client.user.delete({ id })`

Example (with throw: true to get typed data directly):

```ts
const created = await client.user.create({
  email: "demo@example.com",
  firstName: "Demo",
  fetchOptions: { throw: true },
});
const found = await client.user.get({
  id: created.user.id,
  fetchOptions: { throw: true },
});
const updated = await client.user.update({
  id: found.user.id,
  lastName: "User",
  fetchOptions: { throw: true },
});
await client.user.delete({
  id: updated.user.id,
  fetchOptions: { throw: true },
});
```

## Notifications plugin (demo)

The demo app includes a notifications plugin with routes like:

- POST `/notification/create` → `client.notification.create({ title, message, type?, userId, priority?, metadata? })`
- GET `/notification/get/:id` → `client.notification.get({ id })`
- GET `/notification/user/:userId` → `client.notification.user({ userId, unreadOnly?, limit? })`
- PUT `/notification/mark-read/:id` → `client.notification.markRead({ id })`
- DELETE `/notification/delete/:id` → `client.notification.delete({ id })`

## Demo walkthrough

Open `apps/marketing-demo` to see the framework in action:

- **`app/users/page.tsx`**: Complete CRUD workflow using the generated client
- **`app/notifications/page.tsx`**: Plugin-based notifications with automatic SDK
- **`lib/marketing-client.ts`**: Client setup with plugins and type inference
- **`lib/framework.ts`**: Server configuration with database and plugins

### Example: Complete user workflow

```ts
// All client calls are type-safe and auto-generated from server endpoints
const user = await client.user.create({
  email: "demo@example.com",
  firstName: "Demo",
  fetchOptions: { throw: true }, // Get typed response directly
});

const found = await client.user.get({
  id: user.user.id,
  fetchOptions: { throw: true },
});

const updated = await client.user.update({
  id: found.user.id,
  lastName: "User",
  fetchOptions: { throw: true },
});

await client.user.delete({
  id: updated.user.id,
  fetchOptions: { throw: true },
});
```

### Example: Plugin-based notifications

```ts
// Create notification
await client.notification.create({
  userId: user.user.id,
  title: "Welcome",
  message: "Account created successfully",
  type: "success",
  fetchOptions: { throw: true },
});

// Get user notifications with query parameters
const notifications = await client.notification.user({
  userId: user.user.id,
  query: { unreadOnly: true, limit: 10 },
  fetchOptions: { throw: true },
});
```

### Advanced: Direct framework API access

```ts
// Access framework API directly (bypasses generated client)
const directUser = await framework.api.createUser({
  email: "direct@example.com",
  firstName: "Direct",
});

// Access raw adapter for custom operations
const context = await framework.$ctx;
const allUsers = await context.internalAdapter.findMany({
  model: "user",
  where: [{ field: "email", operator: "contains", value: "@example.com" }],
});
```

## Architecture: Backend → Frontend SDK

The framework automatically generates a type-safe frontend SDK from your backend API definitions:

### 1. **Server Endpoint Definition**

```ts
// Define once on the server
const createUser = () =>
  createFrameworkEndpoint(
    "/user/create",
    {
      method: "POST",
      body: z.object({
        email: z.string().email(),
        firstName: z.string().optional(),
      }),
    },
    async (ctx) => {
      const user = await ctx.context.internalAdapter.createUser(ctx.body);
      return { user };
    }
  );
```

### 2. **Automatic Client Generation**

```ts
// Use anywhere on the frontend - fully typed!
const result = await client.user.create({
  email: "demo@example.com", // ✅ Type-safe
  firstName: "John", // ✅ Optional, as defined
  // invalidField: "error",   // ❌ TypeScript error
  fetchOptions: { throw: true },
});
// result.user is typed based on server return ✨
```

### 3. **Route Resolution Magic**

- **Static segments** (`/user`, `/notification`) → **Nested properties** (`client.user`, `client.notification`)
- **Dynamic segments** (`/:id`, `/:userId`) → **Function parameters** (`{ id }`, `{ userId }`)
- **HTTP methods** → **Automatically inferred** from `pathMethods` and heuristics
- **Types** → **End-to-end inference** from server schema to client response

### 4. **Plugin System**

Extend with custom endpoints that automatically generate client methods:

```ts
// Server plugin
export const notificationsPlugin = () => ({
  endpoints: {
    createNotification: createNotificationEndpoint(),
    getUserNotifications: getUserNotificationsEndpoint(),
    // ... more endpoints
  },
});

// Client automatically gets:
// client.notification.create(...)
// client.notification.user(...)
```

## Acknowledgments

This framework is inspired by and builds upon the excellent work of the [Better Auth](https://www.better-auth.com) team. Better Auth provides a comprehensive authentication solution with similar principles of type safety and developer experience that we've adopted for this full-stack framework.

Special thanks to the Better Auth community for pioneering many of the patterns we use here for automatic SDK generation and type-safe client-server communication.

## Notes

- Memory adapter is used in the demo. Swap adapters via core config to persist data.
- If paths overlap heavily, consider adding explicit `pathMethods` in the client plugin to help method resolution.
