# Anas-owned security review

Review date: 2026-08-21

## Scope

This review covers Anas-owned website functionality: authentication, onboarding, Google OAuth, Gmail metadata sync, account discovery/evidence/confidence, account APIs and UI, dormancy, identity graph, account actions, Google capability mapping, and account deletion. Raphael-owned dashboard, subscription, breach, exposure, risk, Privacy Inbox, request, and notification features are not reviewed or modified here.

## Verified controls

- Passwords are bcrypt-hashed; normal queries and API serialization exclude the hash.
- Session JWT verification fixes the algorithm, issuer, audience, and expiry; the JWT remains in an httpOnly cookie and not browser storage.
- CORS and unsafe-request origin checks use the configured allowlist; Helmet, JSON limits, and API/auth rate limits are enabled.
- Every Anas-owned user resource query is scoped to the authenticated user. Invalid and cross-user account/action IDs use safe not-found responses.
- Google OAuth state is random, signed, short-lived, stored in an httpOnly cookie, and bound to the OwnTrace user.
- OAuth requests exactly `openid`, `email`, and `gmail.metadata`; earlier grants are not automatically included.
- Access and refresh tokens use authenticated AES-256-GCM encryption at rest and are excluded from standard queries, responses, and logs.
- Gmail sync requests selected metadata headers only, bounds work, limits concurrency, persists resumable progress, and deduplicates with user-scoped HMAC identifiers.
- Stored Gmail-derived content is minimized; bodies, snippets, raw MIME, attachments, provider IDs, and raw evidence are not exposed.
- Account discovery, confidence, dormancy, graph projection, and cleanup recommendations are deterministic, explainable, bounded, and user-scoped.
- Account deletion requires password reauthentication plus explicit text confirmation, attempts provider revocation, clears the session, and deletes all Anas-owned user records.
- API errors return safe operational codes; unexpected server errors do not expose stack traces or secret values.

## Hardening changes from this review

1. Removed Google's automatic inclusion of previously granted scopes from new authorization requests.
2. Added complete OwnTrace account/data deletion with password confirmation and best-effort Google revocation.
3. Added a responsive, keyboard-accessible account settings page and explicit post-deletion provider-revocation guidance.
4. Added regression tests for exact OAuth scope requests, password confirmation, complete multi-collection deletion, session invalidation, and provider-revocation failure.

## Residual launch requirements

These are deployment/operations requirements, not claims of completed production readiness:

- Complete Google's verification and restricted-scope security assessment before public production Gmail access.
- Use managed secrets, HTTPS, production-only origins/redirects, database backups, monitoring, alerting, and a tested recovery/incident process.
- Use a shared rate-limit store if the API runs on multiple instances.
- Evaluate MongoDB transactions or a deletion job/quiescence mechanism before high-concurrency production account deletion.
- Define retention, backup-erasure, privacy-policy, and user-support procedures for production operations.

No secrets, real environment files, production data, or provider tokens are included in this review document.
