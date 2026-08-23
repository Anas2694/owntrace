# OwnTrace website MVP security review

Review date: 2026-08-21

Review branch: `anas/raphael-mvp-integration`

Base commit: `b3905b0fb3a4f5de55f13abacae5e3e43ced5a0e`

## Executive summary

The current website MVP passes the delivery security gate for local integration. No confirmed Critical, High, Medium, or Low code finding remains open in the reviewed scope. Raphael-owned website routes are authenticated, bounded, user-scoped, minimized, and covered by two-user isolation tests. Permanent account deletion now includes the one new Raphael-owned persistent collection through an explicit owned service hook.

This is not a production-launch verdict. Google restricted-scope verification, managed infrastructure, monitoring, backup/erasure operations, and incident response remain required before public deployment.

## Scope and exclusions

Reviewed: authentication, onboarding, Google OAuth, Gmail metadata sync, account discovery/evidence/confidence, account APIs, dormancy, identity graph, account actions, account deletion, dashboard, subscription signals, breach status/security signals, exposure review, Privacy Health, Privacy Inbox, privacy requests, notifications, frontend route protection, and responsive/keyboard behavior.

Excluded/deferred: browser extension, mobile applications, Microsoft integration, data-broker infrastructure, automatic third-party privacy-request delivery, and production infrastructure operations.

## Route inventory

| Method and path | Classification | Authentication / authorization | Validation and bounds |
| --- | --- | --- | --- |
| `GET /api/health` | Public health | None; no user data | No input |
| `POST /api/auth/register` | Public auth | Rate limited; creates only submitted user | Field validation, origin control, body limit |
| `POST /api/auth/login` | Public auth | Rate limited; generic failure | Field validation, origin control |
| `POST /api/auth/logout` | Session action | Safe idempotent cookie clear | Origin control |
| `GET /api/auth/session` | Public session discovery | Returns safe user or `null` | Invalid cookie cleared |
| `GET /api/auth/me` | Authenticated | Current session user only | JWT allowlist/issuer/audience/expiry |
| `DELETE /api/auth/account` | Owner-restricted destructive | Current user plus password reauthentication | Exact confirmation, rate limit, owned deletion hooks |
| `GET`, `PATCH /api/onboarding` | Owner-restricted | Current user only | Allowlisted state progression |
| `GET /api/google/connection` | Owner-restricted | Current user only | Safe metadata/capabilities only |
| `GET /api/google/oauth/start` | Owner-restricted redirect | Current user; signed state binding | Exact allowlisted scopes |
| `GET /api/google/oauth/callback` | Owner-restricted callback | Current session and state | Signed state, verified ID token, safe redirect codes |
| `DELETE /api/google/connection` | Owner-restricted destructive | Current user only | Revocation before local cleanup |
| `GET`, `POST`, `DELETE /api/google/sync` | Owner-restricted | Current user only | Bounded job state/concurrency |
| `POST /api/google/sync/next` | Owner-restricted | Current user only | 25-message batch and lock controls |
| `GET /api/accounts` | Owner-restricted list | Query includes current user ID | Allowlisted filters/sort/search; limit ≤100 |
| `GET /api/accounts/summary` | Owner-restricted summary | Query includes current user ID | No external identifiers |
| `GET /api/accounts/:id` | Owner-restricted detail | ID plus current user ID | Safe 404; evidence capped at 100 |
| `GET /api/account-actions` | Owner-restricted list | Query includes current user ID | Allowlisted status/account; limit ≤100 |
| `GET /api/account-actions/summary` | Owner-restricted summary | Query includes current user ID | Deterministic derived counts |
| `PATCH /api/account-actions/:id` | Owner-restricted update | ID plus current user ID | Allowlisted transitions; safe 404 |
| `GET /api/identity` | Owner-restricted graph | Every source query includes current user ID | Rendered accounts capped at 200 |
| `GET /api/subscriptions` | Owner-restricted list | Query includes current user ID | Pagination only; limit ≤100; internal evidence references excluded |
| `GET /api/breaches` and `POST /api/breaches/check` | Owner-restricted list/check | Query includes current user ID; explicit consent required for outbound check | Cached minimal verified names; 24-hour refresh boundary |
| `GET /api/exposures` | Owner-restricted list | Query includes current user ID | Pagination only; limit ≤100 |
| `GET /api/privacy-health` | Owner-restricted summary | Reuses user-scoped account/action services | Deterministic bounded penalties |
| `GET /api/privacy-requests` | Owner-restricted list | Query includes current user ID | Status allowlist; limit ≤100 |
| `POST /api/privacy-requests` | Owner-restricted create | Stores current user ID server-side | Type allowlist and field length limits |
| `PATCH /api/privacy-requests/:id` | Owner-restricted update | ID plus current user ID | Allowlisted transitions; safe 404 |
| `GET /api/notifications` | Owner-restricted projection | Reuses user-scoped actions and requests | Read-only; limit ≤50; each source capped at 100 |

## Verified controls

- Passwords are bcrypt-hashed; normal queries and API serialization exclude the hash.
- Session JWT verification fixes the algorithm, issuer, audience, and expiry; the JWT remains in an httpOnly cookie and not browser storage.
- CORS and unsafe-request origin checks use the configured allowlist; Helmet, JSON limits, and API/auth rate limits are enabled.
- Every user-resource query is authenticated and user-scoped. Invalid and cross-user account/action/privacy-request IDs use safe not-found responses.
- Google OAuth state is random, signed, short-lived, stored in an httpOnly cookie, and bound to the OwnTrace user.
- OAuth requests exactly `openid`, `email`, and `gmail.metadata`; earlier grants are not automatically included.
- Access and refresh tokens use authenticated AES-256-GCM encryption at rest and are excluded from standard queries, responses, and logs.
- Gmail sync requests selected metadata headers only, bounds work, limits concurrency, persists resumable progress, and deduplicates with user-scoped HMAC identifiers.
- Stored Gmail-derived content is minimized; bodies, snippets, raw MIME, attachments, provider IDs, and raw evidence are not exposed. Subscription records retain only structured billing facts and bounded internal signal references; manual verified breach checks store only minimal breach names and safe timestamps.
- The low-volume beta uses XposedOrNot's free API. OwnTrace clearly discloses that the account email is sent to XposedOrNot and applies sliding in-memory limits of 90 outbound checks per 24 hours, 20 per hour, and one per second; cached results do not consume this allowance. A multi-instance deployment must move this limiter to a shared store before scaling.
- Account discovery, confidence, dormancy, graph projection, cleanup recommendations, and Privacy Health are deterministic, explainable, bounded, and user-scoped.
- Subscription detection independently upserts user/service records from minimized metadata, excludes marketing-only messages, labels confidence and renewal estimates, and never exposes Gmail identifiers or claims active billing. Breach-status and exposure views reuse derived account records.
- Security-related metadata is explicitly marked unverified and never represented as a confirmed breach or public exposure.
- Privacy requests store only a service label, type, lifecycle status, and optional bounded notes; no request is sent externally.
- Account deletion requires password reauthentication plus explicit text confirmation and invokes the Raphael-owned deletion service for privacy requests, subscriptions, and breach reports before removing the user. Gmail disconnect removes subscriptions before their source signals.
- API errors return safe operational codes; unexpected server errors do not expose stack traces or secret values.

## Remediation completed

1. Rejected PR #6's unbounded subscription query, serialized owner IDs, logged seed password, hard-coded user/date/count claims, public demo route, dead actions, unnecessary UI dependencies, and inaccessible mobile drawer.
2. Replaced it with bounded user-scoped feature APIs and a dependency-free protected frontend integration based on current `main`.
3. Added the explicit Raphael-owned account-deletion hook for persistent privacy-request records.
4. Added two-user authorization, IDOR, query-bound, truthfulness, deterministic-score, notification-isolation, and deletion-cascade tests.
5. Added keyboard focus trapping, Escape/backdrop close, trigger-focus restoration, inert closed navigation, visible focus styles, and reduced-motion CSS.

## Validation evidence

- Client lint and production build: passed without warnings.
- Server JavaScript syntax checks: passed.
- Focused Raphael feature suite: 9 tests passed.
- Full server suite: 73 tests passed across six files.
- Root, client, and server dependency audits: zero known vulnerabilities at moderate severity or higher.
- Direct and proxied health checks passed; tracked files contained no real `.env` file or recognized credential pattern.
- GitHub Actions result is recorded in the pull request and final integration report.
- Browser validation: `/dashboard`, `/subscriptions`, `/breaches`, `/exposures`, `/privacy-health`, `/privacy-inbox`, `/privacy-requests`, and `/notifications` loaded without alerts or console warnings/errors at 390, 768, and 1440 pixels; no horizontal overflow was observed.
- Mobile navigation: focus enters and remains in the drawer, Escape and backdrop close it, focus returns to the menu trigger, and body scrolling is restored.

## Residual launch requirements

- Complete Google's verification and restricted-scope security assessment before public production Gmail access.
- Reassess the breach-data service's reliability, terms, and rate limits before scaling beyond manual low-volume checks.
- Add a reviewed delivery mechanism before OwnTrace sends privacy requests to third parties.
- Use managed secrets, HTTPS, production-only origins/redirects, database backups, monitoring, alerting, and a tested recovery/incident process.
- Use a shared rate-limit store if the API runs on multiple instances.
- Evaluate MongoDB transactions or a deletion job/quiescence mechanism before high-concurrency production account deletion.
- Define retention, backup-erasure, privacy-policy, and user-support procedures for production operations.

## Subscription detection validation addendum

Validated on 2026-08-24 from branch `anas/subscription-detection`, based on merged `main` commit `149117302b220543d6c7d3f5e4277f5053df5906`.

- Full server suite: 97 tests passed across nine files, including deterministic extraction, idempotency, two-user isolation, API serialization, Gmail disconnect, and permanent deletion.
- Client lint and production build, server JavaScript syntax checks, and root/client/server dependency audits passed; all three audits reported zero known vulnerabilities.
- The tracked-file credential-pattern scan and `git diff --check` passed.
- Frontend runtime smoke checks returned `200` for `/`, `/dashboard`, and `/subscriptions`. A direct local API smoke check could not start because the configured MongoDB Atlas SRV hostname was unreachable from the validation environment; database-backed API behavior passed against `mongodb-memory-server`.

No secrets, real environment files, production data, provider tokens, or email bodies are included in this review document.
