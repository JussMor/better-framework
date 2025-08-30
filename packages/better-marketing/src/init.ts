import { PluginManager } from "./core/plugin-manager";
import { generateId, validateConfig } from "./core/utils";
import { getMarketingTables } from "./db/get-tables";
import { createInternalAdapter } from "./db/internal-adapter";
import { getMarketingAdapter } from "./db/utils";
import type { BetterMarketingOptions } from "./types";
import { DEFAULT_SECRET } from "./utils/constants";
import { env, isProduction } from "./utils/env";
import { createLogger } from "./utils/logger";
import { getBaseURL } from "./utils/url";

export const init = async (options: BetterMarketingOptions) => {
  const adapter = await getMarketingAdapter(options);
  const plugins = options.plugins || [];
  const logger = createLogger(options.logger);
  const baseURL = getBaseURL(options.baseURL, options.basePath);

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
    baseURL: "/api/marketing",
    basePath: baseURL || "/api/marketing",
    trustedOrigins: ["http://localhost:3000", "https://localhost:3000"],
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

  // Create final config with resolved adapter for validation and API creation
  const finalConfig: BetterMarketingOptions = {
    ...processedOptions,
    database: adapter,
    secret,
  };

  // Validate configuration
  validateConfig(finalConfig);

  const generateIdFunc = (options: { model: string; size?: number }) => {
    if (typeof processedOptions.advanced?.generateId === "function") {
      return processedOptions.advanced.generateId(options);
    }
    return generateId(options.size || 16);
  };

  // Get database tables schema
  const tables = getMarketingTables(processedOptions);

  // Initialize plugin manager
  const pluginManager = new PluginManager(plugins);

  // Create internal adapter with enhanced functionality
  const internalAdapter = createInternalAdapter(adapter, {
    options: processedOptions,
    hooks: processedOptions.databaseHooks
      ? [processedOptions.databaseHooks]
      : [],
    logger,
    generateId: generateIdFunc,
  });

  return {
    adapter,
    internalAdapter,
    pluginManager,
    options: finalConfig,
    secret,
    generateId: generateIdFunc,
    tables,
    logger,
    baseURL: processedOptions.baseURL,
  };
};
