/**
 * Better Marketing client-side SDK
 */

export * from "./types";
export * from "./vanilla";

// Export createMarketingClient as the default client
export { createMarketingClient } from "./vanilla";

// Also provide access to the React-specific client
export { createAuthClient as createReactAuthClient } from "./react";
