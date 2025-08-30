/**
 * Types for Better Marketing database adapter creation
 * Based on Better Auth's adapter architecture
 */



export type AdapterDebugLogs =
  | boolean
  | {
      logCondition?: (() => boolean) | undefined;
      create?: boolean;
      update?: boolean;
      updateMany?: boolean;
      findOne?: boolean;
      findMany?: boolean;
      delete?: boolean;
      deleteMany?: boolean;
      count?: boolean;
    };

export interface AdapterConfig {
  /**
   * Adapter identifier
   */
  adapterId: string;
  /**
   * Human readable adapter name
   */
  adapterName?: string;
  /**
   * Use plural table names
   * @default false
   */
  usePlural?: boolean;
  /**
   * Enable debug logs
   * @default false
   */
  debugLogs?: AdapterDebugLogs;
  /**
   * Database supports JSON columns
   * @default true
   */
  supportsJSON?: boolean;
  /**
   * Database supports Date columns
   * @default true
   */
  supportsDates?: boolean;
  /**
   * Database supports Boolean columns
   * @default true
   */
  supportsBooleans?: boolean;
}

export interface FieldAttribute {
  type: "string" | "number" | "boolean" | "date" | "json";
  required?: boolean;
  unique?: boolean;
  defaultValue?: any;
  references?: {
    model: string;
    field: string;
  };
}

export interface ModelSchema {
  modelName: string;
  fields: Record<string, FieldAttribute>;
}

export interface BetterMarketingDbSchema {
  marketingUser: ModelSchema;
  marketingEvent: ModelSchema;
  campaign: ModelSchema;
  segment: ModelSchema;
}

export interface CreateAdapterParams {
  getFieldName: (params: { model: string; field: string }) => string;
  schema: BetterMarketingDbSchema;
}

export type CreateCustomAdapter = (params: CreateAdapterParams) => {
  create: <T>(model: string, data: Partial<T>) => Promise<T>;
  findOne: <T>(model: string, where: Where[]) => Promise<T | null>;
  findMany: <T>(
    model: string,
    options?: {
      where?: Where[];
      limit?: number;
      orderBy?: { field: string; direction: "asc" | "desc" };
    }
  ) => Promise<T[]>;
  update: <T>(model: string, where: Where[], data: Partial<T>) => Promise<T>;
  delete: (model: string, where: Where[]) => Promise<void>;
  count: (model: string, where?: Where[]) => Promise<number>;
};

export interface Where {
  field: string;
  operator:
    | "eq"
    | "ne"
    | "gt"
    | "gte"
    | "lt"
    | "lte"
    | "in"
    | "nin"
    | "contains";
  value: any;
}

export interface CreateAdapterOptions {
  config: AdapterConfig;
  adapter: CreateCustomAdapter;
}
