# Security and Privacy Baseline

OwnTrace may eventually process sensitive identity, email metadata, OAuth tokens, breach information, and account records. The project therefore starts with these rules:

- Never commit `.env` files, credentials, OAuth secrets, tokens, production data, or real user data.
- Keep authentication tokens out of frontend local storage; prefer secure httpOnly cookies.
- Validate inputs, minimize stored data, and request the least OAuth privilege required.
- Store derived email metadata rather than full inbox content wherever possible.
- Never log passwords, OAuth tokens, or sensitive email content.
- Configure CORS, secure cookies, rate limits, and security headers before production authentication is enabled.
- Encrypt sensitive stored credentials or tokens when those integrations are introduced.

## Authentication controls

- Passwords are hashed with bcrypt and the stored `passwordHash` is excluded from normal queries and API serialization.
- Session JWTs use an explicit issuer, audience, algorithm allowlist, seven-day expiry, and an httpOnly cookie.
- Development cookies use `SameSite=Lax`; production additionally requires `Secure` cookies through `NODE_ENV=production`.
- Unsafe browser requests require an `Origin` listed in `CLIENT_ORIGINS`, in addition to the CORS allowlist.
- Helmet, JSON body limits, general API rate limiting, and tighter registration/login rate limiting are enabled.
- Authentication failures avoid exposing whether an email exists, and unexpected errors do not return internal details.

These controls reduce common risks but are not a claim that the application is deployment-ready. Production infrastructure, provider verification, monitoring, backups, and operational response remain separate launch work.

## Google and Gmail controls

- OAuth uses an opaque random `state`; a short-lived signed httpOnly cookie binds its hash to the authenticated OwnTrace user.
- The callback verifies Google's signed ID token and uses the stable OpenID `sub` rather than email as the provider identity key.
- Access and refresh tokens are encrypted at rest with AES-256-GCM and are excluded from normal model queries and every API response.
- OwnTrace requests exactly `openid`, `email`, and `gmail.metadata`, without automatically including earlier grants. It does not request send/modify/delete permissions. Gmail metadata remains a Google restricted scope and production release requires the applicable Google verification and security-assessment process.
- Sync requests selected `From`, `Subject`, and `Date` headers only. Full bodies, snippets, raw messages, and attachments are not requested or stored.
- Provider message/thread IDs are HMAC-derived. Email addresses and long numeric strings are redacted from the stored normalized subject signal.
- Account discovery scopes every signal, evidence record, and account to the authenticated user. Internal Gmail signal and connection identifiers are excluded from evidence serialization.
- Account list, detail, and summary queries always include the authenticated user ID. Invalid, missing, and cross-user account identifiers share the same safe not-found response to reduce IDOR disclosure.
- Account list input uses allowlisted filters/sorts, escaped search patterns, pagination, and a maximum page size of 100. Detail evidence is capped at the 100 most recent minimized records.
- Identity graph queries are user-scoped and return derived typed relationships only. Provider account IDs, tokens, Gmail identifiers, connection identifiers, raw subjects, and raw evidence are excluded. Visual account nodes are capped at 200.
- Account-action generation and lifecycle updates are user-scoped and deduplicated by user, account, and recommendation type. Cross-user or invalid action IDs use the same safe not-found response. Recommendations contain derived explanations only and never claim universal account deletion capability.
- Marketing-only and unclassified messages cannot independently produce likely or confirmed account ownership.
- Disconnect first attempts provider revocation, then removes the local connection, sync job, derived Gmail signals, Gmail-derived evidence, actions for deleted accounts, and accounts with no remaining evidence. Network revocation failures retain local data so the user can safely retry.
- Permanent OwnTrace account deletion requires the authenticated user's current password and an exact text confirmation. It attempts provider revocation, removes every Anas-owned user record, and reports when Google revocation could not be confirmed without retaining the local data the user asked to delete.
- Dashboard, subscription, breach-status, exposure, Privacy Health, Privacy Inbox, privacy-request, and notification routes require authentication. Queries are bounded and every persistent lookup includes the authenticated user ID.
- Subscription and exposure views return derived account evidence only. Security-alert and password-reset metadata is never called a verified breach. Verified breach checks are manual opt-in only: OwnTrace tells the user that it sends the signed-in account email to XposedOrNot, caches only minimal breach names and safe timestamps for 24 hours, and never sends Gmail data, passwords, or discovered account data.
- The XposedOrNot request uses a fixed server-side endpoint, an encoded account email, a short timeout, no redirects, and safe dependency errors. Provider responses, request URLs, and account emails are never logged or returned.
- The free XposedOrNot allowance is process-local for the current single-instance beta: sliding limits of 90 outbound checks per 24 hours, 20 per hour, and one per second. Cached results do not use it. Horizontal scaling requires a shared atomic limiter before deployment.
- Privacy Health is a deterministic estimate over minimized account and action summaries plus cached verified breach names, not a claim of current account compromise or external security certification.
- Privacy requests are manual tracking records and are not transmitted to third parties. Account deletion removes them through the Raphael-owned deletion hook.
