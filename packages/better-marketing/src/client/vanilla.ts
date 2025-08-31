import type { PrettifyDeep, UnionToIntersection } from "../types/helper";
import { getClientConfig } from "./config";
import { createDynamicPathProxy } from "./proxy";
import type {
  ClientOptions,
  InferActions,
  InferClientAPI,
  InferErrorCodes,
  IsSignal,
  MarketingClientPlugin,
} from "./types";

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
                  : never]: Atoms[key];
            }
          : {}
        : {}
      : {}
    : {};

/**
 * Creates a marketing client for client-side usage
 */
export function createMarketingClient<Option extends ClientOptions>(
  options?: Option
) {
  const {
    pluginPathMethods,
    pluginsActions,
    pluginsAtoms,
    $fetch,
    atomListeners,
    $store,
  } = getClientConfig(options);

  let resolvedHooks: Record<string, any> = {};
  for (const [key, value] of Object.entries(pluginsAtoms)) {
    resolvedHooks[`use${capitalizeFirstLetter(key)}`] = value;
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
      // TODO: Session functionality not implemented yet - bypassing for now
      // This should be inferred from plugins once session management is implemented
      $fetch: typeof $fetch;
      $store: typeof $store;
      $ERROR_CODES: PrettifyDeep<InferErrorCodes<Option>>;
    };
}

export function capitalizeFirstLetter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
