import { createFrameworkClient } from "better-framework/client/react";
import { notificationsClientPlugin } from "./plugins";

// Let TypeScript infer the client type instead of hardcoding ReturnType
export const clientMk = createFrameworkClient({
  plugins: [notificationsClientPlugin()],
});
