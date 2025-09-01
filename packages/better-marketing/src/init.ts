import defu from "defu";
import { generateId, validateConfig } from "./core/utils";
import { getMarketingTables } from "./db/get-tables";
import { createInternalAdapter } from "./db/internal-adapter";
import { getMarketingAdapter } from "./db/utils";
import type { BetterMarketingOptions, MarketingContext } from "./types";
import { DEFAULT_SECRET } from "./utils/constants";
import { env, isProduction } from "./utils/env";
import { createLogger } from "./utils/logger";

/**
 * Initialize core marketing context (adapter, options, plugins, hooks, etc.).
 * Keeps logic linear & explicit for easier debugging.
 */
export const init = async (rawOptions: BetterMarketingOptions) => {
  const adapter = await getMarketingAdapter(rawOptions);
  const logger = createLogger(rawOptions.logger);
  const plugins = rawOptions.plugins || [];

  // Resolve secret with fallbacks
  const secret =
    rawOptions.secret ||
    env.BETTER_MARKETING_SECRET ||
    env.MARKETING_SECRET ||
    DEFAULT_SECRET;
  if (secret === DEFAULT_SECRET && isProduction) {
    logger.error(
      "Using default secret. Set BETTER_MARKETING_SECRET env variable or provide options.secret."
    );
  }

  // Defaults (computed where needed) merged with user options
  const defaults: BetterMarketingOptions = {
    basePath: "/api/marketing",
    trustedOrigins: ["http://localhost:3001", "https://localhost:3000"],
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
    },
    rateLimit: {
      enabled: rawOptions.rateLimit?.enabled ?? isProduction,
      window: rawOptions.rateLimit?.window || 15 * 60 * 1000,
      max: rawOptions.rateLimit?.max || 100,
    },
    plugins,
    secret,
  } as BetterMarketingOptions;

  // defu preserves existing keys on left (rawOptions) and fills from defaults
  const options = defu(rawOptions, defaults) as BetterMarketingOptions;

  // Validate merged options
  validateConfig(options);

  // ID generator (user override > default util)
  const generateIdFn = (o: { model: string; size?: number }) =>
    typeof options.advanced?.generateId === "function"
      ? options.advanced.generateId(o)
      : generateId(o.size || 16);

  const tables = getMarketingTables(options);

  // Initial internal adapter (before plugin-added hooks)
  const baseInternalAdapter = createInternalAdapter(adapter, {
    options,
    hooks: options.databaseHooks ? [options.databaseHooks] : [],
    logger,
    generateId: generateIdFn,
  });

  let context: MarketingContext = {
    appName: (rawOptions as any).appName || "better-marketing",
    session: null,
    adapter,
    internalAdapter: baseInternalAdapter,
    options,
    secret,
    generateId: generateIdFn,
    tables,
    logger,
    baseURL: options.baseURL,
  };

  // Apply plugin init (options/context layering + DB hooks aggregation)
  context = applyPluginInit(context);

  return context;
};

/**
 * Run plugin init lifecycle: merges plugin-provided option fragments & context,
 * aggregates database hooks, then rebuilds the internal adapter with all hooks.
 */
function applyPluginInit(baseCtx: MarketingContext): MarketingContext {
  let mergedOptions = baseCtx.options;
  let ctx = baseCtx;
  const dbHooks: BetterMarketingOptions["databaseHooks"][] = [];

  for (const plugin of mergedOptions.plugins || []) {
    if (!plugin.init) continue;
    const result = plugin.init(ctx);
    if (result && typeof result === "object") {
      if (result.options) {
        const { databaseHooks, ...rest } = result.options;
        if (databaseHooks) dbHooks.push(databaseHooks);
        mergedOptions = defu(mergedOptions, rest);
      }
      if (result.context) {
        ctx = { ...ctx, ...(result.context as Partial<MarketingContext>) };
      }
    }
  }

  // Include original global database hooks last so they can override earlier ones if needed
  if (mergedOptions.databaseHooks) dbHooks.push(mergedOptions.databaseHooks);

  const mergedHooks = dbHooks.filter((h): h is NonNullable<typeof h> => !!h);
  ctx.internalAdapter = createInternalAdapter(ctx.adapter, {
    options: mergedOptions,
    logger: ctx.logger,
    hooks: mergedHooks,
    generateId: ctx.generateId,
  });
  ctx.options = mergedOptions;
  return ctx;
}
