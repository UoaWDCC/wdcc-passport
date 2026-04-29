# Commands

## Development

| Command      | Description                  |
| ------------ | ---------------------------- |
| `pnpm dev`   | Start the development server |
| `pnpm build` | Build for production         |
| `pnpm start` | Start the production server  |

## Code Quality

| Command             | Description                  |
| ------------------- | ---------------------------- |
| `pnpm lint`         | Check for ESLint issues      |
| `pnpm lint:fix`     | Auto-fix ESLint issues       |
| `pnpm format:check` | Check Prettier formatting    |
| `pnpm format`       | Auto-fix Prettier formatting |
| `pnpm typecheck`    | Run TypeScript type checking |
| `pnpm check`        |                              |

## Database

| Command            | Description                                    |
| ------------------ | ---------------------------------------------- |
| `pnpm db:start`    | Start the local Docker Postgres database       |
| `pnpm db:stop`     | Stop the local Docker Postgres database        |
| `pnpm db:reset`    | Reset local Docker Postgres, migrate, and seed |
| `pnpm db:seed`     | Seed the local Docker Postgres database        |
| `pnpm db:generate` | Generate Drizzle migrations                    |
| `pnpm db:migrate`  | Run migrations                                 |
| `pnpm db:push`     | Push schema changes directly to the database   |
| `pnpm db:studio`   | Open Drizzle Studio                            |

## Local Database

set `.env` to local testing variables, then start Postgres and
wait for it to be healthy:

```bash
pnpm db:start
```

Generate migrations after schema changes:

```bash
pnpm db:generate
```

Apply migrations to the database from `DATABASE_URL`:

```bash
pnpm db:migrate
```

Reset the Docker database, re-apply migrations, and seed test data:

```bash
pnpm db:reset
```

Seed the local Docker database with test user and club data:

```bash
pnpm db:seed
```
