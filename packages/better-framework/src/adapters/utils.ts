import type { FieldAttribute } from "../db/field";

/**
 * Apply default value to field if needed
 */
export function withApplyDefault(
  value: any,
  fieldAttributes: FieldAttribute,
  action: "create" | "update"
): any {
  if (value !== undefined) {
    return value;
  }

  // Apply default value for create operations
  if (action === "create" && fieldAttributes.defaultValue !== undefined) {
    if (typeof fieldAttributes.defaultValue === "function") {
      return fieldAttributes.defaultValue();
    }
    return fieldAttributes.defaultValue;
  }

  // Apply onUpdate value for update operations
  if (action === "update" && fieldAttributes.onUpdate) {
    return fieldAttributes.onUpdate();
  }

  return value;
}
