/**
 * Kysely adapter types for Better Marketing
 */

export type KyselyDatabaseType = "sqlite" | "postgres" | "mysql" | "mssql";

export interface KyselyAdapterConfig {
  /**
   * Database type
   */
  type?: KyselyDatabaseType;
  /**
   * Use plural table names
   * @default false
   */
  usePlural?: boolean;
  /**
   * Enable debug logs
   * @default false
   */
  debugLogs?: boolean;
}
