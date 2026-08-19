# Architecture

OwnTrace begins as a modular MERN application in one repository.

## Runtime structure

- `client/`: responsive React/Vite web application
- `server/`: Express REST API and future MongoDB access through Mongoose
- `docs/`: architecture, ownership, security, and API agreements

During local development, Vite proxies `/api` requests to the Express server on port `5000`. The frontend Axios client uses credentials so future authentication can rely on secure httpOnly cookies.

Backend code is organized by routes, controllers, configuration, and—when milestones need them—models, middleware, services, and utilities. Feature modules should be introduced only as their milestones begin; OwnTrace will remain a single backend rather than premature microservices.

Authentication uses a minimal MongoDB `User` record and a signed JWT stored only in an httpOnly browser cookie. The React `AuthProvider` discovers a restorable session through `GET /api/auth/session`, while protected APIs use authentication middleware and return `401` when unauthorized; Anas-owned routes never read a token from browser storage. Authentication routes follow the route → controller → service → model boundary so later Google association can extend the user without embedding provider credentials in the user record.

Onboarding is a small, server-enforced progression on the user record: `NOT_STARTED → PRIVACY_REVIEWED → GMAIL_PENDING`. It explains data access and minimization before handing off to Gmail connection, without starting OAuth or creating a general workflow engine.

Google OAuth remains server-side. Provider tokens are encrypted with AES-256-GCM, never serialized to the client, and associated through Google's verified stable OpenID `sub`. Gmail ingestion uses resumable 25-message API batches and stores only HMAC provider identifiers plus minimized header-derived signals. `GmailSyncJob` persists safe progress without an external queue; the browser can resume an interrupted queued job.

When a Gmail scan reaches a completed bounded batch, the account-discovery service evaluates all of that user's minimized `GmailSignal` records. Public-suffix-aware domain normalization groups subdomains into deterministic services. Classification produces user-scoped `AccountEvidence` records, and aggregation upserts one `Account` per user and service domain with explainable confidence inputs. Marketing-only evidence is retained as low-confidence context and cannot independently produce likely or confirmed ownership.

Privacy-sensitive integrations should store derived metadata instead of full source content wherever possible. Feature boundaries communicate through owned REST APIs rather than duplicated business logic.
