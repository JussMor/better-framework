/**
 * CORRECT RUNTIME PLUGIN USAGE EXAMPLE
 *
 * This shows the proper way to add BetterFrameworkPlugin at runtime,
 * not at compile time in the plugins array.
 */

import type { BetterFrameworkPlugin } from "better-framework/types";
import { myCustomPlugin } from "./custom-plugin";
import { marketing } from "./marketing";

// ✅ CORRECT: Add plugins at runtime
export async function addRuntimePlugins() {
  // Wait for framework initialization
  await marketing.getContext();

  // Add your custom plugin at runtime
  await marketing.addPlugin(myCustomPlugin());

  // Add another plugin dynamically
  const dynamicPlugin: BetterFrameworkPlugin = {
    id: "dynamic-plugin",
    init: () => {
      console.log("Dynamic plugin loaded at runtime");
    },
    endpoints: {
      // Custom endpoints
    },
    middlewares: [
      {
        path: "/api/custom/*",
        middleware: async (ctx: unknown, next: () => Promise<unknown>) => {
          console.log("Dynamic middleware executed");
          return next();
        },
      },
    ],
  };

  await marketing.addPlugin(dynamicPlugin);

  console.log("✅ All runtime plugins added successfully");
  console.log("Loaded plugins:", Array.from(marketing.getPlugins().keys()));
}

// ✅ CORRECT: Remove plugins at runtime
export async function removeRuntimePlugin(pluginId: string) {
  await marketing.removePlugin(pluginId);
  console.log(`Plugin ${pluginId} removed`);
}

// ✅ CORRECT: Check plugin status
export function getPluginInfo() {
  return {
    isInitialized: marketing.isInitialized,
    plugins: Array.from(marketing.getPlugins().keys()),
    pluginCount: marketing.getPlugins().size,
  };
}

// Usage example in your app:
// 1. Initialize your framework (marketing.ts)
// 2. Call addRuntimePlugins() when your app starts
// 3. Use removeRuntimePlugin() to remove plugins dynamically
// 4. Use getPluginInfo() to check status
