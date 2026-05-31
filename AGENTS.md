<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## Known workarounds

- **kysely pinned to `0.28.17`** via `pnpm.overrides` in `package.json`. `@better-auth/kysely-adapter@1.6.12` imports `DEFAULT_MIGRATION_TABLE` from kysely, removed in 0.29. Remove override once the upstream better-auth PR is merged and released.
