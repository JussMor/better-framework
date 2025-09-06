import type { PrettifyDeep, UnionToIntersection } from "../../types/helper";
import { getClientConfig } from "../config";
import { createDynamicPathProxy } from "../proxy";
import type {
  ClientOptions,
  InferActions,
  InferClientAPI,
  InferErrorCodes,
  IsSignal,
  FrameworkClientPlugin,
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
    ? Plugin extends FrameworkClientPlugin
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

// Force all first-level properties to be required so TS doesn't treat them as possibly undefined
type RequireTopLevel<T> = T extends object ? { [K in keyof T]-?: T[K] } : T;

/**
 * Creates a framework client with React hooks integration
 * Ensures both internal endpoints and plugin endpoints are properly typed and accessible
 */
export function createFrameworkClient<Option extends ClientOptions>(
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

  // Resolve hooks from plugins
  let resolvedHooks: Record<string, any> = {};
  for (const [key, value] of Object.entries(pluginsAtoms)) {
    resolvedHooks[getAtomKey(key)] = () => useStore(value);
  }

  // Combine plugin actions with resolved hooks and core utilities
  const routes = {
    ...pluginsActions,
    ...resolvedHooks,
    $fetch,
    $store,
  };

  // Create dynamic proxy that handles both internal and plugin endpoint paths
  const proxy = createDynamicPathProxy(
    routes,
    $fetch,
    pluginPathMethods,
    pluginsAtoms,
    atomListeners
  );

  type ClientAPI = InferClientAPI<Option>;

  // Return properly typed client with both internal and plugin endpoints
  return proxy as RequireTopLevel<
    UnionToIntersection<InferResolvedHooks<Option>> &
      ClientAPI &
      InferActions<Option>
  > & {
    $fetch: typeof $fetch;
    $store: typeof $store;
    $ERROR_CODES: PrettifyDeep<InferErrorCodes<Option>>;
  };
}

export type * from "@better-fetch/fetch";
export type * from "nanostores";
export { useStore };
