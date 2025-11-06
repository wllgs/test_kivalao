# Kivalao Technical Blueprint

## 1. Solution Overview
- **Core loop**: Reciprocal referrals between alpine professionals via shared promo codes, tracked commissions, and automated notifications.
- **Macro-architecture**: SPA dashboard (React + Vite) <-> NestJS API (modular, JWT auth) <-> PostgreSQL (Prisma) with n8n orchestrating external CRM/existing tooling touchpoints.
- **Tenancy model**: Single-tenant database for MVP with logical isolation per `User`/`Partnership`. Future multi-tenant ready by scoping queries via `userId`/`partnershipId` columns already present in every table.

## 2. Technology Stack
| Layer | Choice | Notes |
| --- | --- | --- |
| Frontend | React 18 + Vite + TypeScript + React Query | Fast dev server, simple data fetching/caching. |
| Backend | NestJS 10 (Fastify adapter) | Modular, testable DI, batteries-included validation. |
| ORM | Prisma | Schema-first, migrations, typed client. |
| DB | PostgreSQL 15 | Handles relational workload and transactions for redemption atomicity. |
| Automation | n8n self-hosted | Workflow runners for distribution plus notification hooks. |
| Auth | JWT (short-lived access + refresh) | Stateless, easily consumed by SPA and n8n. |
| Email | SendGrid (via n8n) | Template plus high deliverability. |
| Observability | Winston + OpenTelemetry exporter (optional) | Structured logs for hooks. |

## 3. NestJS Module Layout
```
src
|-- common
|   |-- guards (JwtAuthGuard)
|   |-- interceptors (Logging)
|   |-- services (PrismaService, NotificationHttpService)
|-- modules
|   |-- auth (controller, service, JWT strategies)
|   |-- users
|   |-- partnerships (invite/accept, listing peers)
|   |-- offers (CRUD, partner-filtered feeds)
|   |-- codes (generation + validation hook)
|   |-- transactions (listing, settlement)
|   |-- dashboard (aggregate balances)
|-- main.ts (bootstraps Fastify + validation pipe)
```

## 4. API Surface (MVP)
| Method & Path | Description | DTO |
| --- | --- | --- |
| `POST /auth/register` | Creates a partner admin + bootstrap org profile. Sends verification email. | `RegisterDto` |
| `POST /auth/login` | Returns JWT access/refresh tokens. | `LoginDto` |
| `POST /partnerships/invite` | Authenticated user invites another partner; issues token + email. | `InvitePartnerDto` |
| `PATCH /partnerships/accept/:inviteToken` | Accepts invite, flips partnership to ACTIVE if reciprocated. | `AcceptInviteDto` |
| `POST /offers` | Creates an offer tied to a partnership + target partner. | `CreateOfferDto` |
| `GET /partnerships/offers` | Lists active offers owned by your partners (for distribution). Accepts optional pagination + `partnerId` filters. | Query params via `ListPartnerOffersDto`. |
| `POST /code/generate` | Issues unique code for client email and stores origin partner. | `GenerateCodeDto` |
| `POST /code/validate` | Atomic redemption hook: verifies code, inserts transaction, pings n8n. | `ValidateCodeDto` |
| `GET /dashboard/balance` | Returns net balance (you owe vs owed to you) + recent transactions. | `DashboardBalanceQuery` |

All endpoints (except `/auth/*`) guarded by `JwtAuthGuard` and multi-tenant filtered by `req.user.id`.

## 5. Data Contracts (DTO Highlights)
- **RegisterDto**: `companyName`, `email`, `password`, optional contact metadata.
- **InvitePartnerDto**: `inviteeEmail`, `inviteeCompany`, optional note, partnership role (A/B automatically derived by backend order).
- **CreateOfferDto**: `title`, `description`, `targetPartnerId`, `commissionType`, `commissionValue`, validity window.
- **GenerateCodeDto**: `offerId`, `clientEmail`, `issuedByPartnerId` (defaults to auth user), optional `expiresAt` and `purchaseHintValue`.
- **ValidateCodeDto**: `code`, `redeemingPartnerId`, `purchaseValue`, optional `channel` and `posReference`. Ensures redeemer owns the offer.

Full DTO implementations live under `backend/src/modules/**/dto`.

## 6. Critical Flows
### 6.1 Distribution (n8n Workflow 1)
1. External CRM triggers webhook with `{clientEmail, partnerId}`.
2. n8n calls `GET /partnerships/offers?partnerId={partnerId}` to fetch partner-facing offers.
3. For each offer, n8n requests `POST /code/generate` with the `clientEmail` + `offerId`.
4. n8n aggregates responses and fires SendGrid transactional email with codes + CTAs.

### 6.2 Redemption (API)
1. Partner B submits code via dashboard or via API.
2. `CodeService.validateCode` runs inside a `Prisma.$transaction()` to:
   - Lock and verify `GeneratedCode`.
   - Update status to `REDEEMED` with timestamp + redeemer metadata.
   - Create `Transaction` row capturing commission.
3. Service calls n8n webhook #2 asynchronously (fire-and-forget with retry) for email notifications.
4. Response returns `200 OK` with promo context and `transactionId` for partner POS systems.

### 6.3 Notification (n8n Workflow 2)
1. Triggered by backend webhook payload `{transactionId}`.
2. n8n fetches transaction details via `GET /transactions/{id}` (optional) or trusts payload.
3. Sends confirmation email to referring partner and redeemer, attaches monthly statement link.

## 7. Balance Computation
`DashboardService.calculateNetBalance` aggregates `Transaction` sums grouped by role:
- `youAreOwed = SUM(commissionAmount WHERE referringPartnerId = userId AND status != VOID)`
- `youOwe = SUM(commissionAmount WHERE redeemingPartnerId = userId AND status IN (DUE, PARTIALLY_PAID))`
- `net = youAreOwed - youOwe`
The dashboard also surfaces last 10 transactions for transparency.

## 8. Deployment Notes
- Package backend + n8n inside docker-compose (Postgres, Nest, n8n, optional Redis for queues).
- Configure n8n webhook URLs via environment variables `N8N_DISTRIBUTION_WEBHOOK_URL` and `N8N_NOTIFICATION_WEBHOOK_URL` consumed by Nest services.
- Stripe/GoCardless integration for settlement can hook into `Transaction` status transitions later.

## 9. Testing Strategy
- Unit-test DTO validators + `CodeService` commission calculations (mock Prisma + HttpService).
- Integration tests for `/code/validate` exercising transaction rollback on double redemption.
- Frontend Cypress test covering Validate Code form happy path + error state.
