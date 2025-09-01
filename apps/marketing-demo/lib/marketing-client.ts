import { createMarketingClient } from "better-marketing/client/react";
import { campaignsClientPlugin } from "better-marketing/client";

// Let TypeScript infer the client type instead of hardcoding ReturnType
export const clientMk = createMarketingClient({
  plugins: [campaignsClientPlugin()],
});
