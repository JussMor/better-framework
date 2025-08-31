import type { PrettifyDeep, UnionToIntersection } from "../../types/helper";
import { getClientConfig } from "../config";
import { coreMarketingPlugin } from "../plugins";
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
  // Include core marketing plugin by default unless disabled
  const plugins = options?.disableCorePlugin
    ? options?.plugins || []
    : [coreMarketingPlugin(), ...(options?.plugins || [])];

  const configOptions = {
    ...options,
    plugins,
  };

  const {
    pluginPathMethods,
    pluginsActions,
    pluginsAtoms,
    $fetch,
    $store,
    atomListeners,
  } = getClientConfig(configOptions);

  let resolvedHooks: Record<string, any> = {};
  for (const [key, value] of Object.entries(pluginsAtoms)) {
    resolvedHooks[`use${capitalizeFirstLetter(key)}`] = () => useStore(value);
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
    Object.values(atomListeners)
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
