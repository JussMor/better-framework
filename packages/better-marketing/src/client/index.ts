/**
 * Better Marketing client-side SDK
 */

export function createMarketingClient(config: {
  baseURL: string;
  apiKey: string;
}) {
  return {
    // TODO: Implement client-side SDK
    track: async (eventName: string, properties?: Record<string, any>) => {
      throw new Error("Client not implemented yet");
    },
    identify: async (userId: string, traits?: Record<string, any>) => {
      throw new Error("Client not implemented yet");
    },
  };
}
