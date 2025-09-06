import babelPresetReact from "@babel/preset-react";
import babelPresetTypeScript from "@babel/preset-typescript";
import type { BetterFrameworkOptions } from "better-framework";
import { BetterFrameworkError, logger } from "better-framework";
import { loadConfig } from "c12";
import fs, { existsSync } from "fs";
import path from "path";
import { addSvelteKitEnvModules } from "./add-svelte-kit-env-modules";
import { getTsconfigInfo } from "./get-tsconfig-info";

let possiblePaths = [
  "framework.ts",
  "framework.tsx",
  "framework.js",
  "framework.jsx",
  "framework.server.js",
  "framework.server.ts",
  // Backward compatibility
  "marketing.ts",
  "marketing.tsx",
  "marketing.js",
  "marketing.jsx",
  "marketing.server.js",
  "marketing.server.ts",
];

possiblePaths = [
  ...possiblePaths,
  ...possiblePaths.map((it) => `lib/server/${it}`),
  ...possiblePaths.map((it) => `server/${it}`),
  ...possiblePaths.map((it) => `lib/${it}`),
  ...possiblePaths.map((it) => `utils/${it}`),
];
possiblePaths = [
  ...possiblePaths,
  ...possiblePaths.map((it) => `src/${it}`),
  ...possiblePaths.map((it) => `app/${it}`),
];

function resolveReferencePath(configDir: string, refPath: string): string {
  const resolvedPath = path.resolve(configDir, refPath);

  // If it ends with .json, treat as direct file reference
  if (refPath.endsWith(".json")) {
    return resolvedPath;
  }

  // If the exact path exists and is a file, use it
  if (fs.existsSync(resolvedPath)) {
    try {
      const stats = fs.statSync(resolvedPath);
      if (stats.isFile()) {
        return resolvedPath;
      }
    } catch {
      // Fall through to directory handling
    }
  }

  // Otherwise, assume directory reference
  return path.resolve(configDir, refPath, "tsconfig.json");
}

function getPathAliasesRecursive(
  tsconfigPath: string,
  visited = new Set<string>()
): Record<string, string> {
  if (visited.has(tsconfigPath)) {
    return {};
  }
  visited.add(tsconfigPath);

  if (!fs.existsSync(tsconfigPath)) {
    logger.warn(`Referenced tsconfig not found: ${tsconfigPath}`);
    return {};
  }

  try {
    const tsConfig = getTsconfigInfo(undefined, tsconfigPath);
    const { paths = {}, baseUrl = "." } = tsConfig.compilerOptions || {};
    const result: Record<string, string> = {};

    const configDir = path.dirname(tsconfigPath);
    const obj = Object.entries(paths) as [string, string[]][];
    for (const [alias, aliasPaths] of obj) {
      for (const aliasedPath of aliasPaths) {
        const resolvedBaseUrl = path.resolve(configDir, baseUrl);
        const finalAlias = alias.slice(-1) === "*" ? alias.slice(0, -1) : alias;
        const finalAliasedPath =
          aliasedPath.slice(-1) === "*"
            ? aliasedPath.slice(0, -1)
            : aliasedPath;

        result[finalAlias || ""] = path.join(resolvedBaseUrl, finalAliasedPath);
      }
    }

    if (tsConfig.references) {
      for (const ref of tsConfig.references) {
        const refPath = resolveReferencePath(configDir, ref.path);
        const refAliases = getPathAliasesRecursive(refPath, visited);
        for (const [alias, aliasPath] of Object.entries(refAliases)) {
          if (!(alias in result)) {
            result[alias] = aliasPath;
          }
        }
      }
    }

    return result;
  } catch (error) {
    logger.warn(`Error parsing tsconfig at ${tsconfigPath}: ${error}`);
    return {};
  }
}

function getPathAliases(cwd: string): Record<string, string> | null {
  const tsConfigPath = path.join(cwd, "tsconfig.json");
  if (!fs.existsSync(tsConfigPath)) {
    return null;
  }
  try {
    const result = getPathAliasesRecursive(tsConfigPath);
    addSvelteKitEnvModules(result);
    return result;
  } catch (error) {
    console.error(error);
    throw new BetterFrameworkError("Error parsing tsconfig.json");
  }
}
/**
 * .tsx files are not supported by Jiti.
 */
const jitiOptions = (cwd: string): any => {
  const alias = getPathAliases(cwd) || {};
  return {
    transformOptions: {
      babel: {
        presets: [
          [
            babelPresetTypeScript,
            {
              isTSX: true,
              allExtensions: true,
            },
          ],
          [babelPresetReact, { runtime: "automatic" }],
        ],
      },
    },
    extensions: [".ts", ".tsx", ".js", ".jsx"],
    alias,
  };
};

const isDefaultExport = (object: Record<string, unknown>) => {
  return (
    typeof object === "object" &&
    object !== null &&
    !Array.isArray(object) &&
    Object.keys(object).length > 0 &&
    "options" in object
  );
};
export async function getConfig({
  cwd,
  configPath,
  shouldThrowOnError = false,
}: {
  cwd: string;
  configPath?: string;
  shouldThrowOnError?: boolean;
}) {
  try {
    let configFile: BetterFrameworkOptions | null = null;
    if (configPath) {
      let resolvedPath: string = path.join(cwd, configPath);
      if (existsSync(configPath)) resolvedPath = configPath; // If the configPath is a file, use it as is, as it means the path wasn't relative.
      const { config } = await loadConfig<
        | {
            framework: {
              options: BetterFrameworkOptions;
            };
          }
        | {
            marketing: {
              options: BetterFrameworkOptions;
            };
          }
        | {
            options: BetterFrameworkOptions;
          }
      >({
        configFile: resolvedPath,
        dotenv: true,
        jitiOptions: jitiOptions(cwd),
      });
      if (
        !("marketing" in config) &&
        !("framework" in config) &&
        !isDefaultExport(config)
      ) {
        if (shouldThrowOnError) {
          throw new Error(
            `Couldn't read your framework config in ${resolvedPath}. Make sure to default export your framework instance or to export as a variable named framework or marketing.`
          );
        }
        logger.error(
          `[#better-framework]: Couldn't read your framework config in ${resolvedPath}. Make sure to default export your framework instance or to export as a variable named framework or marketing.`
        );
        process.exit(1);
      }
      configFile =
        "framework" in config
          ? config.framework?.options
          : "marketing" in config
            ? config.marketing?.options
            : config.options;
    }

    if (!configFile) {
      for (const possiblePath of possiblePaths) {
        try {
          const { config } = await loadConfig<{
            marketing: {
              options: BetterFrameworkOptions;
            };
            default?: {
              options: BetterFrameworkOptions;
            };
          }>({
            configFile: possiblePath,
            jitiOptions: jitiOptions(cwd),
          });
          const hasConfig = Object.keys(config).length > 0;
          if (hasConfig) {
            configFile =
              config.marketing?.options || config.default?.options || null;
            if (!configFile) {
              if (shouldThrowOnError) {
                throw new Error(
                  "Couldn't read your marketing config. Make sure to default export your marketing instance or to export as a variable named marketing."
                );
              }
              logger.error(
                "[#better-marketing]: Couldn't read your marketing config."
              );
              console.log("");
              logger.info(
                "[#better-marketing]: Make sure to default export your marketing instance or to export as a variable named marketing."
              );
              process.exit(1);
            }
            break;
          }
        } catch (e) {
          if (
            typeof e === "object" &&
            e &&
            "message" in e &&
            typeof e.message === "string" &&
            e.message.includes(
              "This module cannot be imported from a Client Component module"
            )
          ) {
            if (shouldThrowOnError) {
              throw new Error(
                `Please remove import 'server-only' from your marketing config file temporarily. The CLI cannot resolve the configuration with it included. You can re-add it after running the CLI.`
              );
            }
            logger.error(
              `Please remove import 'server-only' from your marketing config file temporarily. The CLI cannot resolve the configuration with it included. You can re-add it after running the CLI.`
            );
            process.exit(1);
          }
          if (shouldThrowOnError) {
            throw e;
          }
          logger.error(
            "[#better-marketing]: Couldn't read your marketing config.",
            e
          );
          process.exit(1);
        }
      }
    }
    return configFile;
  } catch (e) {
    if (
      typeof e === "object" &&
      e &&
      "message" in e &&
      typeof e.message === "string" &&
      e.message.includes(
        "This module cannot be imported from a Client Component module"
      )
    ) {
      if (shouldThrowOnError) {
        throw new Error(
          `Please remove import 'server-only' from your marketing config file temporarily. The CLI cannot resolve the configuration with it included. You can re-add it after running the CLI.`
        );
      }
      logger.error(
        `Please remove import 'server-only' from your marketing config file temporarily. The CLI cannot resolve the configuration with it included. You can re-add it after running the CLI.`
      );
      process.exit(1);
    }
    if (shouldThrowOnError) {
      throw e;
    }

    logger.error("Couldn't read your marketing config.", e);
    process.exit(1);
  }
}

export { possiblePaths };
