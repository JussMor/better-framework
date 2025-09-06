import { MarketingClientPlugin } from "better-marketing/client";
import type { notificationsPlugin } from "./notifications-plugin";

type ServerPluginReturn = ReturnType<typeof notificationsPlugin>;

/**
 * Client notifications plugin: exposes server plugin shape for $InferServerPlugin so
 * notification endpoints & schema-derived types can be accessed in client generics.
 *
 * This enables full type safety when using the notifications plugin from the client.
 */
export const notificationsClientPlugin = () =>
  ({
    id: "notifications",
    $InferServerPlugin: {} as ServerPluginReturn,
    // Optionally specify HTTP methods for endpoints if needed
    pathMethods: {
      "/notification/create": "POST",
      "/notification/get/:id": "GET",
      "/notification/user/:userId": "GET",
      "/notification/mark-read/:id": "PUT",
      "/notification/delete/:id": "DELETE",
    },
  }) satisfies MarketingClientPlugin;

export type NotificationsClientPlugin = ReturnType<
  typeof notificationsClientPlugin
>;
