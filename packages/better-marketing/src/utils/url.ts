/**
 * URL utility functions for Better Marketing
 */

export function getBaseURL(
  baseURL?: string,
  basePath?: string,
  request?: Request
): string | null {
  // If baseURL is provided, return it
  if (baseURL) {
    return baseURL;
  }

  // Try to get URL from request
  if (request) {
    try {
      const url = new URL(request.url);
      return `${url.protocol}//${url.host}`;
    } catch {
      // Fallback if URL parsing fails
    }
  }

  return null;
}

export function getOrigin(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}
