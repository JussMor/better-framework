import type {
  BetterFetch,
  BetterFetchOption,
  BetterFetchPlugin,
} from "@better-fetch/fetch";
import type { Atom } from "nanostores";
import { InferFieldsInputClient, InferFieldsOutput } from "../db/field";
import type { Marketing } from "../marketing";
import { BetterMarketingOptions, MarketingUser } from "../types";
import type {
  LiteralString,
  StripEmptyObjects,
  UnionToIntersection,
} from "../types/helper";
import type { InferRoutes } from "./path-to-object";

export interface ClientOptions {
  fetchOptions?: BetterFetchOption;
  disableDefaultFetchPlugins?: boolean;
  basePath?: string;
  baseURL: string;
  apiKey: string;
  plugins?: MarketingClientPlugin[];
  $InferMarketing?: BetterMarketingOptions;
}

export interface MarketingClientPlugin {
  id: LiteralString;
  init?: (fetch: BetterFetch) => void;
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
  pathMethods?: Record<string, "POST" | "GET">;
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
 * Generic client API inference.
 * If plugins provide a `$InferServerPlugin` with `endpoints`, merge them
 * into the inferred API shape. Otherwise, fall back to a minimal default
 * surface so the client remains useful without plugin types.
 */
export type InferClientAPI<O extends ClientOptions> = InferRoutes<
  O["plugins"] extends Array<any>
    ? Marketing["api"] &
        (O["plugins"] extends Array<infer Pl>
          ? UnionToIntersection<
              Pl extends {
                $InferServerPlugin: infer Plug;
              }
                ? Plug extends {
                    endpoints: infer Endpoints;
                  }
                  ? Endpoints
                  : {}
                : {}
            >
          : {})
    : Marketing["api"],
  O
>;

export type InferErrorCodes<O extends ClientOptions> = {};

export type InferActions<O extends ClientOptions> =
  O["plugins"] extends Array<infer Plugin>
    ? UnionToIntersection<
        Plugin extends MarketingClientPlugin
          ? Plugin["getActions"] extends (fetch: any) => infer Actions
            ? Actions
            : {}
          : {}
      >
    : {};

export type SessionQueryParams = {
  disableCookieCache?: boolean;
  disableRefresh?: boolean;
};
