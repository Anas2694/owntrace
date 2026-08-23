# Deployment and rollback

## Supported initial topology

The recommended low-volume beta is one managed container serving both the built React client and the Express API, plus one managed MongoDB deployment. This keeps browser requests and session cookies same-origin and matches the in-memory rate-limit assumptions. Do not run multiple API instances until general and XposedOrNot rate limits use a shared atomic store.

Required platform capabilities:

- Node.js 22.12+ compatible Linux container runtime
- HTTPS termination and a documented proxy-hop topology
- encrypted runtime secret storage
- health checks against `GET /api/health/ready`
- immutable image versions and one-click rollback
- centralized logs with access and retention controls
- managed MongoDB TLS, backups, restore support, and least-privilege users

## Build

From a clean checkout:

```bash
npm ci
npm ci --prefix client
npm ci --prefix server
npm run validate
docker build --tag owntrace:<git-sha> .
```

The Docker image contains production server dependencies and `client/dist`; it does not contain local `.env` files, development dependencies, repository history, `output`, or `tmp`.

## Configure

1. Create separate preview/staging and production MongoDB databases and users.
2. Add the variables in `docs/ENVIRONMENT.md` through the platform secret store.
3. Set `CLIENT_ORIGINS` and `CLIENT_APP_URL` to the final HTTPS origin.
4. Configure the exact Google redirect URI in Google Cloud and in `GOOGLE_REDIRECT_URI`.
5. Set `TRUST_PROXY` only after confirming the number or subnet of trusted proxies between the internet and Express.
6. Keep one application instance for the initial free-provider beta.

## Deploy

1. Deploy an immutable image tagged with the reviewed Git SHA to preview/staging.
2. Wait for `/api/health/ready` to return `200`.
3. Run the smoke checklist in `docs/OPERATIONS.md` with disposable test accounts.
4. Confirm logs contain request IDs but no bodies, cookies, tokens, email addresses, or Gmail content.
5. Record the image SHA, configuration version, database backup/restore point, and approver.
6. Promote the same image to production; do not rebuild between staging and production.

## Rollback

There are currently no schema migrations. Application changes use additive Mongoose schemas, so the primary rollback is the previous immutable image.

1. Stop new promotion activity and record the incident/request ID.
2. Re-select the last known-good image SHA in the platform.
3. Do not roll back MongoDB data unless a confirmed data-corruption event requires it.
4. Wait for readiness, then run login, session restoration, dashboard, Gmail connection-status, and deletion smoke checks.
5. If data restoration is required, follow the provider-tested restore procedure and meet the RPO/RTO recorded in `PRODUCTION_READINESS.md`.

Deployment is blocked until hosting, domain, monitoring, and verified backup/restore evidence are recorded.
