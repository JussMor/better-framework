# Type Inference Fix: `clientMk.user` Marked as Possibly Undefined

## Summary

`clientMk.user` (and nested calls like `clientMk.user.create`) showed the TypeScript warning:

```
'clientMk.user' is possibly 'undefined'.ts(18048)
```

Runtime calls worked, but static types collapsed into broad index signatures:

```
(alias) const clientMk: { [x: Lowercase<string>]: { [x: Lowercase<string>]: never } } & { [x: Lowercase<string>]: never } & { ... }
```

This indicated the route-to-object inference failed to materialize concrete nested route properties.

## Root Causes

1. **Missing action metadata**: Endpoints lacked `metadata: { isAction: true }`, so filtering logic (`isAction: false` exclusion) risked removing them from inferred API unions.
2. **`getEndpoints` typing erasure**: Returned `api` lost literal endpoint type info in the build (emitted as `any`), preventing `PathToObject` from generating structured types.
3. **Over-complication attempt**: An intermediate change to `PathToObject` (skipping params) added complexity without fixing the underlying loss of literal types.
4. **Optional top-level grouping**: Union/intersection expansion plus partially inferred keys caused TypeScript to treat groups like `user` as optional, producing the fallback index signature.

## Fixes Applied

| Order | Change                                                                        | Purpose                                                                   |
| ----- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| 1     | Added `metadata: { isAction: true }` to user endpoints                        | Ensures they are kept by filtering logic                                  |
| 2     | Restored simple `PathToObject` (mirroring better-auth)                        | Stable, predictable key mapping                                           |
| 3     | Narrowed `getEndpoints` return type to base endpoints (`user` + `ok`/`error`) | Preserves literal path typing; plugin endpoints stay runtime-only         |
| 4     | (Transitional) Added `RequireTopLevel` / `EnsureDefined` wrappers             | Eliminated optional group warning (can now be optional to keep or remove) |
| 5     | Refactored `toMarketingEndpoints` to auth-style                               | Reduced complexity; consistent hook processing                            |

## Current State

- `clientMk.user.create` now fully typed (no undefined warning).
- Declarations in `dist/shared/...DkNBmWXq.d.ts` show concrete mapping via `PathToObject`.
- Type check (`tsc --noEmit`) passes with zero errors.

## UPDATE (Campaigns Plugin Inference)

After stabilizing core user endpoint inference, plugin endpoints (e.g. the new `campaigns` plugin) initially did **not** surface on the client API. Symptoms:

```
client.campaign // Property 'campaign' does not exist on type ...
```

### Additional Root Causes (Plugins)

1. **Server plugin shape mismatch**: The campaigns plugin exported a `routes` object instead of the expected `endpoints` property (`BetterMarketingPlugin['endpoints']`), so `getEndpoints` ignored it.
2. **Generic widening**: Declaring `campaignsPlugin` as `(): BetterMarketingPlugin => ({ ... })` erased literal endpoint key types; they widened to `Record<string, Endpoint>` and were lost to the client inference utility.
3. **Client plugin assertion collapse**: `campaignsClientPlugin` used `$InferServerPlugin: {} as ReturnType<typeof campaignsPlugin>` without preserving the narrowed generic, so `$InferServerPlugin.endpoints` again widened.
4. **Path-to-object reliance**: The client only builds nested objects from endpoint *paths* discovered in the endpoint union. With plugin endpoints excluded (points 1–3), no `/campaign/*` paths were available to map to `client.campaign.*`.

### Plugin Fixes Applied

| Order | Change | Purpose |
| ----- | ------ | ------- |
| P1 | Rewrote `campaignsPlugin` to expose `endpoints` built with `createMarketingEndpoint` + `metadata.isAction = true` | Makes plugin endpoints eligible for filtering & inference |
| P2 | Used `satisfies BetterMarketingPlugin<{ explicit endpoint map }>` | Preserves literal endpoint keys for `$InferServerPlugin` |
| P3 | Updated client plugin to `satisfies MarketingClientPlugin` | Prevents widening of `$InferServerPlugin` type |
| P4 | Added compile-time test `campaigns-plugin-infer.test.ts` | Guards presence of `client.campaign.create` & friends |
| P5 | (Deferred) Param segment handling improvement | Not yet replacing `:id` segment dynamically in proxy |

### Current Plugin Inference Status

- `client.campaign.create` and `client.campaign.list` are now typed & callable.
- Endpoint keys (`createCampaign`, etc.) are *implementation* names; client nesting derives from paths (`/campaign/create` → `client.campaign.create`).
- Param endpoints (`/campaign/get/:id`) appear as `client.campaign.get[":id"]` (temporary ergonomic limitation).

### Remaining Gaps / Technical Debt

1. **Param interpolation**: Dynamic replacement for `:id` in proxy calls (e.g. `client.campaign.get({ id })`) not implemented.
2. **Stricter plugin endpoint typing**: Could add a `MarketingClientPluginWithEndpoints<E>` helper generic to reduce repetitive `satisfies` patterns.
3. **Optional runtime validation**: Verify plugin endpoint collisions and emit compile-time diagnostics (e.g. duplicate paths across plugins).
4. **Docs clarity**: Need a dedicated section describing how plugin endpoint paths become nested client properties and why the *paths*, not the endpoint object keys, drive nesting.
5. **Test coverage**: Add a negative test ensuring absent plugin doesn’t expose `client.campaign`.

## Recommended Next Steps

1. **Param interpolation** (`:id`) in client proxy.
2. **Helper generics** to streamline plugin endpoint declarations.
3. **Extend tests**: Negative test for missing plugin; param endpoint test once interpolation added.
4. **Doc updates**: Add “How plugin paths become client namespaces” & emphasize `metadata.isAction = true`.
5. **Remove transitional wrappers** (`RequireTopLevel`) after confirming no regression with multiple plugins.

## Minimal Compile-Time Assertion Example

```ts
// tests/type/user-endpoints.test-d.ts
import { clientMk } from "../apps/marketing-demo/lib/marketing-client";
// Should be callable:
clientMk.user.create({ email: "a@b.com" });
// @ts-expect-error - non-existent route
clientMk.user.unknownAction();
```

## Lessons Learned

- Preserve literal endpoint information as early as possible (avoid `any` in internal factories).
- Filtering logic (`isAction`) must be explicitly satisfied by each public endpoint.
- Simpler path mapping avoids accidental widening that leads to index signatures.
- Keep plugin endpoint literals intact by using `satisfies` with explicit endpoint maps—avoid broad interface return annotations that erase literal keys.
- Always align server plugin property name with the aggregator (`endpoints` not custom names like `routes`).

## Rollback Safety

All fixes are additive and type-level only; runtime behavior of endpoints and hooks remains unchanged.

---

Generated on: 2025-09-01
