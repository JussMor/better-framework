/**
 * Error handling for Better Framework
 */

export class BetterFrameworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BetterFrameworkError";
  }
}

export class BetterFrameworkAPIError extends BetterFrameworkError {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = "BetterFrameworkAPIError";
  }
}

export class BetterFrameworkConfigError extends BetterFrameworkError {
  constructor(message: string) {
    super(message);
    this.name = "BetterFrameworkConfigError";
  }
}
