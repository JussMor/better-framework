import type { BetterFetch, BetterFetchOption } from "@better-fetch/fetch";
import type { Atom, PreinitializedWritableAtom } from "nanostores";
import { isAtom } from "../utils/is-atom";
import type { ProxyRequest } from "./path-to-object";
import type { FrameworkClientPlugin } from "./types";

function getMethod(
  path: string,
  knownPathMethods: Record<string, "POST" | "GET" | "PUT" | "DELETE">,
  args:
    | { fetchOptions?: BetterFetchOption; query?: Record<string, any> }
    | undefined
) {
  const method = knownPathMethods[path];
  const { fetchOptions, query, ...body } = args || {};
  if (method) {
    return method;
  }
  if (fetchOptions?.method) {
    return fetchOptions.method;
  }
  if (body && Object.keys(body).length > 0) {
    return "POST";
  }
  return "GET";
}

export type AuthProxySignal = {
  atom: PreinitializedWritableAtom<boolean>;
  matcher: (path: string) => boolean;
};

// --- Small helpers to keep logic concise ---
function normalizePath(p: string) {
  // Collapse multiple slashes and remove trailing slash
  let out = p;
  while (out.includes("//")) out = out.replace(/\/\//g, "/");
  if (out.length > 1 && out.endsWith("/")) out = out.slice(0, -1);
  return out;
}

function routeBase(route: string) {
  return normalizePath(route.replace(/:[\w]+/g, ""));
}

function staticSegments(path: string) {
  return normalizePath(path)
    .split("/")
    .filter(Boolean)
    .filter((seg) => !seg.startsWith(":"));
}

function findActualRoutePath(
  basePath: string,
  known: Record<string, "POST" | "GET" | "PUT" | "DELETE">,
  arg?: any
) {
  const baseNorm = normalizePath(basePath);
  const match = Object.keys(known).find(
    (route) => routeBase(route) === baseNorm
  );
  if (match) return match;

  // Fallback: try matching by first and last static segments
  const baseStatics = staticSegments(baseNorm);
  if (baseStatics.length >= 2) {
    const [first, last] = [baseStatics[0], baseStatics[baseStatics.length - 1]];
    const candidates = Object.keys(known).filter((route) => {
      const segs = staticSegments(route);
      if (segs.length < 2) return false;
      return segs[0] === first && segs[segs.length - 1] === last;
    });
    if (candidates.length > 0) {
      // If args provided, prefer route whose param names best match provided keys
      const provided = new Set(Object.keys((arg?.params as any) || arg || {}));
      const score = (route: string) => {
        const names = Array.from(route.matchAll(/:([\w]+)/g)).map((m) => m[1]);
        const matchCount = names.filter((n) => provided.has(n)).length;
        return { names, matchCount };
      };
      const ranked = candidates
        .map((r) => ({ r, ...score(r) }))
        .sort((a, b) => {
          if (b.matchCount !== a.matchCount) return b.matchCount - a.matchCount;
          // If equal match count, prefer fewer required params when provided is smaller
          if (a.matchCount === provided.size) {
            // prefer exact match on param count
            const diff =
              Math.abs(a.names.length - a.matchCount) -
              Math.abs(b.names.length - b.matchCount);
            if (diff !== 0) return diff;
          }
          // As a final tie-breaker, prefer route with more static specificity (more static segments)
          return staticSegments(b.r).length - staticSegments(a.r).length;
        });
      return ranked[0].r;
    }
  }

  return basePath;
}

export function createDynamicPathProxy<T extends Record<string, any>>(
  routes: T,
  client: BetterFetch,
  knownPathMethods: Record<string, "POST" | "GET" | "PUT" | "DELETE">,
  atoms: Record<string, Atom>,
  atomListeners: FrameworkClientPlugin["atomListeners"]
): T {
  function createProxy(path: string[] = []): any {
    return new Proxy(function () {}, {
      get(target, prop: string) {
        if (prop === "then" || prop === "catch" || prop === "finally") {
          return undefined;
        }
        const fullPath = [...path, prop];
        let current: any = routes;
        for (const segment of fullPath) {
          if (current && typeof current === "object" && segment in current) {
            current = current[segment];
          } else {
            current = undefined;
            break;
          }
        }
        if (typeof current === "function") {
          return current;
        }
        if (isAtom(current)) {
          return current;
        }
        return createProxy(fullPath);
      },
      apply: async (_, __, args) => {
        const basePath =
          "/" +
          path
            .map((segment) =>
              segment.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
            )
            .join("/");

        const arg = (args[0] || {}) as ProxyRequest;
        const fetchOptions = (args[1] || {}) as BetterFetchOption;
        // Resolve the actual route path, supporting routes with params like /x/:id/y
        const actualRoutePath = findActualRoutePath(
          basePath,
          knownPathMethods,
          arg
        );
        const {
          query,
          fetchOptions: argFetchOptions,
          params: explicitParams,
          ...rawBody
        } = arg as any;

        // Derive route params from either explicit `params` or top-level fields matching token names
        const paramNames = Array.from(
          actualRoutePath.matchAll(/:([\w]+)/g)
        ).map((m) => m[1]);
        const inferredParams = Object.fromEntries(
          paramNames
            .map((name) => [name, (arg as any)[name]])
            .filter(([, v]) => v !== undefined)
        ) as Record<string, any>;
        const resolvedParams =
          (explicitParams as Record<string, any>) ?? inferredParams;

        // Remove params keys from body payload so they don't get sent as body
        const body = { ...rawBody } as Record<string, any>;
        for (const p of paramNames) {
          if (p in body) delete body[p];
        }

        const options = {
          ...fetchOptions,
          ...argFetchOptions,
          ...(Object.keys(resolvedParams || {}).length > 0
            ? { params: resolvedParams }
            : {}),
        } as BetterFetchOption;

        const method = getMethod(actualRoutePath, knownPathMethods, arg);
        return await client(actualRoutePath, {
          ...options,
          body:
            method === "GET"
              ? undefined
              : {
                  ...body,
                  ...(options?.body || {}),
                },
          query: query || options?.query,
          method,
          async onSuccess(context) {
            await options?.onSuccess?.(context);
            /**
             * We trigger listeners
             */
            const matches = atomListeners?.find((s) =>
              s.matcher(actualRoutePath)
            );
            if (!matches) return;
            const signal = atoms[matches.signal as any];
            if (!signal) return;
            /**
             * To avoid race conditions we set the signal in a setTimeout
             */
            const val = signal.get();
            setTimeout(() => {
              //@ts-expect-error
              signal.set(!val);
            }, 10);
          },
        });
      },
    });
  }
  return createProxy() as T;
}
