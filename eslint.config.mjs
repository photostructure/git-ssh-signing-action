// See: https://eslint.org/docs/latest/use/configure/configuration-files

import js from "@eslint/js";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import jest from "eslint-plugin-jest";
import prettierRecommended from "eslint-plugin-prettier/recommended";
import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default [
  {
    ignores: ["**/coverage", "**/dist", "**/linter", "**/node_modules"],
  },
  js.configs.recommended,
  ...typescriptEslint.configs["flat/recommended"],
  jest.configs["flat/recommended"],
  prettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
        Atomics: "readonly",
        SharedArrayBuffer: "readonly",
      },

      parser: tsParser,
      ecmaVersion: 2023,
      sourceType: "module",

      parserOptions: {
        project: ["tsconfig.eslint.json", "tsconfig.rollup.json"],
        tsconfigRootDir: __dirname,
      },
    },

    rules: {
      camelcase: "off",
      "no-console": "off",
      "no-shadow": "off",
      "no-unused-vars": "off",
    },
  },
];
