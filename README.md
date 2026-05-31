# WDCC Passport

Auth and member portal for WDCC, built on Next.js 16 (App Router, Turbopack) with Better Auth, Drizzle ORM, and Neon Postgres.

## Stack

- **Next.js 16** — App Router, Turbopack build, React 19
- **Better Auth** — session + OAuth (Google), role-based access via `additionalFields`
- **Drizzle ORM** + **Neon serverless Postgres**
- **TanStack Query** — client-side data fetching
- **Tailwind CSS v4**
- **pnpm** — package manager (pinned via `packageManager` field)

## Getting started

Install deps:

```bash
pnpm install
```

Create `.env` at the repo root:

```env
DATABASE_URL=postgres://...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=http://localhost:3000
```

Apply schema to the database:

```bash
pnpm db:push
```

Run the dev server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script | What it does |
|--------|--------------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build |
| `pnpm start` | Run production build |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm format` / `format:check` | Prettier write / check |
| `pnpm db:generate` | Generate Drizzle migration from schema |
| `pnpm db:migrate` | Apply migrations |
| `pnpm db:push` | Push schema directly (dev) |
| `pnpm db:studio` | Open Drizzle Studio |

## Project layout

```
src/
  app/             # App Router routes
    api/auth/      # Better Auth handler
    home/          # Authed user pages
    admin/         # Admin-only pages
  components/      # Shared React components
  lib/
    auth.ts        # Better Auth server config
    auth-client.ts # Better Auth React client
    access.ts      # requireUser / requireAdmin guards
    db/            # Drizzle client, schema, migrations
```

Page protection uses the helpers in `src/lib/access.ts` — call `requireUser()` or `requireAdmin()` at the top of a server component to redirect unauthenticated or unauthorized users.

## CI

`.github/workflows/ci.yaml` runs on PRs:
- `pnpm format:check`
- `pnpm typecheck`
- `pnpm build`

Secrets (`DATABASE_URL`, `GOOGLE_CLIENT_*`, `BETTER_AUTH_*`) must be set in the repo's Actions secrets.

## Known issues

- `kysely` is pinned to `0.28.17` via `pnpm.overrides` in `package.json`. `@better-auth/kysely-adapter@1.6.12` imports `DEFAULT_MIGRATION_TABLE`, which was removed in kysely `0.29`. Remove the override once the upstream Better Auth fix is released.
