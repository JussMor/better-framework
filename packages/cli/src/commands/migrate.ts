import { logger } from "better-framework";
import { getAdapter, getMigrations } from "better-framework/db";
import chalk from "chalk";
import { Command } from "commander";
import { existsSync } from "fs";
import fs from "fs/promises";
import path from "path";
import prompts from "prompts";
import yoctoSpinner from "yocto-spinner";
import * as z from "zod/v4";
import { getConfig } from "../utils/get-config";

export async function migrateAction(opts: any) {
  const options = z
    .object({
      cwd: z.string(),
      config: z.string().optional(),
      y: z.boolean().optional(),
      yes: z.boolean().optional(),
    })
    .parse(opts);

  const cwd = path.resolve(options.cwd);
  if (!existsSync(cwd)) {
    logger.error(`The directory "${cwd}" does not exist.`);
    process.exit(1);
  }

  const config = await getConfig({
    cwd,
    configPath: options.config,
  });
  if (!config) {
    logger.error(
      "No configuration file found. Add a `framework.ts` file to your project or pass the path to the configuration file using the `--config` flag."
    );
    return;
  }

  const db = await getAdapter(config);

  if (!db) {
    logger.error(
      "Invalid database configuration. Make sure you're not using adapters. Migrate command only works with built-in Kysely adapter."
    );
    process.exit(1);
  }

  if (db.id !== "kysely") {
    if (db.id === "prisma") {
      logger.error(
        "The migrate command only works with the built-in Kysely adapter. For Prisma, run `npx @better-auth/cli generate` to create the schema, then use Prisma's migrate or push to apply it."
      );
      process.exit(0);
    }
    if (db.id === "drizzle") {
      logger.error(
        "The migrate command only works with the built-in Kysely adapter. For Drizzle, run `npx @better-auth/cli generate` to create the schema, then use Drizzle's migrate or push to apply it."
      );
      process.exit(0);
    }
    logger.error("Migrate command isn't supported for this adapter.");
    process.exit(1);
  }

  const spinner = yoctoSpinner({ text: "preparing migration..." }).start();

  const { toBeAdded, toBeCreated, runMigrations, compileMigrations } =
    await getMigrations(config);

  if (!toBeAdded.length && !toBeCreated.length) {
    spinner.stop();
    logger.info("🚀 No migrations needed.");
    process.exit(0);
  }

  spinner.stop();
  logger.info(`🔑 The migration will affect the following:`);

  for (const table of [...toBeCreated, ...toBeAdded]) {
    console.log(
      "->",
      chalk.magenta(Object.keys(table.fields).join(", ")),
      chalk.white("fields on"),
      chalk.yellow(`${table.table}`),
      chalk.white("table.")
    );
  }

  if (options.y) {
    console.warn("WARNING: --y is deprecated. Consider -y or --yes");
    options.yes = true;
  }

  let migrate = options.yes;
  if (!migrate) {
    const response = await prompts({
      type: "confirm",
      name: "migrate",
      message: "Are you sure you want to run these migrations?",
      initial: false,
    });
    migrate = response.migrate;
  }

  if (!migrate) {
    logger.info("Migration cancelled.");
    process.exit(0);
  }

  spinner?.start("migrating...");

  // Generate timestamped migration file
  if (toBeAdded.length || toBeCreated.length) {
    const timestamp = new Date()
      .toISOString()
      .replace(/[-T:.Z]/g, "")
      .slice(0, 14);
    const migrationDir = path.join(cwd, "better-framework_migrations");
    const migrationFile = path.join(
      migrationDir,
      `${timestamp}_auto_migration.sql`
    );

    // Ensure migration directory exists
    await fs.mkdir(migrationDir, { recursive: true });

    // Compile and write migration SQL
    const sql = await compileMigrations();
    const migrationContent = `-- Migration: ${timestamp}_auto_migration
-- Created: ${new Date().toISOString()}
-- Description: Auto-generated migration

${sql}`;

    await fs.writeFile(migrationFile, migrationContent, "utf8");
    logger.info(
      `📝 Migration file created: ${path.relative(cwd, migrationFile)}`
    );
  }

  await runMigrations();
  spinner.stop();
  logger.info("🚀 migration was completed successfully!");
  process.exit(0);
}

export const migrate = new Command("migrate")
  .option(
    "-c, --cwd <cwd>",
    "the working directory. defaults to the current directory.",
    process.cwd()
  )
  .option(
    "--config <config>",
    "the path to the configuration file. defaults to the first configuration file found."
  )
  .option(
    "-y, --yes",
    "automatically accept and run migrations without prompting",
    false
  )
  .option("--y", "(deprecated) same as --yes", false)
  .action(migrateAction);
