import { createFetch } from "@better-fetch/fetch";
import type { Atom } from "nanostores";
import { atom } from "nanostores";
import type { AtomListener, ClientOptions } from "./types";

export function getClientConfig(
  options: ClientOptions = { baseURL: "", apiKey: "" }
) {
  const baseURL = options.baseURL || "";
  const apiKey = options.apiKey || "";

  const plugins = options.plugins || [];

  const $fetch = createFetch({
    baseURL,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
  });

  // Plugin initialization and setup
  let pluginsActions: Record<string, any> = {};
  let pluginsAtoms: Record<string, Atom<any>> = {};
  let pluginPathMethods: Record<string, any> = {};
  let atomListeners: Record<string, AtomListener> = {};
  let $store: Record<string, any> = {};

  // Initialize session atom
  const session = atom({
    data: null,
    error: null,
    isPending: false,
  });

  pluginsAtoms["session"] = session;
  $store = { session };

  // Initialize plugins
  for (const plugin of plugins) {
    if (plugin.init) {
      plugin.init($fetch);
    }

    if (plugin.getActions) {
      const actions = plugin.getActions($fetch);
      pluginsActions = { ...pluginsActions, ...actions };
    }

    if (plugin.getAtoms) {
      const atoms = plugin.getAtoms($fetch);
      pluginsAtoms = { ...pluginsAtoms, ...atoms };
      $store = { ...$store, ...atoms };
    }

    if (plugin.getPathMethods) {
      const pathMethods = plugin.getPathMethods($fetch);
      pluginPathMethods = { ...pluginPathMethods, ...pathMethods };
    }

    if (plugin.getAtomListeners) {
      const listeners = plugin.getAtomListeners($fetch);
      atomListeners = { ...atomListeners, ...listeners };
    }
  }

  return {
    pluginPathMethods,
    pluginsActions,
    pluginsAtoms,
    $fetch,
    $store,
    atomListeners,
  };
}
