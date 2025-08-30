/**
 * Core type definitions for Better Marketing
 */

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

export interface DatabaseAdapter {
  name: string;
  // User operations
  createUser: (
    user: Omit<MarketingUser, "id" | "createdAt" | "updatedAt">
  ) => Promise<MarketingUser>;
  getUserById: (id: string) => Promise<MarketingUser | null>;
  getUserByEmail: (email: string) => Promise<MarketingUser | null>;
  updateUser: (
    id: string,
    updates: Partial<MarketingUser>
  ) => Promise<MarketingUser>;
  deleteUser: (id: string) => Promise<void>;

  // Event operations
  createEvent: (
    event: Omit<MarketingEvent, "id" | "timestamp">
  ) => Promise<MarketingEvent>;
  getEventsByUserId: (
    userId: string,
    limit?: number
  ) => Promise<MarketingEvent[]>;

  // Campaign operations
  createCampaign: (
    campaign: Omit<Campaign, "id" | "createdAt" | "updatedAt">
  ) => Promise<Campaign>;
  getCampaignById: (id: string) => Promise<Campaign | null>;
  updateCampaign: (id: string, updates: Partial<Campaign>) => Promise<Campaign>;
  deleteCampaign: (id: string) => Promise<void>;

  // Segment operations
  createSegment: (
    segment: Omit<Segment, "id" | "createdAt" | "updatedAt">
  ) => Promise<Segment>;
  getSegmentById: (id: string) => Promise<Segment | null>;
  updateSegment: (id: string, updates: Partial<Segment>) => Promise<Segment>;
  deleteSegment: (id: string) => Promise<void>;
  getUsersInSegment: (segmentId: string) => Promise<MarketingUser[]>;
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

export interface BetterMarketingConfig {
  database: DatabaseAdapter;
  emailProvider?: EmailProvider;
  smsProvider?: SMSProvider;
  analyticsProviders?: AnalyticsProvider[];
  plugins?: MarketingPlugin[];
  secret: string;
  baseURL?: string;
  basePath?: string;
  trustedOrigins?: string[];
  session?: {
    expiresIn?: number;
    updateAge?: number;
  };
  rateLimit?: {
    window?: number;
    max?: number;
  };
}

export interface BetterMarketingInstance {
  config: BetterMarketingConfig;
  api: MarketingAPI;
  handler: (request: Request) => Promise<Response>;
}

export interface MarketingAPI {
  // User management
  user: {
    create: (
      user: Omit<MarketingUser, "id" | "createdAt" | "updatedAt">
    ) => Promise<MarketingUser>;
    get: (id: string) => Promise<MarketingUser | null>;
    update: (
      id: string,
      updates: Partial<MarketingUser>
    ) => Promise<MarketingUser>;
    delete: (id: string) => Promise<void>;
    getByEmail: (email: string) => Promise<MarketingUser | null>;
  };

  // Event tracking
  track: (
    event: Omit<MarketingEvent, "id" | "timestamp">
  ) => Promise<MarketingEvent>;

  // Campaign management
  campaign: {
    create: (
      campaign: Omit<Campaign, "id" | "createdAt" | "updatedAt">
    ) => Promise<Campaign>;
    get: (id: string) => Promise<Campaign | null>;
    update: (id: string, updates: Partial<Campaign>) => Promise<Campaign>;
    delete: (id: string) => Promise<void>;
    send: (
      id: string
    ) => Promise<{ success: boolean; sentCount: number; errors?: string[] }>;
  };

  // Segmentation
  segment: {
    create: (
      segment: Omit<Segment, "id" | "createdAt" | "updatedAt">
    ) => Promise<Segment>;
    get: (id: string) => Promise<Segment | null>;
    update: (id: string, updates: Partial<Segment>) => Promise<Segment>;
    delete: (id: string) => Promise<void>;
    getUsers: (id: string) => Promise<MarketingUser[]>;
  };

  // Direct messaging
  email: {
    send: (options: SendEmailOptions) => Promise<EmailResult>;
    sendBulk: (options: SendBulkEmailOptions) => Promise<BulkEmailResult>;
  };

  sms: {
    send: (options: SendSMSOptions) => Promise<SMSResult>;
    sendBulk: (options: SendBulkSMSOptions) => Promise<BulkSMSResult>;
  };
}

// Additional types for Better Marketing
export interface BetterMarketingOptions {
  database?:
    | DatabaseAdapter
    | ((options: BetterMarketingOptions) => DatabaseAdapter);
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
  };
  rateLimit?: {
    enabled?: boolean;
    window?: number;
    max?: number;
  };
  advanced?: {
    generateId?: (options: { model: string; size?: number }) => string;
  };
  logger?: import("../utils/logger").LoggerOptions;
}

// Re-export for compatibility
export type BetterMarketingPlugin = MarketingPlugin;
