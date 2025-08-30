/**
 * Safely parse JSON string
 */
export function safeJSONParse(str: string): any {
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
}
