import type { Adapter, BetterFrameworkOptions } from "better-framework";

export interface GenerateInput {
  adapter?: Adapter;
  createSystemPrompt: (
    options: BetterFrameworkOptions;
  ) => Promise<string> | string;
}

export interface SchemaGenerator {
  (opts: {
    file?: string;
    adapter: Adapter;
    options: BetterFrameworkOptions;
  }): Promise<{
    code?: string;
    fileName: string;
    overwrite?: boolean;
    append?: boolean;
  }>;
}
