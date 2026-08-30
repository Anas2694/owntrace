# OwnTrace

> Own your digital footprint.

OwnTrace is a personal digital identity and privacy control platform. It is intended to help users discover where their online identity exists, understand privacy and security risks, prioritize what matters, take action, and monitor changes.

## Status

Early development. The current website MVP includes the responsive public landing page, authentication, privacy-first onboarding, secure Gmail metadata sync, deterministic account and subscription discovery, protected account inventory, identity graph, account cleanup, dashboard, security/exposure views, manual opt-in verified breach checks through XposedOrNot, explainable Privacy Health, Privacy Inbox, manual privacy-request tracking, notifications, honest Google capability mapping, and password-confirmed OwnTrace data deletion. Automatic third-party privacy-request delivery is not yet integrated. The security review is documented, but production launch requirements remain.

## Tech stack

- Client: React, Vite, JavaScript, React Router, Axios
- Server: Node.js, Express, JavaScript, Mongoose, MongoDB
- API style: REST

## Local setup

Requirements: Node.js 20.19+ on the Node 20 release line, or Node.js 22.12+, matching Vite 8's supported runtime ranges; npm; and MongoDB.

```bash
npm install
npm run setup
```

Copy `server/.env.example` to `server/.env`. Configure `MONGO_URI` and a private `JWT_SECRET` of at least 32 characters. Never commit `server/.env` or share its values.

Run the client and server together:

```bash
npm run dev
```

Or run them separately:

```bash
npm run dev:client
npm run dev:server
```

- Client: `http://localhost:5173`
- API health: `http://localhost:5000/api/health`

### Windows MongoDB DNS troubleshooting

If the server reports `querySrv ECONNREFUSED` for a `mongodb+srv://` connection and
`node -e "console.log(require('node:dns').getServers())"` prints `127.0.0.1`, use
Node.js `22.21.1` for local Windows development. A [Node.js/c-ares regression](https://github.com/nodejs/node/issues/62326) in affected
later Windows builds can select the loopback resolver even when Windows DNS is configured
correctly. Also confirm that MongoDB Atlas **Network Access** contains only the current
developer IP; do not solve local access by allowing `0.0.0.0/0`.

Run the backend authentication tests with an isolated in-memory MongoDB instance:

```bash
npm test
```

Production configuration, deployment, operations, rollback, and release blockers are documented in [`docs/ENVIRONMENT.md`](docs/ENVIRONMENT.md), [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md), [`docs/OPERATIONS.md`](docs/OPERATIONS.md), and [`PRODUCTION_READINESS.md`](PRODUCTION_READINESS.md). The current verdict is not a public-production approval.

## Team

- [Anas2694](https://github.com/Anas2694)
- [RaphaelBlaster](https://github.com/RaphaelBlaster)

Feature ownership is documented in [`docs/OWNERSHIP.md`](docs/OWNERSHIP.md).

## Contribution workflow

1. Branch from `main` using the developer and feature name.
2. Implement one owned feature or shared foundation change.
3. Use a clear conventional commit message.
4. Push the feature branch and open a pull request into `main`.
5. Review before merging; do not develop directly on `main`.

Never commit real credentials, `.env` files, OAuth tokens, database connection strings, or user data.
