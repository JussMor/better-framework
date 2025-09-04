import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
	outDir: "dist",
	externals: ["better-marketing", "better-call"],
	entries: ["./src/index.ts"],
});
