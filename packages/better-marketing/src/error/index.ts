/**
 * Error handling for Better Marketing
 */

export class BetterMarketingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BetterMarketingError";
  }
}

export class BetterMarketingAPIError extends BetterMarketingError {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = "BetterMarketingAPIError";
  }
}

export class BetterMarketingConfigError extends BetterMarketingError {
  constructor(message: string) {
    super(message);
    this.name = "BetterMarketingConfigError";
  }
}
