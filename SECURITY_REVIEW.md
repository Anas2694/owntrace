# OwnTrace security delivery review

Review date: 31 August 2026

Review branch: `anas/post-merge-hardening`

Base commit: `0f30dfc6b902f86b2e03d3cf04ccb2a9005b462f`

## Delivery verdict

**CODE DELIVERY GATE PASSED.** No confirmed Critical or High finding remains. The one confirmed Medium finding—replay of a copied JWT after logout—was remediated with server-side session revocation and a passing regression test.

This is a code-delivery verdict, not permission for public production Gmail access. See `PRODUCTION_READINESS.md` for external launch blockers.

## Scope

Reviewed: tracked client/server source, environment example, dependency manifests/locks, CI, authentication/session handling, authorization/user isolation, Google OAuth/Gmail metadata, Microsoft OAuth/Outlook metadata, cross-provider aggregation and cleanup, breach provider, account/subscription/privacy APIs, deletion, production startup, logging, health, legal routes, and deployment files.

Excluded from active testing: production systems, real user data, destructive provider operations, Google approval systems, live DNS/TLS/hosting, managed backup restore, and third-party legal review.

## Route inventory

| Method/path | Classification | Authentication and authorization | Bounds |
| --- | --- | --- | --- |
| `GET /api/health`, `/api/health/ready` | Public operational | No user data | No input; readiness reveals only ready/not-ready |
| `POST /api/auth/register`, `/login` | Public authentication | Rate limited; generic login failure | Validated body; origin control; 100 KB body limit |
| `POST /api/auth/logout` | Session action | Revokes the presented valid session; idempotent | Origin control |
| `GET /api/auth/session` | Public session discovery | Active server-side session only; safe user/null | Invalid/revoked cookie cleared |
| `GET /api/auth/me` | Authenticated | Current active session/user | Safe user projection |
| `DELETE /api/auth/account` | Owner destructive | Active session plus password reauthentication | Confirmation, rate limit, owned deletion hooks |
| `/api/google/*` | Owner integration | Active current-user session; OAuth state also user-bound | Exact scopes, bounded sync, safe errors |
| `/api/microsoft/*` | Owner integration | Active current-user session; OAuth state also user-bound | Exact scopes, bounded sync, safe errors and provider URL allowlist |
| `/api/onboarding/*` | Owner workflow | Active current-user session | Allowlisted progression |
| `/api/accounts/*`, `/api/account-actions/*`, `/api/identity` | Owner resources | Every query includes current user | Bounded pagination/filtering and safe projections |
| `/api/subscriptions`, `/api/exposures`, `/api/privacy-health`, `/api/notifications` | Owner derived resources | Every query/service call is current-user scoped | Bounded lists and deterministic projections |
| `GET /api/breaches`, `POST /api/breaches/check` | Owner/provider workflow | Current-user email only after explicit consent | Cache, lock, response-size, timeout, and provider limits |
| `/api/privacy-requests/*` | Owner records | Current-user create/read/update only | Field/status allowlists and bounded pagination |
| `/`, protected client routes, `/privacy-policy`, `/terms` | Public/static or client-protected | Protected pages still rely on server authorization | CSP/security headers in production container |

## Findings

### OT-SEC-001 — revoked session replay

- Severity: Medium
- Confidence: Confirmed
- Category: OWASP Session Management / CWE-613
- Evidence: the prior logout implementation cleared only the browser cookie while its signed JWT remained valid for seven days if copied before logout.
- Remediation: persist a hash of a random JWT ID, require that active record on every protected/session request, delete it on logout, and delete all user sessions on account deletion.
- Regression: replay the exact pre-logout cookie and require `401 INVALID_SESSION`.
- Owner/status: Engineering — remediated and verified on this branch.

## Checks completed with no confirmed finding

- Password hashing and generic credential failure
- Fixed JWT algorithm, issuer, audience, expiry, httpOnly/SameSite/Secure cookie policy
- User-scoped queries and two-user IDOR/isolation coverage
- Exact Google scopes, signed user-bound OAuth state, encrypted token storage, safe refresh/revocation behavior
- Exact Microsoft scopes, signed user-bound OAuth state, encrypted token storage, bounded Graph responses, safe refresh behavior, and user-scoped cleanup
- Gmail metadata minimization and exclusion of bodies, snippets, MIME, attachments, provider IDs, and credentials
- Microsoft metadata minimization, cross-provider evidence isolation, deterministic subscription aggregation, and cancellation-safe run cleanup
- CORS allowlist and unsafe-method origin enforcement
- Input/query bounds, response minimization, provider timeout/size/redirect controls, and dependency audits
- NoSQL/command/path/file-upload/template execution surface identified in current routes
- Structured logs intentionally exclude bodies, queries, cookies, email addresses, provider tokens, and IP addresses

## Validation evidence

- Client lint, production build, server syntax, and 118 Vitest tests across 12 files passed after Microsoft integration hardening. Added dual-provider discovery/cleanup and identity-projection regressions passed.
- Root, client, and server `npm audit --audit-level=moderate`: zero known vulnerabilities.
- Production-process smoke: configuration validation, MongoDB readiness, static SPA/legal routes, Helmet CSP, request IDs, safe API rejection, redacted log markers, and graceful shutdown passed.
- Local bounded health load: 100 concurrent requests, zero failures, 163 ms clean-checkout p95. This is a smoke/load sanity check, not final capacity evidence for authenticated database journeys.
- Browser: public/legal/auth pages at 390, 768, and 1440 px; every protected route at 390 px; critical protected routes at 768 and 1440 px; no horizontal overflow, alert state, React warning, console warning, or console error.
- Keyboard/accessibility: visible legal-page focus, semantic landmarks/headings, reduced-motion override, mobile-drawer initial focus, focus containment, Escape close, trigger restoration, body-scroll restoration, and hidden/inert closed state passed.
- `git diff --check` and the intended tracked-file credential-pattern scan passed. No real `.env` file was added.
- Local Docker image build was unavailable because the Docker Desktop engine was not running; the equivalent pull-request CI image build passed on GitHub's Linux runner.

Live Microsoft OAuth is not yet verified because the local environment does not contain the three required Entra variables. No secret values, environment files, provider tokens, real user data, or email content are included in this document.
