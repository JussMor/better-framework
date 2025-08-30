import type { BetterFetchError } from "@better-fetch/fetch";
import type { Atom } from "nanostores";
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

    // Core marketing client methods
    track: async (eventName: string, properties?: Record<string, any>) => {
      return $fetch("/api/track", {
        method: "POST",
        body: {
          eventName,
          properties,
        },
      });
    },

    identify: async (userId: string, traits?: Record<string, any>) => {
      return $fetch("/api/identify", {
        method: "POST",
        body: {
          userId,
          traits,
        },
      });
    },

    // Authentication methods mirroring better-auth
    signUp: {
      email: async (
        data: {
          email: string;
          password: string;
          name?: string;
          image?: string;
          callbackURL?: string;
        },
        callbacks?: {
          onRequest?: (ctx: any) => void;
          onSuccess?: (ctx: any) => void;
          onError?: (ctx: { error: { message: string } }) => void;
        }
      ) => {
        try {
          if (callbacks?.onRequest) {
            callbacks.onRequest({});
          }

          const response = await $fetch("/api/auth/signup", {
            method: "POST",
            body: data,
          });

          if (callbacks?.onSuccess) {
            callbacks.onSuccess({ data: response.data });
          }

          return response;
        } catch (error: any) {
          if (callbacks?.onError) {
            callbacks.onError({
              error: { message: error.message || "Sign up failed" },
            });
          }

          return {
            data: null,
            error: error,
          };
        }
      },
    },
  };

  const proxy = createDynamicPathProxy(
    routes,
    $fetch,
    pluginPathMethods,
    pluginsAtoms,
    atomListeners
  );

  type ClientAPI = InferClientAPI<Option>;
  type UserData = { id: string; email: string; name?: string };

  return proxy as UnionToIntersection<InferResolvedHooks<Option>> &
    ClientAPI &
    InferActions<Option> & {
      useSession: Atom<{
        data: UserData | null;
        error: BetterFetchError | null;
        isPending: boolean;
      }>;
      $fetch: typeof $fetch;
      $store: typeof $store;
      $ERROR_CODES: PrettifyDeep<InferErrorCodes<Option>>;
    };
}

export function capitalizeFirstLetter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
