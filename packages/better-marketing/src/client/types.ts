import type {
  BetterFetch,
  BetterFetchOption,
  BetterFetchPlugin,
} from "@better-fetch/fetch";
import type { Atom } from "nanostores";
import { InferFieldsInputClient, InferFieldsOutput } from "../db/field";
import { BetterMarketingOptions, MarketingUser } from "../types";
import type {
  LiteralString,
  StripEmptyObjects,
  UnionToIntersection,
} from "../types/helper";

export interface ClientOptions {
  fetchOptions?: BetterFetchOption;
  disableDefaultFetchPlugins?: boolean;
  disableCorePlugin?: boolean;
  basePath?: string;
  baseURL?: string;
  apiKey?: string;
  plugins?: MarketingClientPlugin[];
  $InferMarketing?: BetterMarketingOptions;
}

export interface MarketingClientPlugin {
  id: LiteralString;
  /**
   * only used for type inference. don't pass the
   * actual plugin
   */
  $InferServerPlugin?: any;
  /**
   * Custom actions
   */
  getActions?: (
    $fetch: BetterFetch,
    $store: Store,
    /**
     * client options
     */
    options: ClientOptions | undefined
  ) => Record<string, any>;
  /**
   * State atoms that'll be resolved by each framework
   * client store.
   */
  getAtoms?: ($fetch: BetterFetch) => Record<string, Atom<any>>;
  /**
   * specify path methods for server plugin inferred
   * endpoints to force a specific method.
   */
  pathMethods?: Record<string, "POST" | "GET" | "PUT" | "DELETE">;
  /**
   * Better fetch plugins
   */
  fetchPlugins?: BetterFetchPlugin[];
  /**
   * a list of recaller based on a matcher function.
   * The signal name needs to match a signal in this
   * plugin or any plugin the user might have added.
   */
  atomListeners?: AtomListener[];
}

export interface Store {
  notify: (signal: string) => void;
  listen: (signal: string, listener: () => void) => void;
  atoms: Record<string, Atom<any>>;
}

export interface AtomListener {
  matcher: (path: string) => boolean;
  signal: "$sessionSignal" | Omit<string, "$sessionSignal">;
}

export type IsSignal<T> = T extends `$${string}` ? true : false;

export type InferSessionFromClient<O extends ClientOptions> = StripEmptyObjects<
  UnionToIntersection<InferAdditionalFromClient<O, "session", "output">>
>;
export type InferUserFromClient<O extends ClientOptions> = StripEmptyObjects<
  MarketingUser &
    UnionToIntersection<InferAdditionalFromClient<O, "user", "output">>
>;

export type InferPluginsFromClient<O extends ClientOptions> =
  O["plugins"] extends Array<MarketingClientPlugin>
    ? Array<O["plugins"][number]["$InferServerPlugin"]>
    : undefined;

export type InferAdditionalFromClient<
  Options extends ClientOptions,
  Key extends string,
  Format extends "input" | "output" = "output",
> =
  Options["plugins"] extends Array<infer T>
    ? T extends MarketingClientPlugin
      ? T["$InferServerPlugin"] extends {
          schema: {
            [key in Key]: {
              fields: infer Field;
            };
          };
        }
        ? Format extends "input"
          ? InferFieldsInputClient<Field>
          : InferFieldsOutput<Field>
        : {}
      : {}
    : {};

/**
 * Core marketing client API structure - directly mirrors server API
 */
export interface MarketingClientAPI {
  api: {
    user: {
      create: (data: {
        email: string;
        firstName?: string;
        lastName?: string;
        phone?: string;
        properties?: Record<string, any>;
      }) => Promise<{ user: any }>;
      get: (id: string) => Promise<{ user: any }>;
      update: (
        id: string,
        data: {
          email?: string;
          firstName?: string;
          lastName?: string;
          phone?: string;
          properties?: Record<string, any>;
        }
      ) => Promise<{ user: any }>;
      delete: (id: string) => Promise<{ success: boolean }>;
    };
    campaign: {
      create: (data: {
        name: string;
        type: "email" | "sms";
        subject?: string;
        content: string;
      }) => Promise<{ campaign: any }>;
      get: (id: string) => Promise<{ campaign: any }>;
      update: (
        id: string,
        data: {
          name?: string;
          type?: "email" | "sms";
          subject?: string;
          content?: string;
        }
      ) => Promise<{ campaign: any }>;
      delete: (id: string) => Promise<{ success: boolean }>;
    };
    email: {
      send: (data: {
        to: string;
        from: string;
        subject: string;
        html?: string;
        text?: string;
      }) => Promise<{ success: boolean; messageId?: string }>;
      sendBulk: (data: {
        emails: Array<{
          to: string;
          subject: string;
          html?: string;
          text?: string;
        }>;
        from: string;
      }) => Promise<{ success: boolean; results: any[] }>;
    };
    track: (data: {
      userId: string;
      eventName: string;
      properties?: Record<string, any>;
    }) => Promise<{ success: boolean; eventId: string }>;
    getAnalytics: (params?: any) => Promise<any>;
  };
}

/**
 * Generic client API inference.
 */
export type InferClientAPI<O extends ClientOptions> = MarketingClientAPI;

export type InferErrorCodes<O extends ClientOptions> = {};

export type InferActions<O extends ClientOptions> =
  // Include the default marketing plugin actions
  {
    api: {
      user: {
        create: (data: any) => any;
        get: (id: string) => any;
        update: (id: string, data: any) => any;
        delete: (id: string) => any;
      };
      campaign: {
        create: (data: any) => any;
        get: (id: string) => any;
        update: (id: string, data: any) => any;
        delete: (id: string) => any;
      };
      email: {
        send: (data: any) => any;
        sendBulk: (data: any) => any;
      };
      track: (data: any) => any;
      getAnalytics: (params: any) => any;
    };
  } & (O["plugins"] extends Array<infer Plugin>
    ? UnionToIntersection<
        Plugin extends MarketingClientPlugin
          ? Plugin["getActions"] extends (fetch: any) => infer Actions
            ? Actions
            : {}
          : {}
      >
    : {});

export type SessionQueryParams = {
  disableCookieCache?: boolean;
  disableRefresh?: boolean;
};
