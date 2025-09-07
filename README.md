# Better Framework (Monorepo)

A minimal full-stack framework with type-safe client generation, flexible adapters, and plugin-driven endpoints. This repo includes:

- packages/better-framework: core framework (server + client SDK)
- apps/marketing-demo: Next.js demo showcasing internal users and notifications

## Quick start

1. Install deps

```bash
pnpm install
```

2. Dev the demo

```bash
pnpm turbo dev --filter framework-demo
```

3. Build all

```bash
pnpm -w -r build
```

## Concepts

- Endpoints: declare with `createFrameworkEndpoint(path, options, handler)`.
- Paths and params: use Express-style `:param` segments. Example: `/notification/get/:id`.
- Client generation: dynamic proxy maps static path segments to properties in camelCase and exposes a callable at the deepest static segment.
- Params input: pass route params at top-level (or via `params: { ... }`) plus optional `query` and `fetchOptions`.

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

Open `apps/marketing-demo` and check:

- `app/dashboard/page.tsx`: buttons and sample calls.
- `lib/marketing-client.ts`: client setup with the notifications client plugin.

Try from dashboard handler (with throw: true for brevity):

```ts
const userId = "ZUyWpp89hQLdOjQO";
await clientMk.user.create({
  email: "demo@example.com",
  fetchOptions: { throw: true },
});
await clientMk.notification.create({
  userId,
  title: "Hello",
  message: "World",
  fetchOptions: { throw: true },
});
await clientMk.notification.user({
  userId,
  unreadOnly: true,
  limit: 10,
  fetchOptions: { throw: true },
});
```

## How it works

- Types: `PathToObject` maps paths to nested objects. Param segments are skipped, deepest static segment is callable.
- Runtime: a dynamic proxy collects accessed properties to build a base path, then resolves the real route (including params) using plugin `pathMethods` and heuristics (first + last static segments). Params are inferred from the call argument.

## Notes

- Memory adapter is used in the demo. Swap adapters via core config to persist data.
- If paths overlap heavily, consider adding explicit `pathMethods` in the client plugin to help method resolution.
