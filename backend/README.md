# Kivalao API

NestJS + Prisma service powering the reciprocal affiliation workflow.

## Requirements

- Node.js 18+
- PostgreSQL (local or remote)

## Getting Started

```bash
cd backend
npm install
cp .env.example .env  # set DATABASE_URL, JWT_SECRET, N8N_NOTIFICATION_WEBHOOK_URL, etc.
npm run prisma:migrate
npm run start:dev
```

The API listens on `http://localhost:3000` by default.

## Testing

```bash
npm run test          # unit tests (placeholder)
npm run test:e2e      # runs files in test/*.e2e-spec.ts
```

E2E suites stub Prisma via Nest overrides (no DB required) but still need the TypeScript build chain (ts-jest).

## Helpful Scripts

- `npm run prisma:generate` — regenerate Prisma client after editing `schema.prisma`
- `npm run prisma:migrate` — run migrations in dev
- `npm run lint` — lint sources with ESLint/Prettier rules

## Project Layout

- `src/common` — shared providers (PrismaService, guards, decorators)
- `src/modules/**` — feature modules (auth, partnerships, offers, codes, dashboard, transactions)
- `test/*.e2e-spec.ts` — Supertest-based e2e coverage for critical flows

