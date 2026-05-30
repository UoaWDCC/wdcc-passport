import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import checkFile from "eslint-plugin-check-file";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Enforce the feature-slice file convention across the backend.
  // Every file under src/server must be named <feature>.<role>.ts(x), where
  // <feature> is kebab-case and <role> is one of:
  //   service | actions | queries | test   (per-operation files)
  //   keys | types                          (shared modules, e.g. _shared/)
  {
    files: ["src/server/**/*.{ts,tsx}"],
    plugins: { "check-file": checkFile },
    rules: {
      "check-file/filename-naming-convention": [
        "error",
        {
          "**/*.{ts,tsx}":
            "+([a-z0-9-]).+(service|actions|queries|test|keys|types)",
        },
        { ignoreMiddleExtensions: false },
      ],
      // No barrels in server/: an index.ts that re-exports a service alongside
      // its client query hooks is exactly how server-only code leaks to the client.
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
