import type { Endpoint } from "better-call";
import type { PrettifyDeep, UnionToIntersection } from "./helper";

// Helper to extract keys that are considered "actions" (isAction !== false)
type ActionKeys<API> = {
  [K in keyof API]: API[K] extends Endpoint
    ? API[K] extends { options: { metadata: { isAction: false } } }
      ? never // explicitly not an action
      : K // treat unknown / true / missing as action so we don't accidentally drop endpoints
    : never;
}[keyof API];

export type FilteredAPI<API> = Pick<API, ActionKeys<API>>; // kept for potential future use

/**
 * Filters out endpoints that have metadata.isAction = false
 * This ensures only callable endpoints are exposed in the API type
 * Follows the same pattern as Better Auth for consistent type inference
 */
export type FilterActions<API> = Omit<
  API,
  API extends { [key in infer K]: Endpoint }
    ? K extends string
      ? API[K]["options"]["metadata"] extends { isAction: false }
        ? K
        : never
      : never
    : never
>;

/**
 * Infers special session-like API endpoints with enhanced typing
 * Similar to Better Auth's InferSessionAPI pattern
 * Only applies if the endpoints actually exist
 */
export type InferSessionAPI<API> = API extends {
  [key: string]: infer E;
}
  ? UnionToIntersection<
      E extends Endpoint
        ? E["path"] extends "/get-session" | "/user/get/:id"
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
  : {}; // Return empty object instead of never if no session endpoints

/**
 * Main API inference type that combines filtered actions with special endpoints
 * Follows Better Auth pattern for consistent type inference
 */
export type InferAPI<API> = InferSessionAPI<API> & FilterActions<API>;
