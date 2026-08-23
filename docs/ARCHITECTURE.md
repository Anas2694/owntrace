# Architecture

OwnTrace begins as a modular MERN application in one repository.

## Runtime structure

- `client/`: responsive React/Vite web application
- `server/`: Express REST API and future MongoDB access through Mongoose
- `docs/`: architecture, ownership, security, and API agreements

During local development, Vite proxies `/api` requests to the Express server on port `5000`. The frontend Axios client uses credentials so future authentication can rely on secure httpOnly cookies.

Backend code is organized by routes, controllers, configuration, and—when milestones need them—models, middleware, services, and utilities. Feature modules should be introduced only as their milestones begin; OwnTrace will remain a single backend rather than premature microservices.

Authentication uses a minimal MongoDB `User` record and a signed JWT stored only in an httpOnly browser cookie. The React `AuthProvider` discovers a restorable session through `GET /api/auth/session`, while protected APIs use authentication middleware and return `401` when unauthorized; Anas-owned routes never read a token from browser storage. Authentication routes follow the route → controller → service → model boundary so later Google association can extend the user without embedding provider credentials in the user record.

Account settings provide a password-confirmed deletion boundary. Deletion attempts Google revocation, removes all Anas-owned records keyed to the authenticated user, clears the session, and explicitly reports when provider revocation could not be confirmed. Provider-side data and third-party accounts remain outside OwnTrace's deletion capability.

Onboarding is a small, server-enforced progression on the user record: `NOT_STARTED → PRIVACY_REVIEWED → GMAIL_PENDING`. It explains data access and minimization before handing off to Gmail connection, without starting OAuth or creating a general workflow engine.

Google OAuth remains server-side. Provider tokens are encrypted with AES-256-GCM, never serialized to the client, and associated through Google's verified stable OpenID `sub`. Gmail ingestion uses resumable 25-message API batches and stores only HMAC provider identifiers plus minimized header-derived signals. `GmailSyncJob` persists safe progress without an external queue; the browser can resume an interrupted queued job.

When a Gmail scan reaches a completed bounded batch, the account-discovery and subscription-detection services evaluate all of that user's minimized `GmailSignal` records. Public-suffix-aware domain normalization groups subdomains into deterministic services. Account classification produces user-scoped `AccountEvidence` records and one `Account` per user/service domain. Subscription classification independently upserts one user-scoped `Subscription` per service from non-marketing payment or recurring-plan evidence. Structured amount, currency, and cycle facts are extracted during metadata minimization; raw subjects and provider identifiers are not copied into subscription records. Renewal dates remain labeled estimates and detections never assert that billing is active.

The account read layer exposes only user-scoped REST resources. List queries are paginated and allow bounded search, confidence, dormancy, and sorting controls. Detail responses serialize minimized evidence without Gmail message IDs, connection IDs, subjects, or provider credentials. Dormancy is refreshed from the most recent ownership evidence using documented time bands; it remains an inference rather than a claim about the service's current account state.

The identity graph is a read-time projection over the authenticated user, safe Google connection metadata, accounts, and evidence provenance. Deterministic typed nodes and edges avoid a separate graph database. The summary reports complete counts while the visual graph caps account nodes at 200; the paginated Accounts API remains the full inventory interface.

Account cleanup is a separate account-owned recommendation layer. It generates idempotent user/account/type records from confidence, dormancy, and evidence classes, preserves user-managed lifecycle states, and removes open recommendations that no longer apply. Its REST contract is intentionally separate from Raphael-owned global inbox and request workflows.

Privacy-sensitive integrations should store derived metadata instead of full source content wherever possible. Feature boundaries communicate through owned REST APIs rather than duplicated business logic.

Raphael-owned website views integrate through those boundaries. Dashboard requests the existing account summary/list, account-action summary/list, and identity APIs in parallel, plus bounded owned endpoints for subscriptions, security/breach status, exposure review, Privacy Health, privacy requests, and notifications. Subscriptions persist only structured, derived metadata and bounded internal evidence references; security and exposure remain read-time projections over minimized account evidence. Privacy Health is a deterministic bounded score over account and action summaries and is explicitly not an external audit. Notifications are a bounded projection over open account actions and manually tracked privacy-request status.

`PrivacyRequest`, `Subscription`, and `BreachReport` are the persistent Raphael-owned records in this MVP. Permanent account deletion invokes the Raphael-owned deletion service so these records are removed with the rest of the user profile. Gmail disconnect removes subscriptions before deleting their minimized source signals.
