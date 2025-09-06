import { getMigrations } from "better-framework/db";
import type { SchemaGenerator } from "./types";

export const generateMigrations: SchemaGenerator = async ({
	options,
	file,
}) => {
	const { compileMigrations } = await getMigrations(options);
	const migrations = await compileMigrations();
	return {
		code: migrations.trim() === ";" ? "" : migrations,
		fileName:
			file ||
			`./better-framework-migrations/${new Date()
				.toISOString()
				.replace(/:/g, "-")}.sql`,
	};
};
