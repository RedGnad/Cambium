# Deploying Cambium on Vercel

Cambium can run on Vercel in two deployment shapes.

## Option A - Single Vercel project with embedded API

Use this for the fastest demo deployment.

Vercel serves the Next.js frontend and the Cambium API through:

```text
/api/proxy/*
```

The embedded API still needs a real external Postgres database. Do not use the local Docker database URL on Vercel.

### Vercel project settings

- Root Directory: repository root
- Install Command: `pnpm install --frozen-lockfile`
- Build Command: `pnpm vercel-build`
- Output Directory: `apps/web/.next`

These are also captured in `vercel.json`.

### Required environment variables

```bash
NODE_ENV=production
APP_BASE_URL=https://<your-vercel-domain>
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<db>?sslmode=require
DEMO_SIGNER_PRIVATE_KEY=<generated-demo-private-key>
DEMO_SIGNER_PUBLIC_KEY=<generated-demo-public-key>
CONSTELLATION_MODE=mock
CONSTELLATION_API_BASE_URL=https://de-api.constellationnetwork.io/v1
```

Leave `API_BASE_URL` empty for the embedded API mode.

For live Constellation submission, set:

```bash
CONSTELLATION_MODE=live
CONSTELLATION_API_KEY=<constellation-api-key>
CONSTELLATION_ORG_ID=<constellation-org-id>
CONSTELLATION_TENANT_ID=<constellation-tenant-id>
```

### Database setup

Run migrations against the production database before using the deployed demo:

```bash
DATABASE_URL="postgresql://<user>:<password>@<host>:5432/<db>?sslmode=require" \
pnpm --filter @cambium/api db:migrate:deploy:ci
```

Then open the Vercel app and click `Run demo flow`.

## Option B - Vercel frontend plus external API

Use this if the Fastify API is hosted on Render, Fly.io, Railway, a VM or another Node host.

Set this on Vercel:

```bash
API_BASE_URL=https://<your-cambium-api-host>
APP_BASE_URL=https://<your-vercel-domain>
```

Use the API origin only, without a trailing `/api`.

The external API host must receive the API/database/signing variables:

```bash
NODE_ENV=production
APP_BASE_URL=https://<your-vercel-domain>
API_BASE_URL=https://<your-cambium-api-host>
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<db>?sslmode=require
DEMO_SIGNER_PRIVATE_KEY=<generated-demo-private-key>
DEMO_SIGNER_PUBLIC_KEY=<generated-demo-public-key>
CONSTELLATION_MODE=mock
CONSTELLATION_API_BASE_URL=https://de-api.constellationnetwork.io/v1
```

For live Constellation submission, also set `CONSTELLATION_API_KEY`, `CONSTELLATION_ORG_ID` and `CONSTELLATION_TENANT_ID` on the API host.

## Crash checklist

If Vercel shows `FUNCTION_INVOCATION_FAILED`, check:

- `DATABASE_URL` is not `localhost`.
- `API_BASE_URL` is empty for embedded mode, or points to a deployed API host for split mode.
- `DEMO_SIGNER_PRIVATE_KEY` and `DEMO_SIGNER_PUBLIC_KEY` are set in Vercel.
- Production migrations have run.
- `APP_BASE_URL` matches the deployed frontend URL.
- `CONSTELLATION_MODE=live` is only used when the Constellation credentials are present.

The deployed frontend should not depend on `http://localhost:4000`.
