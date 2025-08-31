/**
 * Core type definitions for Better Marketing
 */

import { PluginManager } from "../core";
import { getMarketingTables } from "../db/get-tables";
import { createInternalAdapter } from "../db/internal-adapter";
import { createLogger } from "../utils/logger";
import { AdapterInstance } from "./adapter";
import { GenericEndpointContext } from "./context";

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

export interface Campaign {
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

export interface MarketingPlugin {
  name: string;
  version?: string;
  init?: (config: any) => Promise<void>;
  destroy?: () => Promise<void>;
  hooks?: PluginHooks;
  api?: Record<string, Function>;
}

export interface PluginHooks {
  "user:created"?: (user: MarketingUser) => Promise<void> | void;
  "user:updated"?: (
    user: MarketingUser,
    previousUser: MarketingUser
  ) => Promise<void> | void;
  "event:tracked"?: (event: MarketingEvent) => Promise<void> | void;
  "campaign:sent"?: (
    campaign: Campaign,
    recipients: MarketingUser[]
  ) => Promise<void> | void;
  "email:sent"?: (
    result: EmailResult,
    options: SendEmailOptions
  ) => Promise<void> | void;
  "sms:sent"?: (
    result: SMSResult,
    options: SendSMSOptions
  ) => Promise<void> | void;
}

export interface MarketingContext {
  adapter: AdapterInstance;
  internalAdapter: ReturnType<typeof createInternalAdapter>;
  pluginManager: PluginManager;
  options: BetterMarketingOptions;
  secret: string;
  generateId: (options: { model: string; size?: number }) => string;
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
  database?: AdapterInstance;
  emailProvider?: EmailProvider;
  smsProvider?: SMSProvider;
  analyticsProviders?: AnalyticsProvider[];
  plugins?: MarketingPlugin[];
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
    additionalFields?: Record<string, any>;
  };
  rateLimit?: {
    enabled?: boolean;
    window?: number;
    max?: number;
  };
  logger?: ReturnType<typeof createLogger>;
  advanced?: {
    generateId?: (options: { model: string; size?: number }) => string;
  };
  databaseHooks?: MarketingDatabaseHooks;
}

// Re-export for compatibility
export type BetterMarketingPlugin = MarketingPlugin;
