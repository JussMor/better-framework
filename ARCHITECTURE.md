# better-marketing — Architecture, Debugging, and Modification Guide

This document explains the repository architecture, how to run and debug the code locally, and step-by-step modification workflows for common change types.

## Quick summary

- Repo type: monorepo (pnpm + Turborepo)
- Main apps: `apps/docs`, `apps/marketing-demo`, `apps/web` and `packages/better-marketing` (library)
- Frameworks: Next.js (app dir), TypeScript, Tailwind/CSS in apps where present

## Repo layout (high level)

- package.json, pnpm-workspace.yaml, turbo.json — workspace orchestration
- apps/ — consumer applications (Next.js apps and demos)
  - docs/ — documentation site
  - marketing-demo/ — demo app used for marketing flows
  - web/ — primary marketing site
- packages/ — shared libraries and packages
  - better-marketing/ — primary package for reusable components, CLI, helpers (src/)
  - eslint-config/, typescript-config/, ui/ — shared tooling and UI components
- better-auth/ — a sibling project in repo used for auth demo and integration

Files you'll often edit

- `packages/better-marketing/src` — core library code
- `apps/marketing-demo/app` — the demo app using the package
- `apps/*/next.config.js`, `tsconfig.json`, `package.json` per app — per-app configuration

## Data flow & architecture concepts

- Consumer apps (Next.js apps) import shared code from `packages/*` via workspace resolution.
- `packages/better-marketing/src/api` contains client helpers/hooks that wrap server endpoints used by the apps (for example, `to-marketing-endpoints-hooks.ts`).
- API routes or server logic typically live inside each Next.js app under `app/api` or inside server-only libraries referenced by those routes.
- The monorepo uses Turborepo to orchestrate builds and caching; changes in packages are visible to apps during `pnpm turbo dev` because pnpm workspaces symlink packages.

## How to run locally (quick)

1. Install dependencies at repo root:

```bash
pnpm install
```

2. Start all apps in dev mode (recommended for cross-app changes):

```bash
pnpm turbo dev
```

3. Start a single app (example: marketing-demo) if you only need one running:

```bash
pnpm turbo dev --filter marketing-demo
# or
pnpm --filter marketing-demo dev
```

4. Run tests for a package:

```bash
pnpm --filter packages/better-marketing test
```

(Replace `packages/better-marketing` with the package/app name you'd like to test.)

## Debugging tips

1. Use the browser console and network tab for client-side problems.
2. For Next.js server-side issues:
   - Run the app in dev mode (`pnpm turbo dev`) so that server logs and stack traces are visible.
   - Inspect `app/api` routes (or other server files) and add logging (console.error/console.log).
3. Use VS Code debugger to attach to Next.js server (Node). Add a launch configuration that starts `pnpm turbo dev` or attaches to the running Node process.
4. Trace imports to confirm you're editing the right file: use workspace-wide search for the symbol (e.g., `to-marketing-endpoints-hooks`) to find usages.
5. If changes in `packages/*` aren't reflected in apps:
   - Confirm `pnpm install` completed with workspace links.
   - Re-run `pnpm turbo dev` (Turborepo caches can hide changes).
   - Run `pnpm -w -F <package> build` or `pnpm --filter <package> build` to force package rebuild.
6. Check ESLint/TypeScript errors in VS Code Problems panel; run linters locally:

```bash
pnpm -w lint
pnpm -w -F packages/better-marketing typecheck
```

7. Common logs to inspect: terminal where `pnpm turbo dev` runs, browser console, `apps/*/logs` if produced, and CI logs for failing builds.

## Step-by-step: modify a small feature (example: add a field to marketing hook)

1. Identify the consumer and the library:
   - Search for where the hook or API is used: `grep` or VS Code search for `useMarketing*` or `to-marketing-endpoints-hooks`.
2. Update the shape/type:
   - Edit TypeScript types in `packages/better-marketing/src` (for example, a DTO or interface).
3. Update implementation:
   - Edit `packages/better-marketing/src/api/to-marketing-endpoints-hooks.ts` (or the relevant file).
4. Update consumers:
   - Open `apps/marketing-demo` (or other consumer) and update usages (components/pages) to use the new field.
5. Run typecheck and lint for quick feedback:

```bash
pnpm -w -F packages/better-marketing typecheck
pnpm -w -F apps/marketing-demo typecheck
pnpm -w lint
```

6. Run the demo app locally:

```bash
pnpm turbo dev --filter marketing-demo
```

7. Manually verify in the browser and run tests:

```bash
pnpm --filter packages/better-marketing test
pnpm --filter apps/marketing-demo test
```

8. Commit and push: keep commits focused and small. Use conventional commit messages if the repository expects them.

## Step-by-step: add a new API route consumed by apps

1. Decide which app hosts the API (often the app needing it) or put it into a shared server package.
2. Create the route under `apps/<app>/app/api/<route>/route.ts` (Next.js app router) or `pages/api` for pages-router.
3. Implement server logic and export typed request/response shapes.
4. Add a client helper in `packages/better-marketing/src/api` to call the new route and add a hook for React usage.
5. Update consumers to use the new hook.
6. Add tests for server route and client helper.
7. Run the dev environment and verify end-to-end.

## Quality gates & CI

- Run unit tests and integration tests for changed packages.
- Run typecheck and lint.
- Run `pnpm turbo build` for a final verification before merge if the change affects multiple packages.

## Common pitfalls & troubleshooting

- Stale Turborepo cache: run `pnpm turbo prune` or start with `--force` where supported.
- Unlinked workspace package: run `pnpm install` at repo root.
- Environment variables: local `.env.local` files are app-specific. Check `next.config.js` and README in each app for required vars.

## Contact points / next steps

- If you want, I can add a per-package quick-start (one-liners) or expand this doc with sample VS Code launch.json snippets to attach debuggers.

---

File created: `ARCHITECTURE.md` — placed at repo root with an overview, debugging steps, and modification workflows.
