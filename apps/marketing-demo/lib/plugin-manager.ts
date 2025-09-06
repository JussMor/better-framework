import type { BetterFrameworkPlugin } from "better-framework/types";

/**
 * Runtime Plugin Management for Better Framework
 * This demonstrates the correct way to add plugins at runtime
 */

import { myCustomPlugin } from "./custom-plugin";
import { marketing } from "./marketing";

/**
 * Initialize and add plugins at application startup
 * Call this in your app initialization (e.g., in a middleware or startup script)
 */
export async function initializeApplicationPlugins() {
  console.log("🚀 Initializing application plugins...");

  try {
    // Wait for framework to be ready
    await marketing.getContext();
    console.log("✅ Framework context ready");

    // Add custom plugin at runtime
    await marketing.addPlugin(myCustomPlugin());
    console.log("✅ Custom plugin added");

    // Add feature-based plugins
    await addFeaturePlugins();

    console.log("🎉 All plugins initialized successfully");
    logPluginStatus();
  } catch (error) {
    console.error("❌ Failed to initialize plugins:", error);
    throw error;
  }
}

/**
 * Add plugins based on feature flags or environment
 */
async function addFeaturePlugins() {
  // Example: Add analytics plugin conditionally
  const enableAnalytics = true; // This could come from feature flags

  if (enableAnalytics) {
    await marketing.addPlugin({
      id: "analytics-tracker",
      init: () => {
        console.log("📊 Analytics plugin initialized");
      },
      middlewares: [
        {
          path: "/api/*",
          middleware: async (ctx: unknown, next: () => Promise<unknown>) => {
            const start = Date.now();
            const result = await next();
            const duration = Date.now() - start;
            console.log(`📈 Request processed in ${duration}ms`);
            return result;
          },
        },
      ],
    });
  }

  // Example: Add debugging plugin in development
  const isDevelopment = process.env.NODE_ENV !== "production";
  if (isDevelopment) {
    await marketing.addPlugin({
      id: "debug-logger",
      init: () => {
        console.log("🐛 Debug logger plugin initialized");
      },
      middlewares: [
        {
          path: "/api/framework/*",
          middleware: async (ctx: unknown, next: () => Promise<unknown>) => {
            console.log("🔍 Debug: Framework endpoint called");
            return next();
          },
        },
      ],
    });
  }
}

/**
 * Dynamically add a plugin based on user action or configuration
 */
export async function addPluginOnDemand(pluginConfig: {
  id: string;
  features: string[];
}) {
  console.log(`📦 Adding on-demand plugin: ${pluginConfig.id}`);

  await marketing.addPlugin({
    id: pluginConfig.id,
    init: () => {
      console.log(
        `🔌 On-demand plugin ${pluginConfig.id} loaded with features:`,
        pluginConfig.features
      );
    },
    endpoints: {
      // Dynamic endpoints based on features
    },
  });

  console.log(`✅ Plugin ${pluginConfig.id} added successfully`);
}

/**
 * Remove a plugin at runtime
 */
export async function removePluginOnDemand(pluginId: string) {
  console.log(`🗑️ Removing plugin: ${pluginId}`);

  await marketing.removePlugin(pluginId);

  console.log(`✅ Plugin ${pluginId} removed successfully`);
  logPluginStatus();
}

/**
 * Get current plugin status
 */
export function getPluginStatus() {
  const plugins = marketing.getPlugins();
  return {
    isFrameworkInitialized: marketing.isInitialized,
    totalPlugins: plugins.size,
    loadedPlugins: Array.from(plugins.keys()),
    pluginDetails: Array.from(plugins.entries()).map(([id, plugin]) => ({
      id,
      hasInit: typeof plugin.init === "function",
      hasEndpoints:
        !!plugin.endpoints && Object.keys(plugin.endpoints).length > 0,
      hasMiddlewares: !!plugin.middlewares && plugin.middlewares.length > 0,
    })),
  };
}

/**
 * Log current plugin status
 */
function logPluginStatus() {
  const status = getPluginStatus();
  console.log("📋 Plugin Status:", {
    total: status.totalPlugins,
    plugins: status.loadedPlugins,
  });
}

/**
 * Example: Hot reload a plugin (remove and re-add)
 */
export async function hotReloadPlugin(
  pluginId: string,
  newPluginFactory: () => BetterFrameworkPlugin
) {
  console.log(`🔄 Hot reloading plugin: ${pluginId}`);

  // Remove existing plugin
  await marketing.removePlugin(pluginId);

  // Add updated plugin
  await marketing.addPlugin(newPluginFactory());

  console.log(`✅ Plugin ${pluginId} hot reloaded`);
}
