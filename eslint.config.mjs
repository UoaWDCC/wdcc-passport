import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import checkFile from "eslint-plugin-check-file";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Backend convention: every file under src/server is server-only and named
  // <feature>.<role>.ts(x), kebab-case, where <role> is one of:
  //   service | actions | test   (per-operation files)
  //   types                       (shared modules, e.g. _shared/)
  // Client query hooks live in src/hooks, not here.
  {
    files: ["src/server/**/*.{ts,tsx}"],
    plugins: { "check-file": checkFile },
    rules: {
      "check-file/filename-naming-convention": [
        "error",
        {
          "**/*.{ts,tsx}": "+([a-z0-9-]).+(service|actions|test|types)",
        },
        { ignoreMiddleExtensions: false },
      ],
      // No barrels in server/: an index.ts that re-exports across the boundary
      // is exactly how server-only code leaks into a client bundle.
      "check-file/no-index": "error",
    },
  },
  // Client hooks convention: every file under src/hooks is a `use-<name>` hook
  // or a `<name>.keys` query-key module.
  {
    files: ["src/hooks/**/*.{ts,tsx}"],
    plugins: { "check-file": checkFile },
    rules: {
      "check-file/filename-naming-convention": [
        "error",
        {
          "**/*.{ts,tsx}": "@(use-+([a-z0-9-])|+([a-z0-9-]).keys)",
        },
        { ignoreMiddleExtensions: false },
      ],
      "check-file/no-index": "error",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
