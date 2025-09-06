/**
 * Error handling for Better Framework
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

// Framework error aliases
export class BetterFrameworkError extends BetterMarketingError {
  constructor(message: string) {
    super(message);
    this.name = "BetterFrameworkError";
  }
}

export class BetterFrameworkAPIError extends BetterMarketingAPIError {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = "BetterFrameworkAPIError";
  }
}

export class BetterFrameworkConfigError extends BetterMarketingConfigError {
  constructor(message: string) {
    super(message);
    this.name = "BetterFrameworkConfigError";
  }
}
