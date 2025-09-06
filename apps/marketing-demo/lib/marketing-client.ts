import {
  campaignsClientPlugin,
  createFrameworkClient,
} from "better-framework/client";

// Let TypeScript infer the client type instead of hardcoding ReturnType
export const clientMk = createFrameworkClient({
  plugins: [campaignsClientPlugin()],
});
