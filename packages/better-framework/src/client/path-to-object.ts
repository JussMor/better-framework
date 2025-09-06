import type {
  BetterFetchOption,
  BetterFetchResponse,
} from "@better-fetch/fetch";
import type { Endpoint, InputContext, StandardSchemaV1 } from "better-call";
import type {
  HasRequiredKeys,
  Prettify,
  UnionToIntersection,
} from "../types/helper";
import type {
  ClientOptions,
  InferAdditionalFromClient,
  InferSessionFromClient,
  InferUserFromClient,
} from "./types";

export type CamelCase<S extends string> =
  S extends `${infer P1}-${infer P2}${infer P3}`
    ? `${Lowercase<P1>}${Uppercase<P2>}${CamelCase<P3>}`
    : Lowercase<S>;

// Extract static (non-parameter) segments from a path as camelCased strings
type StaticSegments<T extends string> = T extends `/${infer Seg}/${infer Rest}`
  ? Seg extends `:${string}`
    ? StaticSegments<`/${Rest}`>
    : [CamelCase<Seg>, ...StaticSegments<`/${Rest}`>]
  : T extends `/${infer Seg}`
    ? Seg extends `:${string}`
      ? []
      : [CamelCase<Seg>]
    : [];

// Build nested object from static segments with Fn at the deepest static segment
type BuildNested<Segs extends string[], Fn> = Segs extends [
  infer H extends string,
  ...infer R extends string[],
]
  ? { [K in H]: BuildNested<R, Fn> }
  : Fn;

// Map path to nested static segments; params (e.g., :id) are skipped.
export type PathToObject<T extends string, Fn extends (...args: any[]) => any> =
  StaticSegments<T> extends infer Segs extends string[]
    ? Segs extends []
      ? never
      : BuildNested<Segs, Fn>
    : never;

export type InferSignUpEmailCtx<
  ClientOpts extends ClientOptions,
  FetchOptions extends BetterFetchOption,
> = {
  email: string;
  name: string;
  password: string;
  image?: string;
  callbackURL?: string;
  fetchOptions?: FetchOptions;
} & UnionToIntersection<InferAdditionalFromClient<ClientOpts, "user", "input">>;

export type InferUserUpdateCtx<
  ClientOpts extends ClientOptions,
  FetchOptions extends BetterFetchOption,
> = {
  image?: string | null;
  name?: string;
  fetchOptions?: FetchOptions;
} & Partial<
  UnionToIntersection<InferAdditionalFromClient<ClientOpts, "user", "input">>
>;

export type InferCtx<
  C extends InputContext<any, any>,
  FetchOptions extends BetterFetchOption,
> =
  // Include body fields if present
  (C["body"] extends Record<string, any> ? C["body"] : {}) &
    // Include query under a `query` key (always optional)
    (C["query"] extends Record<string, any> | undefined
      ? { query?: C["query"] }
      : {}) &
    // Include route params as top-level fields and also allow nested `params`
    (C["params"] extends Record<string, any>
      ? C["params"] & { params?: C["params"] }
      : {}) & {
      fetchOptions?: FetchOptions;
    };

export type MergeRoutes<T> = UnionToIntersection<T>;

export type InferRoute<API, COpts extends ClientOptions> =
  API extends Record<string, infer T>
    ? T extends Endpoint
      ? T["options"]["metadata"] extends
          | {
              isAction: false;
            }
          | {
              SERVER_ONLY: true;
            }
        ? {}
        : PathToObject<
            T["path"],
            T extends (ctx: infer C) => infer R
              ? C extends InputContext<any, any>
                ? <
                    FetchOptions extends BetterFetchOption<
                      Partial<C["body"]> & Record<string, any>,
                      Partial<C["query"]> & Record<string, any>,
                      C["params"]
                    >,
                  >(
                    ...data: HasRequiredKeys<
                      InferCtx<C, FetchOptions>
                    > extends true
                      ? [
                          Prettify<
                            T["path"] extends `/sign-up/email`
                              ? InferSignUpEmailCtx<COpts, FetchOptions>
                              : InferCtx<C, FetchOptions>
                          >,
                          FetchOptions?,
                        ]
                      : [
                          Prettify<
                            T["path"] extends `/update-user`
                              ? InferUserUpdateCtx<COpts, FetchOptions>
                              : InferCtx<C, FetchOptions>
                          >?,
                          FetchOptions?,
                        ]
                  ) => Promise<
                    BetterFetchResponse<
                      T["options"]["metadata"] extends {
                        CUSTOM_SESSION: boolean;
                      }
                        ? NonNullable<Awaited<R>>
                        : T["path"] extends "/get-session"
                          ? {
                              user: InferUserFromClient<COpts>;
                              session: InferSessionFromClient<COpts>;
                            } | null
                          : NonNullable<Awaited<R>>,
                      T["options"]["error"] extends StandardSchemaV1
                        ? // InferOutput
                          NonNullable<
                            T["options"]["error"]["~standard"]["types"]
                          >["output"]
                        : {
                            code?: string;
                            message?: string;
                          },
                      FetchOptions["throw"] extends true
                        ? true
                        : COpts["fetchOptions"] extends { throw: true }
                          ? true
                          : false
                    >
                  >
                : never
              : never
          >
      : {}
    : never;

export type InferRoutes<
  API extends Record<string, Endpoint>,
  ClientOpts extends ClientOptions,
> = MergeRoutes<InferRoute<API, ClientOpts>>;

export type ProxyRequest = {
  options?: BetterFetchOption<any, any>;
  query?: any;
  [key: string]: any;
};
