# Commands

## Development

| Command         | Description                  |
| --------------- | ---------------------------- |
| `npm run dev`   | Start the development server |
| `npm run build` | Build for production         |
| `npm run start` | Start the production server  |

## Code Quality

| Command                | Description                  |
| ---------------------- | ---------------------------- |
| `npm run lint`         | Check for ESLint issues      |
| `npm run lint:fix`     | Auto-fix ESLint issues       |
| `npm run format:check` | Check Prettier formatting    |
| `npm run format`       | Auto-fix Prettier formatting |
| `npm run typecheck`    | Run TypeScript type checking |
| `npm run check`        |                              |

## Database

| Command               | Description                                    |
| --------------------- | ---------------------------------------------- |
| `npm run db:start`    | Start the local Docker Postgres database       |
| `npm run db:stop`     | Stop the local Docker Postgres database        |
| `npm run db:reset`    | Reset local Docker Postgres, migrate, and seed |
| `npm run db:seed`     | Seed the local Docker Postgres database        |
| `npm run db:generate` | Generate Drizzle migrations                    |
| `npm run db:migrate`  | Run migrations                                 |
| `npm run db:push`     | Push schema changes directly to the database   |
| `npm run db:studio`   | Open Drizzle Studio                            |

## Local Database

set `.env` to local testing variables, then start Postgres and
wait for it to be healthy:

```bash
npm run db:start
```

Generate migrations after schema changes:

```bash
npm run db:generate
```

Apply migrations to the database from `DATABASE_URL`:

```bash
npm run db:migrate
```

Reset the Docker database, re-apply migrations, and seed test data:

```bash
npm run db:reset
```

Seed the local Docker database with test user and club data:

```bash
npm run db:seed
```
