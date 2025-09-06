/**
 * TypeScript diagnostic helper to debug client plugin inference
 * This file helps identify why the custom plugin endpoints aren't being recognized
 */

import { myCustomClientPlugin, myCustomPlugin } from "./custom-plugin";
import { clientMk } from "./marketing-client";

// Let's create some type tests to see what's happening

// 1. Test server plugin type
type ServerPlugin = ReturnType<typeof myCustomPlugin>;

// 2. Test client plugin type
type ClientPlugin = ReturnType<typeof myCustomClientPlugin>;

// 3. Test what the client plugin infers from server plugin
type InferredFromServer = ClientPlugin["$InferServerPlugin"];

// 4. Test if the endpoints are properly typed
type ServerEndpoints = ServerPlugin["endpoints"];

// 5. Test individual endpoint types
type StatusEndpoint = ServerEndpoints extends { status: infer T } ? T : never;
type CreateDataEndpoint = ServerEndpoints extends { createData: infer T }
  ? T
  : never;
type ListDataEndpoint = ServerEndpoints extends { listData: infer T }
  ? T
  : never;

// 6. Test the client type
type ClientType = typeof clientMk;

// 7. Check if custom property exists (this should error if it doesn't exist)
type CustomProperty = ClientType["custom"];

// 8. Export types for inspection in IDE
export type DebugTypes = {
  ServerPlugin: ServerPlugin;
  ClientPlugin: ClientPlugin;
  InferredFromServer: InferredFromServer;
  ServerEndpoints: ServerEndpoints;
  StatusEndpoint: StatusEndpoint;
  CreateDataEndpoint: CreateDataEndpoint;
  ListDataEndpoint: ListDataEndpoint;
  ClientType: ClientType;
  CustomProperty: CustomProperty;
};

// 9. Runtime diagnostic
export function diagnosePlugin() {
  console.log("🔍 Plugin Diagnostic:");

  // Check server plugin structure
  const serverPlugin = myCustomPlugin();
  console.log("Server plugin ID:", serverPlugin.id);
  console.log(
    "Server plugin endpoints:",
    Object.keys(serverPlugin.endpoints || {})
  );

  // Check client plugin structure
  const clientPlugin = myCustomClientPlugin();
  console.log("Client plugin ID:", clientPlugin.id);
  console.log(
    "Client plugin has $InferServerPlugin:",
    !!clientPlugin.$InferServerPlugin
  );

  // Check client structure
  console.log("Client keys:", Object.keys(clientMk));
  console.log("Client has custom property:", "custom" in clientMk);

  // Try to access each expected endpoint
  try {
    // @ts-expect-error - We're testing if this exists
    console.log("client.custom exists:", typeof clientMk.custom);
  } catch (e) {
    console.log("client.custom access failed:", e);
  }

  try {
    // @ts-expect-error - We're testing if this exists
    console.log("client.custom.status exists:", typeof clientMk.custom?.status);
  } catch (e) {
    console.log("client.custom.status access failed:", e);
  }

  return {
    serverPlugin,
    clientPlugin,
    clientKeys: Object.keys(clientMk),
    hasCustomProperty: "custom" in clientMk,
  };
}
