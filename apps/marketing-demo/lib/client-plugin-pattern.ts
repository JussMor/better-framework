/**
 * CLIENT PLUGIN PATTERN SUMMARY
 * How to properly add custom plugins to the Better Framework client
 */

/*
// ✅ STEP 1: Create server plugin with endpoints (custom-plugin.ts)
export function myCustomPlugin(): BetterFrameworkPlugin {
  return {
    id: "my-custom-plugin",
    endpoints: {
      "/custom/status": getStatus(),
      "/custom/data": createCustomData(),
      // ... other endpoints
    },
  };
}

// ✅ STEP 2: Create client plugin that references the server plugin (custom-plugin.ts)
export function myCustomClientPlugin() {
  return {
    id: "my-custom-plugin",
    $InferServerPlugin: {} as ReturnType<typeof myCustomPlugin>,
  };
}

// ✅ STEP 3: Add server plugin at RUNTIME (marketing.ts)
export const marketing = betterFramework({
  plugins: [campaignsPlugin()], // Built-in plugins only
});
marketing.addPlugin(myCustomPlugin()); // Add custom plugin at runtime

// ✅ STEP 4: Add client plugin at COMPILE TIME (marketing-client.ts)
export const clientMk = createFrameworkClient({
  plugins: [
    campaignsClientPlugin(),
    myCustomClientPlugin(), // ← Client version of your plugin
  ],
});

// ✅ STEP 5: Use type-safe client calls
await clientMk.custom.status();
await clientMk.custom.data({ name: "test", type: "example" });
await clientMk.custom.data.list({ page: "1", limit: "10" });
*/

/**
 * KEY DIFFERENCES:
 *
 * SERVER PLUGIN:
 * - Contains actual endpoint implementations
 * - Uses createMarketingEndpoint()
 * - Added to marketing framework at RUNTIME
 * - Executes on the server
 *
 * CLIENT PLUGIN:
 * - Contains type information only
 * - Uses $InferServerPlugin for type inference
 * - Added to client framework at COMPILE TIME
 * - Provides TypeScript autocomplete and type safety
 *
 * RESULT:
 * - Full type safety between client and server
 * - Automatic HTTP request/response handling
 * - IntelliSense for your custom endpoints
 * - Runtime error checking
 */
