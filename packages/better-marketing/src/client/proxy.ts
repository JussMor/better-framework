import type { BetterFetch } from "@better-fetch/fetch";
import type { Atom } from "nanostores";
import type { AtomListener } from "./types";

export function createDynamicPathProxy(
  routes: Record<string, any>,
  fetch: BetterFetch,
  pathMethods: Record<string, any>,
  atoms: Record<string, Atom<any>>,
  atomListeners: Record<string, AtomListener>
) {
  const handler = {
    get: function (target: Record<string, any>, prop: string) {
      if (prop in target) {
        return target[prop];
      }

      if (prop in pathMethods) {
        return new Proxy(
          {},
          {
            get: function (_: any, methodName: string) {
              return pathMethods[prop][methodName];
            },
          }
        );
      }

      return undefined;
    },
  };

  return new Proxy(routes, handler);
}
