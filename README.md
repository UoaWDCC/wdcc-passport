# WDCC Passport

A collectible passport for WDCC events. Members sign in with Google, scan a badge QR code at an event, and each new badge earns a booster pack. Packs are opened in a 3D reveal and the cards go into a collection that can be browsed in a Pokédex-style grid or inspected with holographic shaders. Admins create events and badges and hand out the QR codes.

## How it works

1. An admin creates an **event**, then a **badge** for it (or a standalone "special" badge). Each badge gets a random 6-character code and an image uploaded to Cloudflare R2.
2. The admin shows the badge's QR code. It encodes `/home/scan?code=<code>`.
3. A member scans it (or types the code) at `/home/scan`. The badge is added to their passport and **+1 pack** is added to their balance. Scanning the same badge twice does nothing.
4. At `/home/packs` the member opens a pack: 5 cards are drawn, sorted, and added to their collection.
5. `/home/cards` shows the collection, both as a dex grid (unowned cards are listed with quantity 0) and as a Three.js viewer with fan, stack and single modes.

## Stack

- **Next.js 16** — App Router, Turbopack, React 19, Server Actions
- **Better Auth** — Google OAuth sign-in with a `role` field (`user` | `admin`)
- **Drizzle ORM** + **Neon serverless Postgres**
- **Cloudflare R2** (via `@aws-sdk/client-s3`) — badge and card images
- **TanStack Query** — client-side data fetching
- **Three.js** — card viewer and pack reveal, with GLSL holo shaders imported as strings via `raw-loader`
- **Tailwind CSS v4**
- **pnpm** — package manager, pinned via the `packageManager` field

## Getting started

Requires Node 24 (what CI uses) and pnpm.

Install deps:

```bash
pnpm install
```

Get `.env` from WDCC tech document or ask an exec to provide. 

Apply the schema to the database:

```bash
pnpm db:generate
pnpm db:migrate
```

Run the dev server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script                         | What it does                           |
| ------------------------------ | -------------------------------------- |
| `pnpm dev`                     | Start dev server                       |
| `pnpm build`                   | Production build                       |
| `pnpm start`                   | Run production build                   |
| `pnpm lint`                    | ESLint                                 |
| `pnpm typecheck`               | `tsc --noEmit`                         |
| `pnpm format` / `format:check` | Prettier write / check                 |
| `pnpm db:generate`             | Generate Drizzle migration from schema |
| `pnpm db:migrate`              | Apply migrations                       |
| `pnpm db:push`                 | Push schema directly (dev)             |
| `pnpm db:studio`               | Open Drizzle Studio                    |

## Routes

| Route          | Access | What it is                                               |
| -------------- | ------ | -------------------------------------------------------- |
| `/`            | Public | Landing page with Google sign-in |
| `/home`        | User   | Home screen                                              |
| `/home/packs`  | User   | Pack count and pack opening                              |
| `/home/cards`  | User   | Card collection                  |
| `/home/scan`   | User   | QR scanner / manual badge code entry                     |
| `/home/badges` | User   | Badges the user has earned                               |
| `/admin`       | Admin  | Create and manage events and badges, show QR codes       |

Admins are redirected from `/home/*` to `/admin`, and non-admins from `/admin` to `/home`.

## Project layout

```
src/
  app/                 # App Router routes (/, /home/*, /admin, /api/auth)
  proxy.ts             # Forwards the request path as x-pathname so guards can build ?next=
  cards/               # Three.js card engine: scene, fan/stack/single modes, shaders, input
    shaders/           # Holo GLSL (adapted from pokebox — see SOURCES.md for credit + licence)
  components/
    admin/             # Event and badge management
    badges/ cards/ packs/ scan/ home/   # Member-facing screens
    ui/                # Shared pixel-style UI (modals, dialogs)
  hooks/               # TanStack Query options, per domain
  lib/
    auth.ts            # Better Auth server config
    auth-client.ts     # Better Auth React client
    access.ts          # requireUser / requireAdmin guards
  server/
    db/                # Drizzle client, schema, migrations
    badges/ cards/ events/ packs/   # Per domain: action (server action), queries, mutations
    r2/                # R2 client and putObject / deleteObject
public/
  cards/               # Shader textures and masks
  assets/ asset/       # Pixel-art UI assets
```

## CI

`.github/workflows/ci.yaml` runs on pull requests:

- `pnpm format:check`
- `pnpm typecheck`
- `pnpm build`

`.github/workflows/production.yaml` runs on pushes to `main`: typecheck, build, then `pnpm db:migrate`, so schema changes reach the production database when they merge. Commit the generated migration (`pnpm db:generate`) with any schema change.
