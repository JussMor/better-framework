/**
 * Better Marketing client-side SDK
 */

export * from "./types";

/**
 * Better Marketing client-side SDK
 */

export * from "./plugins";
export * from "./types";

// Export React client as the main client
export { createMarketingClient } from "./react";

// Export React hooks
export { useStore } from "./react";

// Also provide access to the React-specific client
export { createMarketingClient as createReactMarketingClient } from "./react";
