import type { BetterFetch, BetterFetchResponse } from "@better-fetch/fetch";

export interface ClientOptions {
  baseURL: string;
  apiKey: string;
  plugins?: MarketingClientPlugin[];
}

export interface MarketingClientPlugin {
  id: string;
  init?: (fetch: BetterFetch) => void;
  getActions?: (fetch: BetterFetch) => Record<string, any>;
  getAtoms?: (fetch: BetterFetch) => Record<string, any>;
  getPathMethods?: (fetch: BetterFetch) => Record<string, any>;
  getAtomListeners?: (fetch: BetterFetch) => Record<string, AtomListener>;
}

export interface AtomListener {
  path: string;
  atomKey: string;
  transformData?: (data: any) => any;
  transformError?: (error: any) => any;
  query?: Record<string, any>;
}

export type IsSignal<T> = T extends `$${string}` ? true : false;

export type InferClientAPI<O extends ClientOptions> = {
  track: (
    eventName: string,
    properties?: Record<string, any>
  ) => Promise<BetterFetchResponse<any>>;
  identify: (
    userId: string,
    traits?: Record<string, any>
  ) => Promise<BetterFetchResponse<any>>;
};

export type InferErrorCodes<O extends ClientOptions> = {};

export type InferActions<O extends ClientOptions> =
  O["plugins"] extends Array<infer Plugin>
    ? Plugin extends MarketingClientPlugin
      ? Plugin["getActions"] extends (fetch: any) => infer Actions
        ? Actions
        : {}
      : {}
    : {};
