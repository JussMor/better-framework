import type { Endpoint } from "better-call";
import type { PrettifyDeep, UnionToIntersection } from "../types/helper";

// Helper to extract keys that are considered "actions" (isAction !== false)
type ActionKeys<API> = {
  [K in keyof API]: API[K] extends Endpoint
    ? API[K] extends { options: { metadata: { isAction: false } } }
      ? never // explicitly not an action
      : K // treat unknown / true / missing as action so we don't accidentally drop endpoints
    : never;
}[keyof API];

export type FilteredAPI<API> = Pick<API, ActionKeys<API>>; // kept for potential future use

export type InferSessionAPI<API> = API extends {
  [key: string]: infer E;
}
  ? UnionToIntersection<
      E extends Endpoint
        ? E["path"] extends "/get-session"
          ? {
              getSession: <R extends boolean>(context: {
                headers: Headers;
                query?: {
                  disableCookieCache?: boolean;
                  disableRefresh?: boolean;
                };
                asResponse?: R;
              }) => false extends R
                ? Promise<PrettifyDeep<Awaited<ReturnType<E>>>> & {
                    options: E["options"];
                    path: E["path"];
                  }
                : Promise<Response>;
            }
          : never
        : never
    >
  : never;

// For now keep API shape intact (filtering handled separately when required)
export type InferAPI<API> = API;
