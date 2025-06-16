// See: https://rollupjs.org/introduction/

import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";

const sharedPlugins = [
  typescript(),
  nodeResolve({ preferBuiltins: true }),
  commonjs(),
];

const config = [
  {
    input: "src/main.ts",
    output: {
      esModule: true,
      file: "dist/main.js",
      format: "es",
      sourcemap: true,
    },
    plugins: sharedPlugins,
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
  },
];

export default config;
