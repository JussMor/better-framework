/**
 * Logger utilities for Better Marketing
 */

export interface Logger {
  info: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
  debug: (message: string, ...args: any[]) => void;
}

export type LoggerOptions =
  | {
      disabled?: boolean;
      verboseLogging?: boolean;
    }
  | Logger;

export function createLogger(options?: LoggerOptions): Logger {
  if (!options) {
    return defaultLogger;
  }

  if (typeof options === "object" && "info" in options) {
    return options as Logger;
  }

  const config = options as { disabled?: boolean; verboseLogging?: boolean };

  if (config.disabled) {
    return silentLogger;
  }

  if (config.verboseLogging) {
    return verboseLogger;
  }

  return defaultLogger;
}

const defaultLogger: Logger = {
  info: (message: string, ...args: any[]) =>
    console.log(`[Better Marketing] ${message}`, ...args),
  warn: (message: string, ...args: any[]) =>
    console.warn(`[Better Marketing] ${message}`, ...args),
  error: (message: string, ...args: any[]) =>
    console.error(`[Better Marketing] ${message}`, ...args),
  debug: (message: string, ...args: any[]) =>
    console.debug(`[Better Marketing] ${message}`, ...args),
};

const verboseLogger: Logger = {
  info: (message: string, ...args: any[]) =>
    console.log(`[Better Marketing] [INFO] ${message}`, ...args),
  warn: (message: string, ...args: any[]) =>
    console.warn(`[Better Marketing] [WARN] ${message}`, ...args),
  error: (message: string, ...args: any[]) =>
    console.error(`[Better Marketing] [ERROR] ${message}`, ...args),
  debug: (message: string, ...args: any[]) =>
    console.debug(`[Better Marketing] [DEBUG] ${message}`, ...args),
};

const silentLogger: Logger = {
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {},
};
