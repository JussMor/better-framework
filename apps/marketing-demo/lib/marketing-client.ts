import { campaignsClientPlugin } from "better-marketing/client";
import { createMarketingClient } from "better-marketing/client/react";
import { notificationsClientPlugin } from "./plugins";

// Let TypeScript infer the client type instead of hardcoding ReturnType
export const clientMk = createMarketingClient({
  plugins: [campaignsClientPlugin(), notificationsClientPlugin()],
});

clientMk.user.create({
  email: "user@example.com",
  firstName: "John",
  lastName: "Doe",
  // add phone or properties here if needed, e.g.:
  // phone: "+12223334444",
  // properties: { plan: "demo" },
});
