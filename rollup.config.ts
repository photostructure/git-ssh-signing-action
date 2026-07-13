// See: https://rollupjs.org/introduction/

import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import type { RollupOptions, WarningHandlerWithDefault } from "rollup";

const sharedPlugins = [
  typescript(),
  nodeResolve({ preferBuiltins: true }),
  commonjs(),
];

// The `@actions/*` packages ship TypeScript-transpiled CommonJS that trips two
// harmless Rollup warnings: `THIS_IS_UNDEFINED` (the `__awaiter` helper's
// top-level `this`) and a circular dependency inside `@actions/core`. Silence
// them only when they originate in node_modules so warnings from src/ still show.
const onwarn: WarningHandlerWithDefault = (warning, warn) => {
  if (
    (warning.code === "THIS_IS_UNDEFINED" ||
      warning.code === "CIRCULAR_DEPENDENCY") &&
    /node_modules/.test(warning.id ?? warning.message ?? "")
  ) {
    return;
  }
  warn(warning);
};

const config: RollupOptions[] = [
  {
    input: "src/main.ts",
    output: {
      esModule: true,
      file: "dist/main.js",
      format: "es",
      sourcemap: true,
    },
    plugins: sharedPlugins,
    onwarn,
  },
  {
    input: "src/cleanup.ts",
    output: {
      esModule: true,
      file: "dist/cleanup.js",
      format: "es",
      sourcemap: true,
    },
    plugins: sharedPlugins,
    onwarn,
  },
];

export default config;
