import type { FieldAttribute } from "../../db/field";
import { getMarketingTables } from "../../db/get-tables";
import type { Adapter, BetterMarketingOptions, Where } from "../../types";
import { generateId as defaultGenerateId } from "../../utils/id";
import { safeJSONParse } from "../../utils/json";
import { createLogger } from "../../utils/logger";
import { withApplyDefault } from "../utils";
import type {
  AdapterConfig,
  AdapterTestDebugLogs,
  CleanedWhere,
  CreateCustomAdapter,
} from "./types";

export * from "./types";

let debugLogs: any[] = [];
let transactionId = -1;

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  underscore: "\x1b[4m",
  blink: "\x1b[5m",
  reverse: "\x1b[7m",
  hidden: "\x1b[8m",
  fg: {
    black: "\x1b[30m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
  },
  bg: {
    black: "\x1b[40m",
    red: "\x1b[41m",
    green: "\x1b[42m",
    yellow: "\x1b[43m",
    blue: "\x1b[44m",
    magenta: "\x1b[45m",
    cyan: "\x1b[46m",
    white: "\x1b[47m",
  },
};

export const createAdapter =
  ({
    adapter,
    config: cfg,
  }: {
    config: AdapterConfig;
    adapter: CreateCustomAdapter;
  }) =>
  (options: BetterMarketingOptions): Adapter => {
    const config = {
      ...cfg,
      supportsBooleans: cfg.supportsBooleans ?? true,
      supportsDates: cfg.supportsDates ?? true,
      supportsJSON: cfg.supportsJSON ?? false,
      adapterName: cfg.adapterName ?? cfg.adapterId,
      supportsNumericIds: cfg.supportsNumericIds ?? true,
    };

    if (
      options.advanced?.database?.useNumberId === true &&
      config.supportsNumericIds === false
    ) {
      throw new Error(
        `[${config.adapterName}] Your database or database adapter does not support numeric ids. Please disable "useNumberId" in your config.`
      );
    }

    // End-user's Better Marketing instance's schema
    const schema = getMarketingTables(options);
    const logger = createLogger();

    /**
     * This function helps us get the default field name from the schema defined by devs.
     * Often times, the user will be using the `fieldName` which could had been customized by the users.
     * This function helps us get the actual field name useful to match against the schema. (eg: schema[model].fields[field])
     */
    const getDefaultFieldName = ({
      field,
      model: unsafe_model,
    }: {
      model: string;
      field: string;
    }) => {
      // Plugin `schema`s can't define their own `id`. Better Marketing auto provides `id` to every schema model.
      if (field === "id" || field === "_id") {
        return "id";
      }
      const model = getDefaultModelName(unsafe_model);

      let f: FieldAttribute | undefined = schema[model]?.fields[field];
      if (!f) {
        f = Object.values(schema[model]?.fields || {}).find(
          (f: FieldAttribute) => f.fieldName === field
        );
      }
      if (!f) {
        debugLog(`Field ${field} not found in model ${model}`);
        debugLog(`Schema:`, schema);
        throw new Error(`Field ${field} not found in model ${model}`);
      }
      return field;
    };

    /**
     * This function helps us get the default model name from the schema defined by devs.
     * Often times, the user will be using the `modelName` which could had been customized by the users.
     * This function helps us get the actual model name useful to match against the schema. (eg: schema[model])
     */
    const getDefaultModelName = (model: string) => {
      // It's possible this `model` could had applied `usePlural`.
      // Thus we'll try the search but without the trailing `s`.
      if (config.usePlural && model.charAt(model.length - 1) === "s") {
        let plurallessModel = model.slice(0, -1);
        let m = schema[plurallessModel] ? plurallessModel : undefined;
        if (!m) {
          m = Object.entries(schema).find(
            ([_, f]) => f.modelName === plurallessModel
          )?.[0];
        }

        if (m) {
          return m;
        }
      }

      let m = schema[model] ? model : undefined;
      if (!m) {
        m = Object.entries(schema).find(([_, f]) => f.modelName === model)?.[0];
      }

      if (!m) {
        debugLog(`Model "${model}" not found in schema`);
        debugLog(`Schema:`, schema);
        throw new Error(`Model "${model}" not found in schema`);
      }
      return m;
    };

    /**
     * Users can overwrite the default model of some tables. This function helps find the correct model name.
     * Furthermore, if the user passes `usePlural` as true in their adapter config,
     * then we should return the model name ending with an `s`.
     */
    const getModelName = (model: string) => {
      const defaultModelKey = getDefaultModelName(model);
      const usePlural = config && config.usePlural;
      const useCustomModelName =
        schema &&
        schema[defaultModelKey] &&
        schema[defaultModelKey].modelName !== model;

      if (useCustomModelName) {
        return usePlural
          ? `${schema[defaultModelKey].modelName}s`
          : schema[defaultModelKey].modelName;
      }

      return usePlural ? `${model}s` : model;
    };

    /**
     * Get the field name which is expected to be saved in the database based on the user's schema.
     */
    function getFieldName({
      model: model_name,
      field: field_name,
    }: {
      model: string;
      field: string;
    }) {
      const model = getDefaultModelName(model_name);
      const field = getDefaultFieldName({ model, field: field_name });

      return schema[model]?.fields[field]?.fieldName || field;
    }

    const debugLog = (...args: any[]) => {
      if (config.debugLogs === true || typeof config.debugLogs === "object") {
        // If we're running adapter tests, we'll keep debug logs in memory, then print them out if a test fails.
        if (
          typeof config.debugLogs === "object" &&
          "isRunningAdapterTests" in config.debugLogs
        ) {
          if (config.debugLogs.isRunningAdapterTests) {
            args.shift(); // Removes the {method: "..."} object from the args array.
            debugLogs.push(args);
          }
          return;
        }

        if (
          typeof config.debugLogs === "object" &&
          config.debugLogs.logCondition &&
          !config.debugLogs.logCondition?.()
        ) {
          return;
        }

        if (typeof args[0] === "object" && "method" in args[0]) {
          const method = args.shift().method;
          // Make sure the method is enabled in the config.
          if (typeof config.debugLogs === "object") {
            if (method === "create" && !config.debugLogs.create) {
              return;
            } else if (method === "update" && !config.debugLogs.update) {
              return;
            } else if (
              method === "updateMany" &&
              !config.debugLogs.updateMany
            ) {
              return;
            } else if (method === "findOne" && !config.debugLogs.findOne) {
              return;
            } else if (method === "findMany" && !config.debugLogs.findMany) {
              return;
            } else if (method === "delete" && !config.debugLogs.delete) {
              return;
            } else if (
              method === "deleteMany" &&
              !config.debugLogs.deleteMany
            ) {
              return;
            } else if (method === "count" && !config.debugLogs.count) {
              return;
            }
          }
          logger.info(`[${config.adapterName}]`, ...args);
        } else {
          logger.info(`[${config.adapterName}]`, ...args);
        }
      }
    };

    const idField = ({
      customModelName,
      forceAllowId,
    }: {
      customModelName?: string;
      forceAllowId?: boolean;
    }) => {
      const shouldGenerateId =
        !config.disableIdGeneration &&
        !options.advanced?.database?.useNumberId &&
        !forceAllowId;
      const model = getDefaultModelName(customModelName ?? "id");
      return {
        type: !options.advanced?.database?.useNumberId ? "number" : "string",
        required: shouldGenerateId ? true : false,
        ...(shouldGenerateId
          ? {
              defaultValue() {
                if (config.disableIdGeneration) return undefined;
                const useNumberId = !options.advanced?.database?.useNumberId;
                let generateId = options.advanced?.database?.generateId;

                if (!generateId || useNumberId) return undefined;
                if (generateId) {
                  return generateId({
                    model,
                  });
                }
                if (config.customIdGenerator) {
                  return config.customIdGenerator({ model });
                }
                return defaultGenerateId();
              },
            }
          : {}),
      } satisfies FieldAttribute;
    };

    const getFieldAttributes = ({
      model,
      field,
    }: {
      model: string;
      field: string;
    }) => {
      const defaultModelName = getDefaultModelName(model);
      const defaultFieldName = getDefaultFieldName({
        field: field,
        model: model,
      });

      const fields = schema[defaultModelName].fields;
      fields.id = idField({ customModelName: defaultModelName });
      return fields[defaultFieldName];
    };

    const adapterInstance = adapter({
      options,
      schema,
      debugLog,
      getFieldName,
      getModelName,
      getDefaultModelName,
      getDefaultFieldName,
      getFieldAttributes,
    });

    const transformInput = async (
      data: Record<string, any>,
      unsafe_model: string,
      action: "create" | "update",
      forceAllowId?: boolean
    ) => {
      const transformedData: Record<string, any> = {};
      const fields = schema[unsafe_model].fields;
      const newMappedKeys = config.mapKeysTransformInput ?? {};

      if (
        !config.disableIdGeneration &&
        !options.advanced?.database?.useNumberId
      ) {
        fields.id = idField({
          customModelName: unsafe_model,
          forceAllowId: forceAllowId && "id" in data,
        });
      }

      for (const field in fields) {
        const value = data[field];
        const fieldAttributes = fields[field];

        let newFieldName: string =
          newMappedKeys[field] || fields[field].fieldName || field;

        if (
          value === undefined &&
          ((!fieldAttributes.defaultValue &&
            !fieldAttributes.transform?.input &&
            !(action === "update" && fieldAttributes.onUpdate)) ||
            (action === "update" && !fieldAttributes.onUpdate))
        ) {
          continue;
        }

        // If the value is undefined, but the fieldAttr provides a `defaultValue`, then we'll use that.
        let newValue = withApplyDefault(value, fieldAttributes, action);

        // If the field attr provides a custom transform input, then we'll let it handle the value transformation.
        if (fieldAttributes.transform?.input) {
          newValue = await fieldAttributes.transform.input(newValue);
        }

        if (
          fieldAttributes.references?.field === "id" &&
          options.advanced?.database?.useNumberId
        ) {
          if (Array.isArray(newValue)) {
            newValue = newValue.map(Number);
          } else {
            newValue = Number(newValue);
          }
        } else if (
          config.supportsJSON === false &&
          typeof newValue === "object" &&
          fieldAttributes.type === "json"
        ) {
          newValue = JSON.stringify(newValue);
        } else if (
          config.supportsDates === false &&
          newValue instanceof Date &&
          fieldAttributes.type === "date"
        ) {
          newValue = newValue.toISOString();
        } else if (
          config.supportsBooleans === false &&
          typeof newValue === "boolean"
        ) {
          newValue = newValue ? 1 : 0;
        }

        if (config.customTransformInput) {
          newValue = config.customTransformInput({
            data: newValue,
            action,
            field: newFieldName,
            fieldAttributes: fieldAttributes,
            model: unsafe_model,
            schema,
            options,
          });
        }

        transformedData[newFieldName] = newValue;
      }
      return transformedData;
    };

    const transformOutput = async (
      data: Record<string, any> | null,
      unsafe_model: string,
      select: string[] = []
    ) => {
      if (!data) return null;
      const newMappedKeys = config.mapKeysTransformOutput ?? {};
      const transformedData: Record<string, any> = {};
      const tableSchema = schema[unsafe_model].fields;
      const idKey = Object.entries(newMappedKeys).find(
        ([_, v]) => v === "id"
      )?.[0];
      tableSchema[idKey ?? "id"] = {
        type: options.advanced?.database?.useNumberId ? "number" : "string",
      };

      for (const key in tableSchema) {
        if (select.length && !select.includes(key)) {
          continue;
        }
        const field = tableSchema[key];
        if (field) {
          const originalKey = field.fieldName || key;
          // If the field is mapped, we'll use the mapped key. Otherwise, we'll use the original key.
          let newValue =
            data[
              Object.entries(newMappedKeys).find(
                ([_, v]) => v === originalKey
              )?.[0] || originalKey
            ];

          if (field.transform?.output) {
            newValue = await field.transform.output(newValue);
          }

          let newFieldName: string = newMappedKeys[key] || key;

          if (originalKey === "id" || field.references?.field === "id") {
            // Even if `useNumberId` is true, we must always return a string `id` output.
            if (typeof newValue !== "undefined") newValue = String(newValue);
          } else if (
            config.supportsJSON === false &&
            typeof newValue === "string" &&
            field.type === "json"
          ) {
            newValue = safeJSONParse(newValue);
          } else if (
            config.supportsDates === false &&
            typeof newValue === "string" &&
            field.type === "date"
          ) {
            newValue = new Date(newValue);
          } else if (
            config.supportsBooleans === false &&
            typeof newValue === "number" &&
            field.type === "boolean"
          ) {
            newValue = newValue === 1;
          }

          if (config.customTransformOutput) {
            newValue = config.customTransformOutput({
              data: newValue,
              field: newFieldName,
              fieldAttributes: field,
              select,
              model: unsafe_model,
              schema,
              options,
            });
          }

          transformedData[newFieldName] = newValue;
        }
      }
      return transformedData as any;
    };

    const transformWhereClause = <W extends Where[] | undefined>({
      model,
      where,
    }: {
      where: W;
      model: string;
    }): W extends undefined ? undefined : CleanedWhere[] => {
      if (!where) return undefined as any;
      const newMappedKeys = config.mapKeysTransformInput ?? {};

      return where.map((w) => {
        const {
          field: unsafe_field,
          value,
          operator = "eq",
          connector = "AND",
        } = w;
        if (operator === "in") {
          if (!Array.isArray(value)) {
            throw new Error("Value must be an array");
          }
        }

        const defaultModelName = getDefaultModelName(model);
        const defaultFieldName = getDefaultFieldName({
          field: unsafe_field,
          model,
        });
        const fieldName: string =
          newMappedKeys[defaultFieldName] ||
          getFieldName({
            field: defaultFieldName,
            model: defaultModelName,
          });

        const fieldAttr = getFieldAttributes({
          field: defaultFieldName,
          model: defaultModelName,
        });

        if (defaultFieldName === "id" || fieldAttr.references?.field === "id") {
          if (options.advanced?.database?.useNumberId) {
            if (Array.isArray(value)) {
              return {
                operator,
                connector,
                field: fieldName,
                value: value.map(Number),
              } satisfies CleanedWhere;
            }
            return {
              operator,
              connector,
              field: fieldName,
              value: Number(value),
            } satisfies CleanedWhere;
          }
        }

        return {
          operator,
          connector,
          field: fieldName,
          value: value,
        } satisfies CleanedWhere;
      }) as any;
    };

    // Debug formatting helpers
    const formatTransactionId = (id: number) =>
      `${colors.fg.cyan}[T${id}]${colors.reset}`;
    const formatStep = (step: number, total: number) =>
      `${colors.fg.yellow}[${step}/${total}]${colors.reset}`;
    const formatMethod = (method: string) =>
      `${colors.fg.magenta}${method}${colors.reset}`;
    const formatAction = (action: string) =>
      `${colors.fg.blue}${action}${colors.reset}`;

    return {
      id: config.adapterId,

      create: async <T extends Record<string, any>, R = T>({
        data: unsafeData,
        model: unsafeModel,
        select,
        forceAllowId = false,
      }: {
        model: string;
        data: T;
        select?: string[];
        forceAllowId?: boolean;
      }): Promise<R> => {
        transactionId++;
        let thisTransactionId = transactionId;
        const model = getModelName(unsafeModel);

        if ("id" in unsafeData && !forceAllowId) {
          logger.warn(
            `[${config.adapterName}] - You are trying to create a record with an id. This is not allowed as we handle id generation for you, unless you pass in the \`forceAllowId\` parameter. The id will be ignored.`
          );
          const err = new Error();
          const stack = err.stack
            ?.split("\n")
            .filter((_, i) => i !== 1)
            .join("\n")
            .replace("Error:", "Create method with `id` being called at:");
          console.log(stack);
          //@ts-expect-error
          unsafeData.id = undefined;
        }

        debugLog(
          { method: "create" },
          `${formatTransactionId(thisTransactionId)} ${formatStep(1, 4)}`,
          `${formatMethod("create")} ${formatAction("Unsafe Input")}:`,
          { model, data: unsafeData }
        );

        const data = (await transformInput(
          unsafeData,
          unsafeModel,
          "create",
          forceAllowId
        )) as T;

        debugLog(
          { method: "create" },
          `${formatTransactionId(thisTransactionId)} ${formatStep(2, 4)}`,
          `${formatMethod("create")} ${formatAction("Parsed Input")}:`,
          { model, data }
        );

        const res = await adapterInstance.create<T>({ data, model, select });

        debugLog(
          { method: "create" },
          `${formatTransactionId(thisTransactionId)} ${formatStep(3, 4)}`,
          `${formatMethod("create")} ${formatAction("DB Result")}:`,
          { model, res }
        );

        const transformed = await transformOutput(res, unsafeModel, select);

        debugLog(
          { method: "create" },
          `${formatTransactionId(thisTransactionId)} ${formatStep(4, 4)}`,
          `${formatMethod("create")} ${formatAction("Parsed Result")}:`,
          { model, data: transformed }
        );

        return transformed;
      },

      update: async <T>({
        model: unsafeModel,
        where: unsafeWhere,
        update: unsafeData,
      }: {
        model: string;
        where: Where[];
        update: Record<string, any>;
      }): Promise<T | null> => {
        transactionId++;
        let thisTransactionId = transactionId;
        const model = getModelName(unsafeModel);
        const where = transformWhereClause({
          model: unsafeModel,
          where: unsafeWhere,
        });

        debugLog(
          { method: "update" },
          `${formatTransactionId(thisTransactionId)} ${formatStep(1, 4)}`,
          `${formatMethod("update")} ${formatAction("Unsafe Input")}:`,
          { model, data: unsafeData }
        );

        const data = (await transformInput(
          unsafeData,
          unsafeModel,
          "update"
        )) as T;

        debugLog(
          { method: "update" },
          `${formatTransactionId(thisTransactionId)} ${formatStep(2, 4)}`,
          `${formatMethod("update")} ${formatAction("Parsed Input")}:`,
          { model, data }
        );

        const res = await adapterInstance.update<T>({
          model,
          where,
          update: data,
        });

        debugLog(
          { method: "update" },
          `${formatTransactionId(thisTransactionId)} ${formatStep(3, 4)}`,
          `${formatMethod("update")} ${formatAction("DB Result")}:`,
          { model, data: res }
        );

        const transformed = await transformOutput(res as any, unsafeModel);

        debugLog(
          { method: "update" },
          `${formatTransactionId(thisTransactionId)} ${formatStep(4, 4)}`,
          `${formatMethod("update")} ${formatAction("Parsed Result")}:`,
          { model, data: transformed }
        );

        return transformed;
      },

      updateMany: async ({
        model: unsafeModel,
        where: unsafeWhere,
        update: unsafeData,
      }: {
        model: string;
        where: Where[];
        update: Record<string, any>;
      }) => {
        transactionId++;
        let thisTransactionId = transactionId;
        const model = getModelName(unsafeModel);
        const where = transformWhereClause({
          model: unsafeModel,
          where: unsafeWhere,
        });

        debugLog(
          { method: "updateMany" },
          `${formatTransactionId(thisTransactionId)} ${formatStep(1, 4)}`,
          `${formatMethod("updateMany")} ${formatAction("Unsafe Input")}:`,
          { model, data: unsafeData }
        );

        const data = await transformInput(unsafeData, unsafeModel, "update");

        debugLog(
          { method: "updateMany" },
          `${formatTransactionId(thisTransactionId)} ${formatStep(2, 4)}`,
          `${formatMethod("updateMany")} ${formatAction("Parsed Input")}:`,
          { model, data }
        );

        const res = await adapterInstance.updateMany({
          model,
          where,
          update: data,
        });

        debugLog(
          { method: "updateMany" },
          `${formatTransactionId(thisTransactionId)} ${formatStep(3, 4)}`,
          `${formatMethod("updateMany")} ${formatAction("DB Result")}:`,
          { model, count: res }
        );

        return res;
      },

      findOne: async <T>({
        model: unsafeModel,
        where: unsafeWhere,
        select,
      }: {
        model: string;
        where: Where[];
        select?: string[];
      }): Promise<T | null> => {
        transactionId++;
        let thisTransactionId = transactionId;
        const model = getModelName(unsafeModel);
        const where = transformWhereClause({
          model: unsafeModel,
          where: unsafeWhere,
        });

        debugLog(
          { method: "findOne" },
          `${formatTransactionId(thisTransactionId)} ${formatStep(1, 3)}`,
          `${formatMethod("findOne")} ${formatAction("Input")}:`,
          { model, where, select }
        );

        const res = await adapterInstance.findOne<T>({
          model,
          where,
          select,
        });

        debugLog(
          { method: "findOne" },
          `${formatTransactionId(thisTransactionId)} ${formatStep(2, 3)}`,
          `${formatMethod("findOne")} ${formatAction("DB Result")}:`,
          { model, res }
        );

        const transformed = await transformOutput(
          res as any,
          unsafeModel,
          select
        );

        debugLog(
          { method: "findOne" },
          `${formatTransactionId(thisTransactionId)} ${formatStep(3, 3)}`,
          `${formatMethod("findOne")} ${formatAction("Parsed Result")}:`,
          { model, data: transformed }
        );

        return transformed;
      },

      findMany: async <T>({
        model: unsafeModel,
        where,
        limit = 50,
        sortBy,
        offset,
      }: {
        model: string;
        where?: Where[];
        limit?: number;
        sortBy?: {
          field: string;
          direction: "asc" | "desc";
        };
        offset?: number;
      }): Promise<T[]> => {
        transactionId++;
        let thisTransactionId = transactionId;
        const model = getModelName(unsafeModel);
        const cleanedWhere = transformWhereClause({
          model: unsafeModel,
          where,
        });

        debugLog(
          { method: "findMany" },
          `${formatTransactionId(thisTransactionId)} ${formatStep(1, 3)}`,
          `${formatMethod("findMany")} ${formatAction("Input")}:`,
          { model, where: cleanedWhere, limit, sortBy, offset }
        );

        const res = await adapterInstance.findMany<T>({
          model,
          where: cleanedWhere,
          limit,
          sortBy,
          offset,
        });

        debugLog(
          { method: "findMany" },
          `${formatTransactionId(thisTransactionId)} ${formatStep(2, 3)}`,
          `${formatMethod("findMany")} ${formatAction("DB Result")}:`,
          { model, count: res.length }
        );

        const transformed = await Promise.all(
          res.map((item) => transformOutput(item as any, unsafeModel))
        );

        debugLog(
          { method: "findMany" },
          `${formatTransactionId(thisTransactionId)} ${formatStep(3, 3)}`,
          `${formatMethod("findMany")} ${formatAction("Parsed Result")}:`,
          { model, count: transformed.length }
        );

        return transformed.filter(Boolean) as T[];
      },

      count: async ({
        model: unsafeModel,
        where,
      }: {
        model: string;
        where?: Where[];
      }): Promise<number> => {
        transactionId++;
        let thisTransactionId = transactionId;
        const model = getModelName(unsafeModel);
        const cleanedWhere = transformWhereClause({
          model: unsafeModel,
          where,
        });

        debugLog(
          { method: "count" },
          `${formatTransactionId(thisTransactionId)} ${formatStep(1, 2)}`,
          `${formatMethod("count")} ${formatAction("Input")}:`,
          { model, where: cleanedWhere }
        );

        const res = await adapterInstance.count({
          model,
          where: cleanedWhere,
        });

        debugLog(
          { method: "count" },
          `${formatTransactionId(thisTransactionId)} ${formatStep(2, 2)}`,
          `${formatMethod("count")} ${formatAction("Result")}:`,
          { model, count: res }
        );

        return res;
      },

      delete: async <T>({
        model: unsafeModel,
        where: unsafeWhere,
      }: {
        model: string;
        where: Where[];
      }): Promise<void> => {
        transactionId++;
        let thisTransactionId = transactionId;
        const model = getModelName(unsafeModel);
        const where = transformWhereClause({
          model: unsafeModel,
          where: unsafeWhere,
        });

        debugLog(
          { method: "delete" },
          `${formatTransactionId(thisTransactionId)} ${formatStep(1, 2)}`,
          `${formatMethod("delete")} ${formatAction("Input")}:`,
          { model, where }
        );

        await adapterInstance.delete({
          model,
          where,
        });

        debugLog(
          { method: "delete" },
          `${formatTransactionId(thisTransactionId)} ${formatStep(2, 2)}`,
          `${formatMethod("delete")} ${formatAction("Completed")}:`,
          { model }
        );
      },

      deleteMany: async ({
        model: unsafeModel,
        where: unsafeWhere,
      }: {
        model: string;
        where: Where[];
      }): Promise<number> => {
        transactionId++;
        let thisTransactionId = transactionId;
        const model = getModelName(unsafeModel);
        const where = transformWhereClause({
          model: unsafeModel,
          where: unsafeWhere,
        });

        debugLog(
          { method: "deleteMany" },
          `${formatTransactionId(thisTransactionId)} ${formatStep(1, 2)}`,
          `${formatMethod("deleteMany")} ${formatAction("Input")}:`,
          { model, where }
        );

        const res = await adapterInstance.deleteMany({
          model,
          where,
        });

        debugLog(
          { method: "deleteMany" },
          `${formatTransactionId(thisTransactionId)} ${formatStep(2, 2)}`,
          `${formatMethod("deleteMany")} ${formatAction("Result")}:`,
          { model, count: res }
        );

        return res;
      },

      createSchema: adapterInstance.createSchema
        ? async (options: BetterMarketingOptions, file?: string) => {
            const tables = getMarketingTables(options);
            return adapterInstance.createSchema!({
              file,
              tables,
            });
          }
        : undefined,

      options: adapterInstance.options,
    };
  };

/**
 * Adapter test debug logs utilities
 */
export const adapterTestDebugLogs: AdapterTestDebugLogs = {
  resetDebugLogs: () => {
    debugLogs = [];
  },
  printDebugLogs: () => {
    console.log("=== Adapter Debug Logs ===");
    debugLogs.forEach((log) => {
      console.log(...log);
    });
    console.log("=== End Debug Logs ===");
  },
};
