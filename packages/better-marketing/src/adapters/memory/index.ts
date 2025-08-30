import { createAdapter } from "../create-adapter";
import type { CleanedWhere } from "../create-adapter/types";

// In-memory storage for all tables
const memoryStore: Record<string, Record<string, any>[]> = {};

// Helper function to match where conditions
function matchesWhere(
  record: Record<string, any>,
  where: CleanedWhere[]
): boolean {
  if (!where || where.length === 0) return true;

  // Group conditions by connector
  const andConditions: CleanedWhere[] = [];
  const orConditions: CleanedWhere[] = [];

  where.forEach((condition) => {
    if (condition.connector === "OR") {
      orConditions.push(condition);
    } else {
      andConditions.push(condition);
    }
  });

  // All AND conditions must be true
  const andResult = andConditions.every((condition) => {
    const fieldValue = record[condition.field];
    const conditionValue = condition.value;

    switch (condition.operator) {
      case "eq":
        return fieldValue === conditionValue;
      case "ne":
        return fieldValue !== conditionValue;
      case "gt":
        return conditionValue != null && fieldValue > conditionValue;
      case "gte":
        return conditionValue != null && fieldValue >= conditionValue;
      case "lt":
        return conditionValue != null && fieldValue < conditionValue;
      case "lte":
        return conditionValue != null && fieldValue <= conditionValue;
      case "in":
        return (
          Array.isArray(conditionValue) &&
          (conditionValue as any[]).includes(fieldValue)
        );
      case "contains":
        return typeof fieldValue === "string" &&
          typeof conditionValue === "string"
          ? fieldValue.includes(conditionValue)
          : false;
      case "starts_with":
        return typeof fieldValue === "string" &&
          typeof conditionValue === "string"
          ? fieldValue.startsWith(conditionValue)
          : false;
      case "ends_with":
        return typeof fieldValue === "string" &&
          typeof conditionValue === "string"
          ? fieldValue.endsWith(conditionValue)
          : false;
      default:
        return false;
    }
  });

  // If there are no OR conditions, just return AND result
  if (orConditions.length === 0) {
    return andResult;
  }

  // At least one OR condition must be true
  const orResult = orConditions.some((condition) => {
    const fieldValue = record[condition.field];
    const conditionValue = condition.value;

    switch (condition.operator) {
      case "eq":
        return fieldValue === conditionValue;
      case "ne":
        return fieldValue !== conditionValue;
      case "gt":
        return conditionValue != null && fieldValue > conditionValue;
      case "gte":
        return conditionValue != null && fieldValue >= conditionValue;
      case "lt":
        return conditionValue != null && fieldValue < conditionValue;
      case "lte":
        return conditionValue != null && fieldValue <= conditionValue;
      case "in":
        return (
          Array.isArray(conditionValue) &&
          (conditionValue as any[]).includes(fieldValue)
        );
      case "contains":
        return typeof fieldValue === "string" &&
          typeof conditionValue === "string"
          ? fieldValue.includes(conditionValue)
          : false;
      case "starts_with":
        return typeof fieldValue === "string" &&
          typeof conditionValue === "string"
          ? fieldValue.startsWith(conditionValue)
          : false;
      case "ends_with":
        return typeof fieldValue === "string" &&
          typeof conditionValue === "string"
          ? fieldValue.endsWith(conditionValue)
          : false;
      default:
        return false;
    }
  });

  // Both AND and OR conditions must be satisfied
  return andResult && (orConditions.length === 0 || orResult);
}

// Helper function to select specific fields from a record
function selectFields(
  record: Record<string, any>,
  select?: string[]
): Record<string, any> {
  if (!select || select.length === 0) {
    return record;
  }

  const result: Record<string, any> = {};
  select.forEach((field) => {
    if (field in record) {
      result[field] = record[field];
    }
  });
  return result;
}

// Helper function to sort records
function sortRecords<T extends Record<string, any>>(
  records: T[],
  sortBy?: { field: string; direction: "asc" | "desc" }
): T[] {
  if (!sortBy) return records;

  return [...records].sort((a, b) => {
    const aVal = a[sortBy.field];
    const bVal = b[sortBy.field];

    if (aVal === bVal) return 0;

    if (sortBy.direction === "desc") {
      return aVal > bVal ? -1 : 1;
    }
    return aVal < bVal ? -1 : 1;
  });
}

export const memoryAdapter = () => {
  return createAdapter({
    config: {
      adapterId: "memory",
      adapterName: "Memory Adapter",
      supportsNumericIds: true,
      supportsJSON: true,
      supportsDates: true,
      supportsBooleans: true,
    },
    adapter: ({ debugLog }) => {
      return {
        create: async ({ data, model, select }) => {
          debugLog("Creating record in model:", model, "with data:", data);

          // Initialize table if it doesn't exist
          if (!memoryStore[model]) {
            memoryStore[model] = [];
          }

          // Create a copy of the data to avoid mutations
          const record = { ...data } as any;

          // Add timestamps if they exist in the data
          const now = new Date();
          if ("createdAt" in record && !record.createdAt) {
            record.createdAt = now;
          }
          if ("updatedAt" in record && !record.updatedAt) {
            record.updatedAt = now;
          }

          // Add to store
          memoryStore[model].push(record);

          debugLog("Record created successfully:", record);
          return selectFields(record, select) as any;
        },

        update: async ({ model, where, update }) => {
          debugLog(
            "Updating record in model:",
            model,
            "where:",
            where,
            "with:",
            update
          );

          if (!memoryStore[model]) {
            return null;
          }

          // Find the first matching record
          const recordIndex = memoryStore[model].findIndex((record) =>
            matchesWhere(record, where)
          );

          if (recordIndex === -1) {
            return null;
          }

          // Update the record
          const updatedRecord = {
            ...memoryStore[model][recordIndex],
            ...update,
          } as any;

          // Add updatedAt if it exists in the update
          if ("updatedAt" in updatedRecord) {
            updatedRecord.updatedAt = new Date();
          }

          memoryStore[model][recordIndex] = updatedRecord;

          debugLog("Record updated successfully:", updatedRecord);
          return updatedRecord as any;
        },

        updateMany: async ({ model, where, update }) => {
          debugLog(
            "Updating many records in model:",
            model,
            "where:",
            where,
            "with:",
            update
          );

          if (!memoryStore[model]) {
            return 0;
          }

          let updatedCount = 0;
          const now = new Date();

          for (let i = 0; i < memoryStore[model].length; i++) {
            if (matchesWhere(memoryStore[model][i], where)) {
              memoryStore[model][i] = {
                ...memoryStore[model][i],
                ...update,
              };

              // Add updatedAt if it exists
              if ("updatedAt" in memoryStore[model][i]) {
                memoryStore[model][i].updatedAt = now;
              }

              updatedCount++;
            }
          }

          debugLog("Updated", updatedCount, "records");
          return updatedCount;
        },

        findOne: async ({ model, where, select }) => {
          debugLog("Finding one record in model:", model, "where:", where);

          if (!memoryStore[model]) {
            return null;
          }

          const record = memoryStore[model].find((record) =>
            matchesWhere(record, where)
          );

          if (!record) {
            return null;
          }

          const result = selectFields(record, select);
          debugLog("Found record:", result);
          return result as any;
        },

        findMany: async ({ model, where, limit, sortBy, offset }) => {
          debugLog(
            "Finding many records in model:",
            model,
            "where:",
            where,
            "limit:",
            limit,
            "offset:",
            offset
          );

          if (!memoryStore[model]) {
            return [];
          }

          let records = memoryStore[model].filter((record) =>
            matchesWhere(record, where || [])
          );

          // Sort records if sortBy is provided
          records = sortRecords(records, sortBy);

          // Apply offset
          if (offset && offset > 0) {
            records = records.slice(offset);
          }

          // Apply limit
          if (limit && limit > 0) {
            records = records.slice(0, limit);
          }

          const results = records.map((record) => selectFields(record, []));
          debugLog("Found", results.length, "records");
          return results as any[];
        },

        delete: async ({ model, where }) => {
          debugLog("Deleting record in model:", model, "where:", where);

          if (!memoryStore[model]) {
            return;
          }

          const recordIndex = memoryStore[model].findIndex((record) =>
            matchesWhere(record, where)
          );

          if (recordIndex !== -1) {
            memoryStore[model].splice(recordIndex, 1);
            debugLog("Record deleted successfully");
          }
        },

        deleteMany: async ({ model, where }) => {
          debugLog("Deleting many records in model:", model, "where:", where);

          if (!memoryStore[model]) {
            return 0;
          }

          const initialCount = memoryStore[model].length;
          memoryStore[model] = memoryStore[model].filter(
            (record) => !matchesWhere(record, where)
          );
          const deletedCount = initialCount - memoryStore[model].length;

          debugLog("Deleted", deletedCount, "records");
          return deletedCount;
        },

        count: async ({ model, where }) => {
          debugLog("Counting records in model:", model, "where:", where);

          if (!memoryStore[model]) {
            return 0;
          }

          const count = memoryStore[model].filter((record) =>
            matchesWhere(record, where || [])
          ).length;

          debugLog("Count:", count);
          return count;
        },

        options: {
          memoryStore, // Expose the store for debugging purposes
        },
      };
    },
  });
};
