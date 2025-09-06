/**
 * Example of using the framework client with your custom plugin
 * This shows how client-side code can call your custom endpoints with type safety
 */

import { clientMk } from "./marketing-client";

// ✅ CORRECT: Using the framework client to call your custom endpoints
export async function useCustomEndpoints() {
  console.log("Testing custom endpoints via client...");

  try {
    // Call your custom status endpoint (/custom/status -> client.custom.status)
    // TypeScript will infer the return type based on your server plugin
    const statusResult = await clientMk.custom.status();
    console.log("Status from client:", statusResult);

    // Call your custom data creation endpoint (/custom/data -> client.custom.data)
    const createResult = await clientMk.custom.data({
      name: "Client Test Item",
      type: "client-test",
      data: {
        source: "client",
        timestamp: new Date().toISOString(),
      },
      tags: ["client", "test", "framework"],
    });
    console.log("Create result from client:", createResult);

    // Call your custom list endpoint (/custom/data/list -> client.custom.data.list)
    const listResult = await clientMk.custom.data.list({
      page: "1",
      limit: "5",
      type: "client-test",
    });
    console.log("List result from client:", listResult);
  } catch (error) {
    console.error("Error calling custom endpoints:", error);
  }
}

// ✅ Example React component using the client (save as .tsx file to use)
/*
import { useState } from "react";

export function CustomPluginClientDemo() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkPluginStatus = async () => {
    setLoading(true);
    try {
      const result = await clientMk.custom.status();
      setStatus(result);
    } catch (error) {
      console.error("Failed to get status:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Custom Plugin Client Demo</h2>
      <button onClick={checkPluginStatus} disabled={loading}>
        {loading ? "Checking..." : "Check Plugin Status"}
      </button>
      {status && (
        <pre className="bg-gray-100 p-4 rounded">
          {JSON.stringify(status, null, 2)}
        </pre>
      )}
    </div>
  );
}
*/

// Import React hooks if you want to use the component
// import { useState } from "react";

// ✅ Key differences between server and client plugins:

/**
 * SERVER PLUGIN (myCustomPlugin):
 * - Defines actual endpoint implementations
 * - Uses createMarketingEndpoint()
 * - Added to marketing framework at runtime
 * - Runs on the server
 *
 * CLIENT PLUGIN (myCustomClientPlugin):
 * - Provides type information for the client
 * - Uses $InferServerPlugin for type safety
 * - Added to client framework at compile time
 * - Enables type-safe API calls from browser
 */

// ✅ How it works together:
// 1. Server plugin defines endpoints: /api/framework/custom/status
// 2. Client plugin tells TypeScript about these endpoints
// 3. Client can call: clientMk.custom.status() with full type safety
// 4. Framework handles the HTTP request/response automatically
