import js from "@eslint/js";
import { fixupPluginRules } from "@eslint/compat";
import tseslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import hooksPlugin from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import importPlugin from "eslint-plugin-import";
import prettierPlugin from "eslint-plugin-prettier";
import security from "eslint-plugin-security";
import globals from "globals";

export default [
  {
    ignores: [
      "node_modules/",
      "dist/",
      "build/",
      ".next/",
      "out/",
      "target/",
      "*.config.js",
      "*.config.mjs",
      "packages/types/",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
    },
    plugins: {
      react: fixupPluginRules(reactPlugin),
      "react-hooks": fixupPluginRules(hooksPlugin),
      "jsx-a11y": fixupPluginRules(jsxA11y),
      import: fixupPluginRules(importPlugin),
      prettier: prettierPlugin,
      security,
    },
    settings: {
      react: { version: "detect" },
      "import/resolver": {
        typescript: {},
        node: { extensions: [".js", ".jsx", ".ts", ".tsx"] },
      },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...hooksPlugin.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      ...prettierPlugin.configs.recommended.rules,
      ...security.configs.recommended.rules,

      // TypeScript
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/prefer-nullish-coalescing": "off",
      "@typescript-eslint/prefer-optional-chain": "off",

      // Import ordering
      "import/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
          ],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
      "import/no-duplicates": "error",

      // Security
      "security/detect-object-injection": "warn",
      "security/detect-non-literal-regexp": "warn",
      "security/detect-unsafe-regex": "error",
      "security/detect-buffer-noassert": "error",
      "security/detect-child-process": "warn",
      "security/detect-disable-mustache-escape": "error",
      "security/detect-eval-with-expression": "error",
      "security/detect-no-csrf-before-method-override": "error",
      "security/detect-non-literal-fs-filename": "warn",
      "security/detect-non-literal-require": "warn",
      "security/detect-possible-timing-attacks": "warn",
      "security/detect-pseudoRandomBytes": "error",

      // General
      "no-console": "warn",
      "prefer-const": "error",
      "no-var": "error",
    },
  },
  // Plain JS/MJS files
  {
    files: ["**/*.js", "**/*.mjs"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
      },
    },
  },
  // Marketing app overrides
  {
    files: ["apps/marketing/**/*.{ts,tsx}"],
    rules: {
      "react/react-in-jsx-scope": "off",
      "import/order": "off",
      "react/no-unescaped-entities": "off",
      "prettier/prettier": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "security/detect-object-injection": "warn",
      "jsx-a11y/click-events-have-key-events": "warn",
      "jsx-a11y/no-static-element-interactions": "warn",
    },
  },
];
