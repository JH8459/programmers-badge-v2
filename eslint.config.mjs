import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

import { baseIgnores, baseTypeScriptRules } from "./packages/config/eslint/base.mjs";

export default tseslint.config(
  {
    ignores: baseIgnores,
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.browser,
        chrome: "readonly"
      }
    },
    rules: baseTypeScriptRules
  },
  {
    files: ["apps/extension/**/*.{ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        chrome: "readonly"
      }
    },
    rules: {
      "no-console": "off"
    }
  },
  {
    files: ["apps/api/**/*.ts"],
    rules: {
      "@typescript-eslint/consistent-type-imports": "off"
    }
  },
  {
    files: ["**/*.spec.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off"
    }
  }
);
