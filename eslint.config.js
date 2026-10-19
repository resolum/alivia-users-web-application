import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

const CONTEXTS = [
  "iam",
  "profiles",
  "care",
  "subscriptions",
  "support",
  "communications",
  "telemetry",
  "analytics",
];

function boundaryPatterns() {
  const internalPath = (ctx) => [
    {
      group: [`@/${ctx}/**`],
      message: `Import from '${ctx}' via its public index.ts, not internal paths.`,
    },
  ];
  const allPaths = (ctx) => [
    {
      group: [`@/${ctx}`, `@/${ctx}/**`],
      message: `src/shared must not import from the '${ctx}' context.`,
    },
  ];
  const crossContextRules = CONTEXTS.map((ctx) => ({
    files: [`src/${ctx}/**`],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: CONTEXTS.filter((c) => c !== ctx).flatMap(internalPath),
        },
      ],
    },
  }));
  const sharedRule = {
    files: ["src/shared/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: CONTEXTS.flatMap(allPaths),
        },
      ],
    },
  };
  return [...crossContextRules, sharedRule];
}

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {},
  },
  ...boundaryPatterns(),
]);
