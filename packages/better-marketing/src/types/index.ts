/**
 * Core type definitions for Better Marketing
 */
import { CookieOptions } from "better-call";
import type { Database } from "better-sqlite3";
import type { Database as BunDatabase } from "bun:sqlite";
import type { Dialect, Kysely, MysqlPool, PostgresPool } from "kysely";
import { DatabaseSync } from "node:sqlite";
import { AdapterDebugLogs } from "../adapters/create-adapter/types";
import { KyselyDatabaseType } from "../adapters/kysely-adapter";
import { MarketingMiddleware } from "../api/call";
import { Campaign, FieldAttribute } from "../db";
import { getMarketingTables } from "../db/get-tables";
import { createInternalAdapter } from "../db/internal-adapter";
import type { Logger } from "../utils/logger";
import { createLogger } from "../utils/logger";
import { Adapter, AdapterInstance } from "./adapter";
import { GenericEndpointContext } from "./context";
import { LiteralUnion, OmitId } from "./helper";
import { BetterMarketingPlugin } from "./plugins";

export * from "./adapter";
export * from "./context";
export * from "./helper";

export type Models =
  | "marketingUser"
  | "marketingEvent"
  | "marketingEmail"
  | "campaign"
  | "segment"
  | "user"
  | "account"
  | "session"
  | "verification";

export interface MarketingUser {
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

export interface MarketingEvent {
  id: string;
  userId: string;
  eventName: string;
  properties?: Record<string, any>;
  timestamp: Date;
  sessionId?: string;
  source?: string;
}

export interface MarketingCampaign {
  id: string;
  name: string;
  type: "email" | "sms" | "push" | "webhook";
  status: "draft" | "active" | "paused" | "completed";
  subject?: string;
  content: string;
  segmentIds: string[];
  scheduledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketingEmail {
  id: string;
  to: string;
  from: string;
  subject: string;
  content: string;
  status: "sent" | "failed" | "pending";
  messageId?: string;
  createdAt: Date;
}



export interface Segment {
  id: string;
  name: string;
  description?: string;
  conditions: SegmentCondition[];
  userCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SegmentCondition {
  property: string;
  operator:
    | "equals"
    | "not_equals"
    | "contains"
    | "not_contains"
    | "greater_than"
    | "less_than"
    | "in"
    | "not_in";
  value: any;
  logicalOperator?: "AND" | "OR";
}

export interface AutomationFlow {
  id: string;
  name: string;
  description?: string;
  trigger: AutomationTrigger;
  steps: AutomationStep[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AutomationTrigger {
  type: "event" | "segment_entry" | "segment_exit" | "date" | "webhook";
  config: Record<string, any>;
}

export interface AutomationStep {
  id: string;
  type:
    | "email"
    | "sms"
    | "wait"
    | "condition"
    | "webhook"
    | "tag"
    | "update_property";
  config: Record<string, any>;
  delay?: number;
}

export interface ABTest {
  id: string;
  name: string;
  description?: string;
  variants: ABTestVariant[];
  trafficSplit: number[];
  metric: string;
  status: "draft" | "running" | "completed" | "paused";
  startDate?: Date;
  endDate?: Date;
  winner?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ABTestVariant {
  id: string;
  name: string;
  content: string;
  isControl: boolean;
}

export interface EmailProvider {
  name: string;
  sendEmail: (options: SendEmailOptions) => Promise<EmailResult>;
  sendBulkEmail?: (options: SendBulkEmailOptions) => Promise<BulkEmailResult>;
}

export interface SendEmailOptions {
  to: string | string[];
  from: string;
  subject: string;
  html?: string;
  text?: string;
  attachments?: EmailAttachment[];
  headers?: Record<string, string>;
}

export interface SendBulkEmailOptions {
  messages: SendEmailOptions[];
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface BulkEmailResult {
  success: boolean;
  results: EmailResult[];
  error?: string;
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface SMSProvider {
  name: string;
  sendSMS: (options: SendSMSOptions) => Promise<SMSResult>;
  sendBulkSMS?: (options: SendBulkSMSOptions) => Promise<BulkSMSResult>;
}

export interface SendSMSOptions {
  to: string;
  from: string;
  body: string;
}

export interface SendBulkSMSOptions {
  messages: SendSMSOptions[];
}

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface BulkSMSResult {
  success: boolean;
  results: SMSResult[];
  error?: string;
}

export interface AnalyticsProvider {
  name: string;
  track: (options: AnalyticsTrackOptions) => Promise<AnalyticsResult>;
  identify: (options: AnalyticsIdentifyOptions) => Promise<AnalyticsResult>;
  page?: (options: AnalyticsPageOptions) => Promise<AnalyticsResult>;
}

export interface AnalyticsTrackOptions {
  userId: string;
  event: string;
  properties?: Record<string, any>;
  timestamp?: Date;
}

export interface AnalyticsIdentifyOptions {
  userId: string;
  traits?: Record<string, any>;
  timestamp?: Date;
}

export interface AnalyticsPageOptions {
  userId: string;
  name?: string;
  properties?: Record<string, any>;
  timestamp?: Date;
}

export interface AnalyticsResult {
  success: boolean;
  error?: string;
}

export interface MarketingContext {
  appName: string;
  session: {
    session: Record<string, any>;
    user: MarketingUser & Record<string, any>;
  } | null;
  adapter: Adapter;
  internalAdapter: ReturnType<typeof createInternalAdapter>;
  options: BetterMarketingOptions;
  secret: string;
  generateId: (options: {
    model: LiteralUnion<Models, string>;
    size?: number;
  }) => string | false;
  tables: ReturnType<typeof getMarketingTables>;
  logger: ReturnType<typeof createLogger>;
  baseURL?: string;
}

// Database hooks for marketing operations
export interface MarketingDatabaseHooks {
  marketingUser?: {
    create?: {
      before?: (
        user: MarketingUser & Record<string, unknown>,
        context?: GenericEndpointContext
      ) => Promise<
        boolean | { data: Partial<MarketingUser & Record<string, unknown>> }
      >;
      after?: (
        user: MarketingUser & Record<string, unknown>,
        context?: GenericEndpointContext
      ) => Promise<void> | void;
    };
    update?: {
      before?: (
        userData: Partial<MarketingUser & Record<string, unknown>>,
        context?: GenericEndpointContext
      ) => Promise<
        boolean | { data: Partial<MarketingUser & Record<string, unknown>> }
      >;
      after?: (
        user: MarketingUser & Record<string, unknown>,
        context?: GenericEndpointContext
      ) => Promise<void> | void;
    };
  };
  marketingEvent?: {
    create?: {
      before?: (
        event: MarketingEvent & Record<string, unknown>,
        context?: GenericEndpointContext
      ) => Promise<
        boolean | { data: Partial<MarketingEvent & Record<string, unknown>> }
      >;
      after?: (
        event: MarketingEvent & Record<string, unknown>,
        context?: GenericEndpointContext
      ) => Promise<void> | void;
    };
    update?: {
      before?: (
        eventData: Partial<MarketingEvent & Record<string, unknown>>,
        context?: GenericEndpointContext
      ) => Promise<
        boolean | { data: Partial<MarketingEvent & Record<string, unknown>> }
      >;
      after?: (
        event: MarketingEvent & Record<string, unknown>,
        context?: GenericEndpointContext
      ) => Promise<void> | void;
    };
  };
  marketingEmail?: {
    create?: {
      before?: (
        email: MarketingEmail & Record<string, unknown>,
        context?: GenericEndpointContext
      ) => Promise<
        boolean | { data: Partial<MarketingEmail & Record<string, unknown>> }
      >;
      after?: (
        email: MarketingEmail & Record<string, unknown>,
        context?: GenericEndpointContext
      ) => Promise<void> | void;
    };
    update?: {
      before?: (
        emailData: Partial<MarketingEmail & Record<string, unknown>>,
        context?: GenericEndpointContext
      ) => Promise<
        boolean | { data: Partial<MarketingEmail & Record<string, unknown>> }
      >;
      after?: (
        email: MarketingEmail & Record<string, unknown>,
        context?: GenericEndpointContext
      ) => Promise<void> | void;
    };
  };
  user?: {
    create?: {
      before?: (
        user: MarketingUser & Record<string, unknown>,
        context?: GenericEndpointContext
      ) => Promise<
        boolean | { data: Partial<MarketingUser & Record<string, unknown>> }
      >;
      after?: (
        user: MarketingUser & Record<string, unknown>,
        context?: GenericEndpointContext
      ) => Promise<void> | void;
    };
    update?: {
      before?: (
        userData: Partial<MarketingUser & Record<string, unknown>>,
        context?: GenericEndpointContext
      ) => Promise<
        boolean | { data: Partial<MarketingUser & Record<string, unknown>> }
      >;
      after?: (
        user: MarketingUser & Record<string, unknown>,
        context?: GenericEndpointContext
      ) => Promise<void> | void;
    };
  };
  campaign?: {
    create?: {
      before?: (
        campaign: Campaign & Record<string, unknown>,
        context?: GenericEndpointContext
      ) => Promise<
        boolean | { data: Partial<Campaign & Record<string, unknown>> }
      >;
      after?: (
        campaign: Campaign & Record<string, unknown>,
        context?: GenericEndpointContext
      ) => Promise<void> | void;
    };
    update?: {
      before?: (
        campaignData: Partial<Campaign & Record<string, unknown>>,
        context?: GenericEndpointContext
      ) => Promise<
        boolean | { data: Partial<Campaign & Record<string, unknown>> }
      >;
      after?: (
        campaign: Campaign & Record<string, unknown>,
        context?: GenericEndpointContext
      ) => Promise<void> | void;
    };
  };
  segment?: {
    create?: {
      before?: (
        segment: Segment & Record<string, unknown>,
        context?: GenericEndpointContext
      ) => Promise<
        boolean | { data: Partial<Segment & Record<string, unknown>> }
      >;
      after?: (
        segment: Segment & Record<string, unknown>,
        context?: GenericEndpointContext
      ) => Promise<void> | void;
    };
    update?: {
      before?: (
        segmentData: Partial<Segment & Record<string, unknown>>,
        context?: GenericEndpointContext
      ) => Promise<
        boolean | { data: Partial<Segment & Record<string, unknown>> }
      >;
      after?: (
        segment: Segment & Record<string, unknown>,
        context?: GenericEndpointContext
      ) => Promise<void> | void;
    };
  };
}

// Additional types for Better Marketing
export interface BetterMarketingOptions {
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
  emailProvider?: EmailProvider;
  smsProvider?: SMSProvider;
  analyticsProviders?: AnalyticsProvider[];
  plugins?: BetterMarketingPlugin[];
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
    fields?: Partial<Record<keyof OmitId<MarketingUser>, string>>;
    modelName?: string;
    additionalFields?: {
      [key: string]: FieldAttribute;
    };
  };
  event?: {
    fields?: Partial<Record<keyof OmitId<MarketingEvent>, string>>;
    modelName?: string;
    additionalFields?: {
      [key: string]: FieldAttribute;
    };
  };
  campaign?: {
    fields?: Partial<Record<keyof OmitId<MarketingCampaign>, string>>;
    modelName?: string;
    additionalFields?: {
      [key: string]: FieldAttribute;
    };
  };
  email?: {
    fields?: Partial<Record<keyof OmitId<MarketingEmail>, string>>;
    modelName?: string;
    additionalFields?: {
      [key: string]: FieldAttribute;
    };
  };
  segment?: {
    fields?: Partial<Record<keyof OmitId<Segment>, string>>;
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
    before?: MarketingMiddleware;
    /**
     * After a request is processed
     */
    after?: MarketingMiddleware;
  };
  databaseHooks?: MarketingDatabaseHooks;
}
