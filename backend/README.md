# Kivalao API

NestJS + Prisma service powering the reciprocal affiliation workflow.

## Requirements

- Node.js 18+
- PostgreSQL (local Docker or managed service)

## Getting Started

```bash
cd backend
npm install
cp .env.example .env  # set DATABASE_URL, JWT_SECRET, webhook URLs
npm run prisma:generate
npm run prisma:migrate   # applies ./prisma/migrations
npm run start:dev
```

The API listens on `http://localhost:3000` by default. The default database schema matches the migrations stored under `prisma/migrations` and expects a PostgreSQL database with the `pgcrypto` extension enabled (see `automation/docker-compose.yml` for a ready-to-run stack).

## Testing

```bash
npm run test          # unit tests (placeholder)
npm run test:e2e      # runs files in test/*.e2e-spec.ts
```

E2E suites stub Prisma via Nest overrides (no DB required) but still need the TypeScript build chain (`ts-jest`).

## Helpful Scripts

- `npm run prisma:generate` — regenerate Prisma client after editing `schema.prisma`
- `npm run prisma:migrate` — run pending migrations in dev (creates new ones when passing `--name`)
- `npm run prisma:migrate:deploy` — apply committed migrations in CI/production
- `npm run lint` — lint sources with ESLint/Prettier rules

## Project Layout

- `src/common` — shared providers (PrismaService, guards, decorators)
- `src/modules/**` — feature modules (auth, partnerships, offers, codes, dashboard, transactions)
- `test/*.e2e-spec.ts` — Supertest-based e2e coverage for critical flows

For n8n webhook automations and the dockerised database, refer to `../automation/README.md`.
