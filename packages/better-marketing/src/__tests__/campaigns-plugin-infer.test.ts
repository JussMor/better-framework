// Compile-time style test to assert campaigns plugin endpoints are exposed on client API
// This is not executed at runtime (no assertions); it's used for TypeScript inference safety.

import { campaignsClientPlugin } from "../client/plugins/campaings-plugin";
import { createMarketingClient } from "../client/react";

// Instantiate client with campaigns plugin
const client = createMarketingClient({
  plugins: [campaignsClientPlugin()],
});

// Should have nested path-based API: client.campaign.create / get / update / delete / list
// (Path-to-object transformer maps "/campaign/create" => client.campaign.create)
// Basic usage examples (no runtime execution during tests):
// @ts-expect-error ensure unknown action is rejected
client.campaign.publish;

// Expected existing endpoints (will error if missing types)
client.campaign.create({ name: "My Campaign" });
client.campaign.list();

// Params variant; we provide fetchOptions param with params object referencing path param id.
// NOTE: Path params (":id") currently exposed as nested property key but dynamic replacement
// is not yet implemented in the proxy, so we don't invoke it here.
