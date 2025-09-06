/**
 * Core type definitions for Better Framework
 */
import { CookieOptions } from "better-call";
import type { Database } from "better-sqlite3";
import type { Database as BunDatabase } from "bun:sqlite";
import type { Dialect, Kysely, MysqlPool, PostgresPool } from "kysely";
import { DatabaseSync } from "node:sqlite";
import { AdapterDebugLogs } from "../adapters/create-adapter/types";
import { KyselyDatabaseType } from "../adapters/kysely-adapter";
import { FrameworkMiddleware } from "../api/call";
import { FieldAttribute } from "../db";
import { getFrameworkTables } from "../db/get-tables";
import { createInternalAdapter } from "../db/internal-adapter";
import type { Logger } from "../utils/logger";
import { createLogger } from "../utils/logger";
import { Adapter, AdapterInstance } from "./adapter";
import { GenericEndpointContext } from "./context";
import { LiteralUnion, OmitId } from "./helper";
import { BetterFrameworkPlugin } from "./plugins";

export * from "./adapter";
export * from "./context";
export * from "./helper";
export * from "./plugins";

export type Models =
  | "frameworkUser"
  | "frameworkEvent"
  | "frameworkEmail"
  | "campaign"
  | "segment"
  | "user"
  | "account"
  | "session"
  | "verification";

export interface FrameworkUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  properties?: Record<string, any>;
  segments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FrameworkEvent {
  id: string;
  userId: string;
  eventName: string;
  properties?: Record<string, any>;
  timestamp: Date;
  sessionId?: string;
  source?: string;
}

export interface FrameworkContext {
  appName: string;
  session: {
    session: Record<string, any>;
    user: FrameworkUser & Record<string, any>;
  } | null;
  adapter: Adapter;
  internalAdapter: ReturnType<typeof createInternalAdapter>;
  options: BetterFrameworkOptions;
  secret: string;
  generateId: (options: {
    model: LiteralUnion<Models, string>;
    size?: number;
  }) => string | false;
  tables: ReturnType<typeof getFrameworkTables>;
  logger: ReturnType<typeof createLogger>;
  baseURL?: string;
}

// Database hooks for framework operations
export interface FrameworkDatabaseHooks {
  frameworkUser?: {
    create?: {
      before?: (
        user: FrameworkUser & Record<string, unknown>,
        context?: GenericEndpointContext
      ) => Promise<
        boolean | { data: Partial<FrameworkUser & Record<string, unknown>> }
      >;
      after?: (
        user: FrameworkUser & Record<string, unknown>,
        context?: GenericEndpointContext
      ) => Promise<void> | void;
    };
    update?: {
      before?: (
        userData: Partial<FrameworkUser & Record<string, unknown>>,
        context?: GenericEndpointContext
      ) => Promise<
        boolean | { data: Partial<FrameworkUser & Record<string, unknown>> }
      >;
      after?: (
        user: FrameworkUser & Record<string, unknown>,
        context?: GenericEndpointContext
      ) => Promise<void> | void;
    };
  };
  frameworkEvent?: {
    create?: {
      before?: (
        event: FrameworkEvent & Record<string, unknown>,
        context?: GenericEndpointContext
      ) => Promise<
        boolean | { data: Partial<FrameworkEvent & Record<string, unknown>> }
      >;
      after?: (
        event: FrameworkEvent & Record<string, unknown>,
        context?: GenericEndpointContext
      ) => Promise<void> | void;
    };
    update?: {
      before?: (
        eventData: Partial<FrameworkEvent & Record<string, unknown>>,
        context?: GenericEndpointContext
      ) => Promise<
        boolean | { data: Partial<FrameworkEvent & Record<string, unknown>> }
      >;
      after?: (
        event: FrameworkEvent & Record<string, unknown>,
        context?: GenericEndpointContext
      ) => Promise<void> | void;
    };
  };
  user?: {
    create?: {
      before?: (
        user: FrameworkUser & Record<string, unknown>,
        context?: GenericEndpointContext
      ) => Promise<
        boolean | { data: Partial<FrameworkUser & Record<string, unknown>> }
      >;
      after?: (
        user: FrameworkUser & Record<string, unknown>,
        context?: GenericEndpointContext
      ) => Promise<void> | void;
    };
    update?: {
      before?: (
        userData: Partial<FrameworkUser & Record<string, unknown>>,
        context?: GenericEndpointContext
      ) => Promise<
        boolean | { data: Partial<FrameworkUser & Record<string, unknown>> }
      >;
      after?: (
        user: FrameworkUser & Record<string, unknown>,
        context?: GenericEndpointContext
      ) => Promise<void> | void;
    };
  };
}

// Additional types for Better Framework
export interface BetterFrameworkOptions {
  database?:
    | PostgresPool
    | MysqlPool
    | Database
    | Dialect
    | AdapterInstance
    | BunDatabase
    | DatabaseSync
    | {
        dialect: Dialect;
        type: KyselyDatabaseType;
        /**
         * casing for table names
         *
         * @default "camel"
         */
        casing?: "snake" | "camel";
        /**
         * Enable debug logs for the adapter
         *
         * @default false
         */
        debugLogs?: AdapterDebugLogs;
      }
    | {
        /**
         * Kysely instance
         */
        db: Kysely<any>;
        /**
         * Database type between postgres, mysql and sqlite
         */
        type: KyselyDatabaseType;
        /**
         * casing for table names
         *
         * @default "camel"
         */
        casing?: "snake" | "camel";
        /**
         * Enable debug logs for the adapter
         *
         * @default false
         */
        debugLogs?: AdapterDebugLogs;
      };
  plugins?: BetterFrameworkPlugin[];
  secret?: string;
  baseURL?: string;
  basePath?: string;
  trustedOrigins?: string[];
  session?: {
    expiresIn?: number;
    updateAge?: number;
    additionalFields?: Record<string, any>;
  };

  user?: {
    fields?: Partial<Record<keyof OmitId<FrameworkUser>, string>>;
    modelName?: string;
    additionalFields?: {
      [key: string]: FieldAttribute;
    };
  };
  event?: {
    fields?: Partial<Record<keyof OmitId<FrameworkEvent>, string>>;
    modelName?: string;
    additionalFields?: {
      [key: string]: FieldAttribute;
    };
  };
  account?: {
    /**
     * The model name for the account. Defaults to "account".
     */
    modelName?: string;
    /**
     * Map fields
     */
    // fields?: Partial<Record<keyof OmitId<Account>, string>>;
    /**
     * When enabled (true), the user account data (accessToken, idToken, refreshToken, etc.)
     * will be updated on sign in with the latest data from the provider.
     *
     * @default true
     */
    updateAccountOnSignIn?: boolean;
    /**
     * Configuration for account linking.
     */
    accountLinking?: {
      /**
       * Enable account linking
       *
       * @default true
       */
      enabled?: boolean;
      /**
       * List of trusted providers
       */
      /**
       * If enabled (true), this will allow users to manually linking accounts with different email addresses than the main user.
       *
       * @default false
       *
       * ⚠️ Warning: enabling this might lead to account takeovers, so proceed with caution.
       */
      allowDifferentEmails?: boolean;
      /**
       * If enabled (true), this will allow users to unlink all accounts.
       *
       * @default false
       */
      allowUnlinkingAll?: boolean;
      /**
       * If enabled (true), this will update the user information based on the newly linked account
       *
       * @default false
       */
      updateUserInfoOnLink?: boolean;
    };
    /**
     * Encrypt OAuth tokens
     *
     * By default, OAuth tokens (access tokens, refresh tokens, ID tokens) are stored in plain text in the database.
     * This poses a security risk if your database is compromised, as attackers could gain access to user accounts
     * on external services.
     *
     * When enabled, tokens are encrypted using AES-256-GCM before storage, providing protection against:
     * - Database breaches and unauthorized access to raw token data
     * - Internal threats from database administrators or compromised credentials
     * - Token exposure in database backups and logs
     * @default false
     */
    encryptOAuthTokens?: boolean;
  };
  rateLimit?: {
    enabled?: boolean;
    window?: number;
    max?: number;
  };
  logger?: Logger;
  advanced?: {
    /**
     * Ip address configuration
     */
    ipAddress?: {
      /**
       * List of headers to use for ip address
       *
       * Ip address is used for rate limiting and session tracking
       *
       * @example ["x-client-ip", "x-forwarded-for", "cf-connecting-ip"]
       *
       * @default
       * @link https://github.com/better-auth/better-auth/blob/main/packages/better-auth/src/utils/get-request-ip.ts#L8
       */
      ipAddressHeaders?: string[];
      /**
       * Disable ip tracking
       *
       * ⚠︎ This is a security risk and it may expose your application to abuse
       */
      disableIpTracking?: boolean;
    };
    /**
     * Use secure cookies
     *
     * @default false
     */
    useSecureCookies?: boolean;
    /**
     * Disable trusted origins check
     *
     * ⚠︎ This is a security risk and it may expose your application to CSRF attacks
     */
    disableCSRFCheck?: boolean;
    /**
     * Configure cookies to be cross subdomains
     */
    crossSubDomainCookies?: {
      /**
       * Enable cross subdomain cookies
       */
      enabled: boolean;
      /**
       * Additional cookies to be shared across subdomains
       */
      additionalCookies?: string[];
      /**
       * The domain to use for the cookies
       *
       * By default, the domain will be the root
       * domain from the base URL.
       */
      domain?: string;
    };
    /*
     * Allows you to change default cookie names and attributes
     *
     * default cookie names:
     * - "session_token"
     * - "session_data"
     * - "dont_remember"
     *
     * plugins can also add additional cookies
     */
    cookies?: {
      [key: string]: {
        name?: string;
        attributes?: CookieOptions;
      };
    };
    defaultCookieAttributes?: CookieOptions;
    /**
     * Prefix for cookies. If a cookie name is provided
     * in cookies config, this will be overridden.
     *
     * @default
     * ```txt
     * "appName" -> which defaults to "better-auth"
     * ```
     */
    cookiePrefix?: string;
    /**
     * Database configuration.
     */
    database?: {
      /**
       * The default number of records to return from the database
       * when using the `findMany` adapter method.
       *
       * @default 100
       */
      defaultFindManyLimit?: number;
      /**
       * If your database auto increments number ids, set this to `true`.
       *
       * Note: If enabled, we will not handle ID generation (including if you use `generateId`), and it would be expected that your database will provide the ID automatically.
       *
       * @default false
       */
      useNumberId?: boolean;
      /**
       * Custom generateId function.
       *
       * If not provided, random ids will be generated.
       * If set to false, the database's auto generated id will be used.
       */
      generateId?:
        | ((options: {
            model: LiteralUnion<Models, string>;
            size?: number;
          }) => string | false)
        | false;
    };
    generateId?:
      | ((options: {
          model: LiteralUnion<Models, string>;
          size?: number;
        }) => string | false)
      | false;
  };
  hooks?: {
    /**
     * Before a request is processed
     */
    before?: FrameworkMiddleware;
    /**
     * After a request is processed
     */
    after?: FrameworkMiddleware;
  };
  databaseHooks?: FrameworkDatabaseHooks;
}
