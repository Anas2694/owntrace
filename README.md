# OwnTrace

> Own your digital footprint.

OwnTrace is a personal digital identity and privacy control platform. It is intended to help users discover where their online identity exists, understand privacy and security risks, prioritize what matters, take action, and monitor changes.

## Status

Early development. The responsive public landing page and password-based authentication are implemented. Gmail, account discovery, and other product integrations are still in progress.

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

Run the backend authentication tests with an isolated in-memory MongoDB instance:

```bash
npm test
```

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
