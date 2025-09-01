import defu from "defu";
import { generateId, validateConfig } from "./core/utils";
import { getMarketingTables } from "./db/get-tables";
import { createInternalAdapter } from "./db/internal-adapter";
import { getMarketingAdapter } from "./db/utils";
import type { BetterMarketingOptions, MarketingContext } from "./types";
import { DEFAULT_SECRET } from "./utils/constants";
import { env, isProduction } from "./utils/env";
import { createLogger } from "./utils/logger";

export const init = async (options: BetterMarketingOptions) => {
  const adapter = await getMarketingAdapter(options);
  const plugins = options.plugins || [];
  const logger = createLogger(options.logger);

  const secret =
    options.secret ||
    env.BETTER_MARKETING_SECRET ||
    env.MARKETING_SECRET ||
    DEFAULT_SECRET;

  if (secret === DEFAULT_SECRET) {
    if (isProduction) {
      logger.error(
        "You are using the default secret. Please set `BETTER_MARKETING_SECRET` in your environment variables or pass `secret` in your marketing config."
      );
    }
  }

  // Create processed options with resolved adapter
  const processedOptions: BetterMarketingOptions = {
    baseURL: options.baseURL,
    basePath: options.basePath || "/api/marketing",
    trustedOrigins: ["http://localhost:3001", "https://localhost:3000"],
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // 1 day
    },
    rateLimit: {
      enabled: options.rateLimit?.enabled ?? isProduction,
      window: options.rateLimit?.window || 15 * 60 * 1000, // 15 minutes
      max: options.rateLimit?.max || 100,
    },
    ...options,
    secret,
    plugins,
  };

  // Validate configuration
  validateConfig(processedOptions);

  const generateIdFunc = (options: { model: string; size?: number }) => {
    if (typeof processedOptions.advanced?.generateId === "function") {
      return processedOptions.advanced.generateId(options);
    }
    return generateId(options.size || 16);
  };

  // Get database tables schema
  const tables = getMarketingTables(processedOptions);

  // Create internal adapter with enhanced functionality
  const internalAdapter = createInternalAdapter(adapter, {
    options: processedOptions,
    hooks: processedOptions.databaseHooks
      ? [processedOptions.databaseHooks]
      : [],
    logger,
    generateId: generateIdFunc,
  });

  let ctx: MarketingContext = {
    appName: (options as any).appName || "better-marketing",
    session: null,
    adapter,
    internalAdapter,
    options: processedOptions,
    secret,
    generateId: generateIdFunc,
    tables,
    logger,
    baseURL: processedOptions.baseURL,
  };

  const { context: pluginContext } = runPluginInit(ctx);

  return pluginContext;
};

function runPluginInit(ctx: MarketingContext) {
  let options = ctx.options;
  const plugins = options.plugins || [];
  let context: MarketingContext = ctx;
  const dbHooks: BetterMarketingOptions["databaseHooks"][] = [];
  for (const plugin of plugins) {
    if (plugin.init) {
      const result = plugin.init(context);
      if (typeof result === "object") {
        if (result.options) {
          const { databaseHooks, ...restOpts } = result.options;
          if (databaseHooks) {
            dbHooks.push(databaseHooks);
          }
          options = defu(options, restOpts);
        }
        if (result.context) {
          context = {
            ...context,
            ...(result.context as Partial<MarketingContext>),
          };
        }
      }
    }
  }
  // Add the global database hooks last
  dbHooks.push(options.databaseHooks);
  context.internalAdapter = createInternalAdapter(ctx.adapter, {
    options,
    logger: ctx.logger,
    hooks: dbHooks.filter((u) => u !== undefined),
    generateId: ctx.generateId,
  });
  context.options = options;
  return { context };
}
