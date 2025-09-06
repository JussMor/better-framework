/**
 * Generate a unique ID
 */
export function generateId(): string {
  return crypto.randomUUID();
}
