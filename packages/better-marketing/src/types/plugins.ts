import type { Migration } from "kysely";
import type { HookEndpointContext } from ".";
import { type MarketingMiddleware } from "../api/call";
import type { FieldAttribute } from "../db/field";
import type {
  DeepPartial,
  LiteralString,
  UnionToIntersection,
} from "../types/helper";

import type { Endpoint, Middleware } from "better-call";
import type { BetterMarketingOptions, MarketingContext } from ".";

export type MarketingPluginSchema = {
  [table in string]: {
    fields: {
      [field in string]: FieldAttribute;
    };
    disableMigration?: boolean;
    modelName?: string;
  };
};

export type BetterMarketingPlugin<
  Endpoints extends Record<string, Endpoint> = Record<string, Endpoint>,
> = {
  id: LiteralString;
  /**
   * The init function is called when the plugin is initialized.
   * You can return a new context or modify the existing context.
   */
  init?: (ctx: MarketingContext) => {
    context?: DeepPartial<Omit<MarketingContext, "options">>;
    options?: Partial<BetterMarketingOptions>;
  } | void;
  endpoints?: Endpoints; // preserve literal keys via generic
  middlewares?: {
    path: string;
    middleware: Middleware;
  }[];
  onRequest?: (
    request: Request,
    ctx: MarketingContext
  ) => Promise<
    | {
        response: Response;
      }
    | {
        request: Request;
      }
    | void
  >;
  onResponse?: (
    response: Response,
    ctx: MarketingContext
  ) => Promise<{
    response: Response;
  } | void>;
  hooks?: {
    before?: {
      matcher: (context: HookEndpointContext) => boolean;
      handler: MarketingMiddleware;
    }[];
    after?: {
      matcher: (context: HookEndpointContext) => boolean;
      handler: MarketingMiddleware;
    }[];
  };
  /**
   * Schema the plugin needs
   *
   * This will also be used to migrate the database. If the fields are dynamic from the plugins
   * configuration each time the configuration is changed a new migration will be created.
   *
   * NOTE: If you want to create migrations manually using
   * migrations option or any other way you
   * can disable migration per table basis.
   *
   * @example
   * ```ts
   * schema: {
   * 	user: {
   * 		fields: {
   * 			email: {
   * 				 type: "string",
   * 			},
   * 			emailVerified: {
   * 				type: "boolean",
   * 				defaultValue: false,
   * 			},
   * 		},
   * 	}
   * } as AuthPluginSchema
   * ```
   */
  schema?: MarketingPluginSchema;
  /**
   * The migrations of the plugin. If you define schema that will automatically create
   * migrations for you.
   *
   * ⚠️ Only uses this if you dont't want to use the schema option and you disabled migrations for
   * the tables.
   */
  migrations?: Record<string, Migration>;
  /**
   * The options of the plugin
   */
  options?: Record<string, any> | undefined;
  /**
   * types to be inferred
   */
  $Infer?: Record<string, any>;
  /**
   * The rate limit rules to apply to specific paths.
   */
  rateLimit?: {
    window: number;
    max: number;
    pathMatcher: (path: string) => boolean;
  }[];
  /**
   * The error codes returned by the plugin
   */
  $ERROR_CODES?: Record<string, string>;
};

export type InferOptionSchema<S extends MarketingPluginSchema> =
  S extends Record<string, { fields: infer Fields }>
    ? {
        [K in keyof S]?: {
          modelName?: string;
          fields?: {
            [P in keyof Fields]?: string;
          };
        };
      }
    : never;

export type InferPluginErrorCodes<O extends BetterMarketingOptions> =
  O["plugins"] extends Array<infer P>
    ? UnionToIntersection<
        P extends BetterMarketingPlugin
          ? P["$ERROR_CODES"] extends Record<string, any>
            ? P["$ERROR_CODES"]
            : {}
          : {}
      >
    : {};
