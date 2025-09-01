import { coreMarketingPlugin } from "better-marketing/client";
import { createMarketingClient } from "better-marketing/client/react";

// Let TypeScript infer the client type instead of hardcoding ReturnType
export const clientMk = createMarketingClient({
  plugins: [coreMarketingPlugin()],
});
