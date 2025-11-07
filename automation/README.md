# Automation stack

This folder contains the reproducible infrastructure for local workflows handled by [n8n](https://n8n.io/) as well as the JSON exports of the webhook automations used by Kivalao.

## 1. Start PostgreSQL + n8n locally

```bash
cp automation/.env.example automation/.env
# Adjust secrets before running the stack
cd automation
docker compose up -d
```

The compose file provisions:

- **PostgreSQL 15** with the same schema expected by Prisma.
- **n8n** connected to the PostgreSQL instance so that workflow executions are persisted.

Once the containers are up, n8n is available at [http://localhost:5678](http://localhost:5678) using the credentials configured in `.env`.

## 2. Import the workflows

In the n8n UI, use **Import from file** and select:

- `automation/n8n/workflow_distribution.json`
- `automation/n8n/workflow_notification.json`

Both workflows are shipped disabled. Inspect the nodes, update the credentials (JWT header auth and SMTP), then activate them when the end-to-end test succeeds.

## 3. Wire the backend

Update the backend `.env` file so that `DATABASE_URL` targets the PostgreSQL container (`postgres://kivalao:super-secret@localhost:5432/kivalao`). Then run Prisma migrations from the `backend/` folder:

```bash
npm install
npm run prisma:generate
npm run prisma:migrate -- --name init_database
```

After the initial migration, use `npm run start:dev` to boot NestJS and hit the webhooks:

- `POST http://localhost:5678/webhook/kivalao/distribution`
- `POST http://localhost:5678/webhook/kivalao/redemption`

The workflows forward the payloads to the API declared in `KIVALAO_API_URL` and trigger the expected side-effects (code generation + transactional emails).

## 4. Production check-list

- Mirror the `.env` variables in your secrets manager/hosting environment.
- Expose n8n through HTTPS and restrict the webhooks with signature headers or an allow-list of backend IPs.
- Schedule regular database backups for both Prisma and n8n data stores.
- Use CI to apply Prisma migrations (`npx prisma migrate deploy`) before every release.
