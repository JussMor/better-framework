import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  outDir: "dist",
  externals: ["better-framework", "better-call"],
  entries: ["./src/index.ts"],
});
