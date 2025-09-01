import type { campaignsPlugin } from "../../plugins/campaigns";
import { MarketingClientPlugin } from "../types";

type ServerPluginReturn = ReturnType<typeof campaignsPlugin>;

// Client campaigns plugin: exposes server plugin shape for $InferServerPlugin so
// campaign endpoints & schema-derived types can be accessed in client generics.
export const campaignsClientPlugin = () =>
  ({
    id: "campaigns",
    $InferServerPlugin: {} as ServerPluginReturn,
  }) satisfies MarketingClientPlugin;
