// Example of adding plugins at runtime to Better Framework
import { myCustomPlugin } from "./custom-plugin";
import { marketing } from "./marketing";

// Function to initialize runtime plugins
export async function initializeRuntimePlugins() {
  console.log("Adding runtime plugins...");

  // Add your custom plugin at runtime
  await marketing.addPlugin(myCustomPlugin());

  // You can also add plugins conditionally
  const isDev = process.env.NODE_ENV === "development";
  if (isDev) {
    await marketing.addPlugin({
      id: "dev-only-plugin",
      init: () => {
        console.log("Development plugin loaded");
      },
      endpoints: {
        // Dev-only endpoints
      },
    });
  }

  // Add plugins based on feature flags
  const featureFlags = {
    enableAnalytics: true,
    enableNotifications: false,
  };

  if (featureFlags.enableAnalytics) {
    await marketing.addPlugin({
      id: "analytics-plugin",
      init: () => {
        console.log("Analytics plugin enabled");
      },
      middlewares: [
        {
          path: "/api/*",
          middleware: async (ctx: unknown, next: () => Promise<unknown>) => {
            console.log("Analytics: Request intercepted");
            return next();
          },
        },
      ],
    });
  }

  console.log("Runtime plugins initialized");
  console.log("Loaded plugins:", Array.from(marketing.getPlugins().keys()));
}

// Call this function when your app starts
// For example, in your API route or app initialization
export async function startFrameworkWithPlugins() {
  // Wait for framework to be initialized
  await marketing.getContext();

  // Add runtime plugins
  await initializeRuntimePlugins();

  console.log("Framework ready with all plugins");
  return marketing;
}

// Example: Remove plugin at runtime
export async function removePluginExample() {
  await marketing.removePlugin("my-custom-plugin");
  console.log("Plugin removed");
}

// Example: Check plugin status
export function getPluginStatus() {
  return {
    isInitialized: marketing.isInitialized,
    loadedPlugins: Array.from(marketing.getPlugins().keys()),
    pluginCount: marketing.getPlugins().size,
  };
}
