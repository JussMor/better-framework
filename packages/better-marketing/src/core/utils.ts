/**
 * Core utility functions
 */

import type { BetterMarketingConfig } from "../types";

/**
 * Validate Better Marketing configuration
 */
export function validateConfig(config: BetterMarketingConfig): void {
  if (!config.database) {
    throw new Error("Database adapter is required");
  }

  if (!config.secret) {
    throw new Error("Secret is required for security");
  }

  if (config.secret.length < 32) {
    throw new Error("Secret must be at least 32 characters long");
  }

  if (config.session?.expiresIn && config.session.expiresIn < 60) {
    throw new Error("Session expiration must be at least 60 seconds");
  }

  if (config.rateLimit?.max && config.rateLimit.max < 1) {
    throw new Error("Rate limit max must be at least 1");
  }

  if (config.rateLimit?.window && config.rateLimit.window < 1000) {
    throw new Error("Rate limit window must be at least 1000ms");
  }
}

/**
 * Generate a random ID
 */
export function generateId(size?: number): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const targetSize = size || 16;
  let result = "";
  for (let i = 0; i < targetSize; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Check if string is valid email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if string is valid phone number
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
}

/**
 * Sanitize string for database storage
 */
export function sanitizeString(str: string): string {
  return str.trim().replace(/[<>]/g, "");
}

/**
 * Deep merge objects
 */
export function deepMerge<T extends Record<string, any>>(
  target: T,
  ...sources: Partial<T>[]
): T {
  if (!sources.length) return target;

  const source = sources.shift();
  if (!source) return target;

  for (const key in source) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key])
    ) {
      if (!target[key]) target[key] = {} as T[Extract<keyof T, string>];
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key] as T[Extract<keyof T, string>];
    }
  }

  return deepMerge(target, ...sources);
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    retries?: number;
    delay?: number;
    backoff?: number;
  } = {}
): Promise<T> {
  const { retries = 3, delay = 1000, backoff = 2 } = options;

  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries) throw error;
      await sleep(delay * Math.pow(backoff, i));
    }
  }

  throw new Error("Retry failed");
}
