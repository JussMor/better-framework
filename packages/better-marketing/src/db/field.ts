/**
 * Field attribute definitions for Better Marketing
 */

export type FieldType = "string" | "number" | "boolean" | "date" | "json";

export interface FieldAttribute {
  /**
   * The type of the field
   */
  type: FieldType;
  /**
   * If the field is required
   * @default true
   */
  required?: boolean;
  /**
   * If the field is unique
   * @default false
   */
  unique?: boolean;
  /**
   * Default value for the field
   */
  defaultValue?: any | (() => any);
  /**
   * Transform value before storing
   */
  transform?: {
    input?: (value: any) => any | Promise<any>;
    output?: (value: any) => any | Promise<any>;
  };
  /**
   * Reference to another model
   */
  references?: {
    model: string;
    field: string;
    onDelete?: "cascade" | "set null" | "restrict";
  };
  /**
   * Custom field name in database
   */
  fieldName?: string;
  /**
   * If the field should be returned in responses
   * @default true
   */
  returned?: boolean;
}
