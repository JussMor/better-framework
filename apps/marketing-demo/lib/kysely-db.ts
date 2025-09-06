import Database from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import path from "path";

// Create SQLite database file in the framework-demo directory
const dbPath = path.join(process.cwd(), "dev.db");
const database = new Database(dbPath);

// Create Kysely instance with SQLite dialect
export const db = new Kysely<any>({
  dialect: new SqliteDialect({
    database: database,
  }),
});
