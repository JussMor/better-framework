import {
  campaignsClientPlugin,
  createFrameworkClient,
} from "better-framework/client";
import { testClientPlugin } from "./test-plugin";

// Let TypeScript infer the client type instead of hardcoding ReturnType
// Custom plugin should expose: client.custom.status, client.custom.data, client.custom.data.list
export const clientMk = createFrameworkClient({
  plugins: [campaignsClientPlugin(),  testClientPlugin()],
});

