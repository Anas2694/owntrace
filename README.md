# OwnTrace

> Own your digital footprint.

OwnTrace is a personal digital identity and privacy control platform. It is intended to help users discover where their online identity exists, understand privacy and security risks, prioritize what matters, take action, and monitor changes.

## Status

Early development. This repository currently contains the shared MERN project foundation only; product features have not been implemented yet.

## Tech stack

- Client: React, Vite, JavaScript, React Router, Axios
- Server: Node.js, Express, JavaScript, Mongoose, MongoDB
- API style: REST

## Local setup

Requirements: Node.js 20.19+ on the Node 20 release line, or Node.js 22.12+, matching Vite 8's supported runtime ranges; npm; and MongoDB when database-backed features are introduced.

```bash
npm install
npm run setup
```

Copy `server/.env.example` to `server/.env`. The API health check works without a MongoDB connection; set `MONGO_URI` when database work begins.

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
