import type { Adapter, BetterMarketingOptions } from "better-marketing";

export interface SchemaGenerator {
	(opts: {
		file?: string;
		adapter: Adapter;
		options: BetterMarketingOptions;
	}): Promise<{
		code?: string;
		fileName: string;
		overwrite?: boolean;
		append?: boolean;
	}>;
}
