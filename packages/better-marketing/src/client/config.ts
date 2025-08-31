import { createFetch } from "@better-fetch/fetch";
import type { WritableAtom } from "nanostores";
import { atom } from "nanostores";
import { redirectPlugin } from "./fetch-plugins";
import { parseJSON } from "./parser";
import type { AtomListener, ClientOptions } from "./types";

export function getClientConfig(options?: ClientOptions) {
  /* check if the credentials property is supported. Useful for cf workers */
  const isCredentialsSupported = "credentials" in Request.prototype;
  const baseURL = options?.baseURL || "http://localhost:3001/api/marketing";
  const apiKey = options?.apiKey || "";

  const pluginsFetchPlugins =
    options?.plugins
      ?.flatMap((plugin) => plugin.fetchPlugins)
      .filter((pl) => pl !== undefined) || [];

  const lifeCyclePlugin = {
    id: "lifecycle-hooks",
    name: "lifecycle-hooks",
    hooks: {
      onSuccess: options?.fetchOptions?.onSuccess,
      onError: options?.fetchOptions?.onError,
      onRequest: options?.fetchOptions?.onRequest,
      onResponse: options?.fetchOptions?.onResponse,
    },
  };

  const { onSuccess, onError, onRequest, onResponse, ...restOfFetchOptions } =
    options?.fetchOptions || {};

  const $fetch = createFetch({
    baseURL,
    ...(isCredentialsSupported ? { credentials: "include" } : {}),
    method: "GET",
    headers: {
      ...(apiKey && { "x-api-key": apiKey }),
    },
    jsonParser(text) {
      if (!text) {
        return null as any;
      }
      return parseJSON(text, {
        strict: false,
      });
    },
    customFetchImpl: async (input, init) => {
      try {
        return await fetch(input, init);
      } catch (error) {
        return Response.error();
      }
    },
    ...restOfFetchOptions,
    plugins: [
      lifeCyclePlugin,
      ...(restOfFetchOptions.plugins || []),
      ...(options?.disableDefaultFetchPlugins ? [] : [redirectPlugin]),
      ...pluginsFetchPlugins,
    ],
  });

  // TODO: Session functionality not implemented yet - bypassing for now
  // This should be properly implemented when session management is added
  const $sessionSignal = atom(false);
  const session = atom({
    data: null,
    error: null,
    isPending: false,
  });

  const plugins = options?.plugins || [];
  let pluginsActions = {} as Record<string, any>;
  let pluginsAtoms = {
    $sessionSignal,
    session,
  } as Record<string, WritableAtom<any>>;
  let pluginPathMethods: Record<string, "POST" | "GET" | "PUT" | "DELETE"> = {};
  const atomListeners: AtomListener[] = [
    {
      signal: "$sessionSignal",
      matcher(path) {
        return (
          path === "/api/track" ||
          path === "/api/identify" ||
          path.startsWith("/api/auth")
        );
      },
    },
  ];

  for (const plugin of plugins) {
    if (plugin.getAtoms) {
      Object.assign(pluginsAtoms, plugin.getAtoms?.($fetch));
    }
    if (plugin.pathMethods) {
      Object.assign(pluginPathMethods, plugin.pathMethods);
    }
    if (plugin.atomListeners) {
      atomListeners.push(...plugin.atomListeners);
    }
  }

  const $store = {
    notify: (signal?: Omit<string, "$sessionSignal"> | "$sessionSignal") => {
      pluginsAtoms[signal as keyof typeof pluginsAtoms].set(
        !pluginsAtoms[signal as keyof typeof pluginsAtoms].get()
      );
    },
    listen: (
      signal: Omit<string, "$sessionSignal"> | "$sessionSignal",
      listener: (value: boolean, oldValue?: boolean | undefined) => void
    ) => {
      pluginsAtoms[signal as keyof typeof pluginsAtoms].subscribe(listener);
    },
    atoms: pluginsAtoms,
  };

  for (const plugin of plugins) {
    if (plugin.getActions) {
      Object.assign(
        pluginsActions,
        plugin.getActions?.($fetch, $store, options)
      );
    }
  }

  return {
    pluginsActions,
    pluginsAtoms,
    pluginPathMethods,
    atomListeners,
    $fetch,
    $store,
  };
}
