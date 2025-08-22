/**
 * Main BetterMarketing class and configuration
 */

import type {
  BetterMarketingConfig,
  BetterMarketingInstance,
  MarketingAPI,
} from "../types";
import { createMarketingAPI } from "./api";
import { createMarketingHandler } from "./handler";
import { PluginManager } from "./plugin-manager";
import { validateConfig } from "./utils";

export class BetterMarketing implements BetterMarketingInstance {
  public config: BetterMarketingConfig;
  public api: MarketingAPI;
  public handler: (request: Request) => Promise<Response>;
  private pluginManager: PluginManager;

  constructor(config: BetterMarketingConfig) {
    // Validate configuration
    validateConfig(config);

    this.config = {
      baseURL: "/api/marketing",
      trustedOrigins: ["http://localhost:3000", "https://localhost:3000"],
      session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // 1 day
      },
      rateLimit: {
        window: 15 * 60 * 1000, // 15 minutes
        max: 100,
      },
      ...config,
    };

    // Initialize plugin manager
    this.pluginManager = new PluginManager(this.config.plugins || []);

    // Create API instance
    this.api = createMarketingAPI(this.config, this.pluginManager);

    // Create request handler
    this.handler = createMarketingHandler(
      this.config,
      this.api,
      this.pluginManager
    );
  }

  /**
   * Initialize the marketing instance and all plugins
   */
  async init(): Promise<void> {
    await this.pluginManager.init();
  }

  /**
   * Cleanup resources and destroy plugins
   */
  async destroy(): Promise<void> {
    await this.pluginManager.destroy();
  }

  /**
   * Get plugin by name
   */
  getPlugin<T = any>(name: string): T | undefined {
    return this.pluginManager.getPlugin(name);
  }

  /**
   * Check if plugin is registered
   */
  hasPlugin(name: string): boolean {
    return this.pluginManager.hasPlugin(name);
  }
}

/**
 * Create a new BetterMarketing instance
 */
export function betterMarketing(
  config: BetterMarketingConfig
): BetterMarketing {
  return new BetterMarketing(config);
}

export type { BetterMarketingConfig };
