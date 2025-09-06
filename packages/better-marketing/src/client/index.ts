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
export { createFrameworkClient } from "./react";

// Export React hooks
export { useStore } from "./react";

// Also provide access to the React-specific client
export { createFrameworkClient as createReactFrameworkClient } from "./react";

// Backward compatibility aliases
export {
  createFrameworkClient as createMarketingClient,
  createFrameworkClient as createReactMarketingClient,
} from "./react";
