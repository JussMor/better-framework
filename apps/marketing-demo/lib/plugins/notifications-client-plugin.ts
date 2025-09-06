import { FrameworkClientPlugin } from "better-framework/client";
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
    // Provide route->method mapping so the client proxy can resolve
    // parameterized routes (e.g., /notification/get/:id) and use
    // the correct HTTP verb.
    pathMethods: {
      "/notification/create": "POST",
      "/notification/get/:id": "GET",
      "/notification/user/:userId": "GET",
      "/notification/mark-read/:id": "PUT",
      "/notification/delete/:id": "DELETE",
    },
    $InferServerPlugin: {} as ServerPluginReturn,
  }) satisfies FrameworkClientPlugin;

export type NotificationsClientPlugin = ReturnType<
  typeof notificationsClientPlugin
>;
