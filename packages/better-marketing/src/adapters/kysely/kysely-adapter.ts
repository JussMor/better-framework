/**
 * Kysely adapter implementation for Better Marketing
 */

import type { InsertQueryBuilder, Kysely, UpdateQueryBuilder } from "kysely";
import { createAdapter } from "../create-adapter";
import type { Where } from "../create-adapter/types";
import type { KyselyAdapterConfig } from "./types";

export function kyselyAdapter(
  db: Kysely<any>,
  config: KyselyAdapterConfig = {}
) {
  const { type = "sqlite", usePlural = false, debugLogs = false } = config;

  return createAdapter({
    config: {
      adapterId: "kysely",
      adapterName: "Kysely Adapter",
      usePlural,
      debugLogs: debugLogs
        ? {
            create: true,
            update: true,
            findOne: true,
            findMany: true,
            delete: true,
          }
        : undefined,
      supportsBooleans: type === "sqlite" || type === "mssql" ? false : true,
      supportsDates: type === "sqlite" || type === "mssql" ? false : true,
      supportsJSON: type === "postgres" || type === "mysql",
    },
    adapter: ({ getFieldName, schema }) => {
      /**
       * Handle returning values for different database types
       */
      async function withReturning<T>(
        values: Record<string, any>,
        builder:
          | InsertQueryBuilder<any, any, any>
          | UpdateQueryBuilder<any, string, string, any>,
        model: string,
        where: Where[] = []
      ): Promise<T> {
        let result: any;

        if (type === "mysql") {
          // MySQL doesn't support RETURNING, so we need to fetch after insert/update
          await builder.execute();

          const field = values.id
            ? "id"
            : where.length > 0 && where[0].field
              ? where[0].field
              : "id";

          if (!values.id && where.length === 0) {
            // For inserts without explicit ID, get the most recent record
            result = await db
              .selectFrom(model)
              .selectAll()
              .orderBy(getFieldName({ model, field }), "desc")
              .limit(1)
              .executeTakeFirst();
            return result;
          }

          const value = values[field] || where[0].value;
          result = await db
            .selectFrom(model)
            .selectAll()
            .where(getFieldName({ model, field }), "=", value)
            .limit(1)
            .executeTakeFirst();
          return result;
        }

        if (type === "mssql") {
          // Use OUTPUT clause for SQL Server
          result = await (builder as any)
            .outputAll("inserted")
            .executeTakeFirst();
          return result;
        }

        // PostgreSQL and SQLite support RETURNING
        result = await (builder as any).returningAll().executeTakeFirst();
        return result;
      }

      /**
       * Transform values for database storage
       */
      function transformValueToDB(
        value: any,
        model: string,
        field: string
      ): any {
        if (field === "id") return value;

        const schemaModel = Object.values(schema).find(
          (s) => s.modelName === model
        );
        if (!schemaModel) return value;

        const fieldConfig = schemaModel.fields[field];
        if (!fieldConfig) return value;

        // Handle type-specific transformations
        if (
          fieldConfig.type === "boolean" &&
          (type === "sqlite" || type === "mssql")
        ) {
          return value ? 1 : 0;
        }

        if (
          fieldConfig.type === "date" &&
          (type === "sqlite" || type === "mssql")
        ) {
          return value instanceof Date ? value.toISOString() : value;
        }

        if (
          fieldConfig.type === "json" &&
          type !== "postgres" &&
          type !== "mysql"
        ) {
          return typeof value === "object" ? JSON.stringify(value) : value;
        }

        return value;
      }

      /**
       * Transform values from database
       */
      function transformValueFromDB(
        value: any,
        model: string,
        field: string
      ): any {
        if (!value || field === "id") return value;

        const schemaModel = Object.values(schema).find(
          (s) => s.modelName === model
        );
        if (!schemaModel) return value;

        const fieldConfig = schemaModel.fields[field];
        if (!fieldConfig) return value;

        // Handle type-specific transformations
        if (
          fieldConfig.type === "boolean" &&
          (type === "sqlite" || type === "mssql")
        ) {
          return Boolean(value);
        }

        if (
          fieldConfig.type === "date" &&
          (type === "sqlite" || type === "mssql") &&
          typeof value === "string"
        ) {
          return new Date(value);
        }

        if (
          fieldConfig.type === "json" &&
          type !== "postgres" &&
          type !== "mysql" &&
          typeof value === "string"
        ) {
          try {
            return JSON.parse(value);
          } catch {
            return value;
          }
        }

        return value;
      }

      /**
       * Build WHERE clause from Where conditions
       */
      function buildWhereClause(query: any, where: Where[], model: string) {
        let result = query;

        for (const condition of where) {
          const fieldName = getFieldName({ model, field: condition.field });
          const value = transformValueToDB(
            condition.value,
            model,
            condition.field
          );

          switch (condition.operator) {
            case "eq":
              result = result.where(fieldName, "=", value);
              break;
            case "ne":
              result = result.where(fieldName, "!=", value);
              break;
            case "gt":
              result = result.where(fieldName, ">", value);
              break;
            case "gte":
              result = result.where(fieldName, ">=", value);
              break;
            case "lt":
              result = result.where(fieldName, "<", value);
              break;
            case "lte":
              result = result.where(fieldName, "<=", value);
              break;
            case "in":
              result = result.where(
                fieldName,
                "in",
                Array.isArray(value) ? value : [value]
              );
              break;
            case "nin":
              result = result.where(
                fieldName,
                "not in",
                Array.isArray(value) ? value : [value]
              );
              break;
            case "contains":
              result = result.where(fieldName, "like", `%${value}%`);
              break;
            default:
              throw new Error(`Unsupported operator: ${condition.operator}`);
          }
        }

        return result;
      }

      return {
        async create<T>(model: string, data: Partial<T>): Promise<T> {
          // Transform data for database
          const transformedData: Record<string, any> = {};
          for (const [key, value] of Object.entries(data)) {
            transformedData[getFieldName({ model, field: key })] =
              transformValueToDB(value, model, key);
          }

          const query = db.insertInto(model).values(transformedData);
          const result = await withReturning<T>(transformedData, query, model);

          // Transform result back from database
          const transformed: Record<string, any> = {};
          for (const [key, value] of Object.entries(result as any)) {
            transformed[key] = transformValueFromDB(value, model, key);
          }

          if (debugLogs) {
            console.log(`[Kysely] Created record in ${model}:`, transformed);
          }

          return transformed as T;
        },

        async findOne<T>(model: string, where: Where[]): Promise<T | null> {
          let query = db.selectFrom(model).selectAll();
          query = buildWhereClause(query, where, model);

          const result = await query.executeTakeFirst();
          if (!result) return null;

          // Transform result back from database
          const transformed: Record<string, any> = {};
          for (const [key, value] of Object.entries(result)) {
            transformed[key] = transformValueFromDB(value, model, key);
          }

          if (debugLogs) {
            console.log(`[Kysely] Found record in ${model}:`, transformed);
          }

          return transformed as T;
        },

        async findMany<T>(
          model: string,
          options: {
            where?: Where[];
            limit?: number;
            orderBy?: { field: string; direction: "asc" | "desc" };
          } = {}
        ): Promise<T[]> {
          let query = db.selectFrom(model).selectAll();

          if (options.where) {
            query = buildWhereClause(query, options.where, model);
          }

          if (options.orderBy) {
            const fieldName = getFieldName({
              model,
              field: options.orderBy.field,
            });
            query = query.orderBy(fieldName, options.orderBy.direction);
          }

          if (options.limit) {
            query = query.limit(options.limit);
          }

          const results = await query.execute();

          // Transform results back from database
          const transformed = results.map((result) => {
            const transformedResult: Record<string, any> = {};
            for (const [key, value] of Object.entries(result)) {
              transformedResult[key] = transformValueFromDB(value, model, key);
            }
            return transformedResult;
          });

          if (debugLogs) {
            console.log(
              `[Kysely] Found ${transformed.length} records in ${model}`
            );
          }

          return transformed as T[];
        },

        async update<T>(
          model: string,
          where: Where[],
          data: Partial<T>
        ): Promise<T> {
          // Transform data for database
          const transformedData: Record<string, any> = {};
          for (const [key, value] of Object.entries(data)) {
            transformedData[getFieldName({ model, field: key })] =
              transformValueToDB(value, model, key);
          }

          let query = db.updateTable(model).set(transformedData);
          query = buildWhereClause(query, where, model);

          const result = await withReturning<T>(
            transformedData,
            query,
            model,
            where
          );

          // Transform result back from database
          const transformed: Record<string, any> = {};
          for (const [key, value] of Object.entries(result as any)) {
            transformed[key] = transformValueFromDB(value, model, key);
          }

          if (debugLogs) {
            console.log(`[Kysely] Updated record in ${model}:`, transformed);
          }

          return transformed as T;
        },

        async delete(model: string, where: Where[]): Promise<void> {
          let query = db.deleteFrom(model);
          query = buildWhereClause(query, where, model);

          await query.execute();

          if (debugLogs) {
            console.log(`[Kysely] Deleted record(s) from ${model}`);
          }
        },

        async count(model: string, where: Where[] = []): Promise<number> {
          let query = db
            .selectFrom(model)
            .select(db.fn.count("id").as("count"));

          if (where.length > 0) {
            query = buildWhereClause(query, where, model);
          }

          const result = await query.executeTakeFirst();
          const count = Number(result?.count) || 0;

          if (debugLogs) {
            console.log(`[Kysely] Count in ${model}: ${count}`);
          }

          return count;
        },
      };
    },
  });
}
