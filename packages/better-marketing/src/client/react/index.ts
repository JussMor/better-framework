import type { PrettifyDeep, UnionToIntersection } from "../../types/helper";
import { getClientConfig } from "../config";
import { createDynamicPathProxy } from "../proxy";
import type {
  ClientOptions,
  InferActions,
  InferClientAPI,
  InferErrorCodes,
  IsSignal,
  MarketingClientPlugin,
} from "../types";
import { useStore } from "./react-store";

function getAtomKey(str: string) {
  return `use${capitalizeFirstLetter(str)}`;
}

export function capitalizeFirstLetter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

type InferResolvedHooks<O extends ClientOptions> =
  O["plugins"] extends Array<infer Plugin>
    ? Plugin extends MarketingClientPlugin
      ? Plugin["getAtoms"] extends (fetch: any) => infer Atoms
        ? Atoms extends Record<string, any>
          ? {
              [key in keyof Atoms as IsSignal<key> extends true
                ? never
                : key extends string
                  ? `use${Capitalize<key>}`
                  : never]: () => ReturnType<Atoms[key]["get"]>;
            }
          : {}
        : {}
      : {}
    : {};

/**
 * Creates a marketing client with React hooks integration
 */
export function createMarketingClient<Option extends ClientOptions>(
  options?: Option
) {
  const {
    pluginPathMethods,
    pluginsActions,
    pluginsAtoms,
    $fetch,
    $store,
    atomListeners,
  } = getClientConfig(options);

  let resolvedHooks: Record<string, any> = {};
  for (const [key, value] of Object.entries(pluginsAtoms)) {
    resolvedHooks[getAtomKey(key)] = () => useStore(value);
  }

  const routes = {
    ...pluginsActions,
    ...resolvedHooks,
    $fetch,
    $store,
  };

  const proxy = createDynamicPathProxy(
    routes,
    $fetch,
    pluginPathMethods,
    pluginsAtoms,
    atomListeners
  );

  type ClientAPI = InferClientAPI<Option>;

  return proxy as UnionToIntersection<InferResolvedHooks<Option>> &
    ClientAPI &
    InferActions<Option> & {
      $fetch: typeof $fetch;
      $store: typeof $store;
      $ERROR_CODES: PrettifyDeep<InferErrorCodes<Option>>;
    };
}

export type * from "@better-fetch/fetch";
export type * from "nanostores";
export { useStore };
