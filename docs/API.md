# API

The API is served from `/api` and returns JSON.

## Health check

`GET /api/health`

Response (`200 OK`):

```json
{
  "success": true,
  "message": "OwnTrace API is running"
}
```

No authentication is required for the health check.

## Authentication

Authentication uses the `owntrace_session` httpOnly cookie. Successful registration and login responses set the cookie; clients must send requests with credentials enabled. Password hashes and JWTs are never returned in JSON.

### Register

`POST /api/auth/register`

Request:

```json
{
  "name": "Example User",
  "email": "user@example.com",
  "password": "a passphrase with at least 12 characters"
}
```

Response (`201 Created`):

```json
{
  "success": true,
  "user": {
    "id": "...",
    "name": "Example User",
    "email": "user@example.com",
    "authProviders": ["password"],
    "emailVerified": false,
    "onboardingStatus": "NOT_STARTED",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

Duplicate emails return `409 EMAIL_IN_USE`. Invalid fields return `400 VALIDATION_ERROR` with a field-keyed `errors` object.

### Login

`POST /api/auth/login`

Request:

```json
{
  "email": "user@example.com",
  "password": "a passphrase with at least 12 characters"
}
```

Returns `200 OK` with the same safe user shape as registration. Invalid credentials return `401 INVALID_CREDENTIALS` without confirming whether the email exists.

### Current session

`GET /api/auth/me`

Returns `200 OK` with `{ "success": true, "user": { ... } }` for a valid cookie session. Missing, invalid, or expired sessions return `401`.

### Session discovery

`GET /api/auth/session`

Used by the browser during startup. It returns the safe user shape for a valid session or `{ "success": true, "user": null }` when no restorable session exists. Invalid cookies are cleared. This endpoint does not grant access; protected APIs still require authentication middleware and return `401` when unauthorized.

### Logout

`POST /api/auth/logout`

Clears the session cookie and returns:

```json
{
  "success": true,
  "message": "Signed out successfully."
}
```

### Delete OwnTrace account

`DELETE /api/auth/account`

Requires a valid session, the user's current password, and an exact `DELETE` confirmation:

```json
{
  "confirmation": "DELETE",
  "password": "current password"
}
```

OwnTrace attempts to revoke its Google access, clears the session cookie, and permanently removes the authenticated user's profile, Google connection, sync state, minimized Gmail signals, account evidence, accounts, and account actions. The response reports `providerRevocation` as `REVOKED`, `NOT_CONNECTED`, or `FAILED`. A `FAILED` result means local OwnTrace data was still deleted but Google could not confirm provider-side revocation, so the user should review access in Google Account settings. Incorrect password confirmation returns `401 ACCOUNT_DELETION_CONFIRMATION_FAILED`; invalid input returns `400 VALIDATION_ERROR`.

Subscriptions, breaches, and other product APIs remain outside this authentication milestone.

## Onboarding

Both onboarding endpoints require a valid `owntrace_session` cookie. State changes are scoped to the authenticated user.

### Read onboarding status

`GET /api/onboarding`

Response (`200 OK`):

```json
{
  "success": true,
  "onboarding": {
    "status": "NOT_STARTED"
  }
}
```

### Advance onboarding

`PATCH /api/onboarding`

Request:

```json
{
  "status": "PRIVACY_REVIEWED"
}
```

The supported progression is `NOT_STARTED → PRIVACY_REVIEWED → GMAIL_PENDING`. Repeating the current step is idempotent. Unsupported states return `400 INVALID_ONBOARDING_STATUS`; skipping a required step returns `409 ONBOARDING_STEP_OUT_OF_ORDER`.

`GMAIL_PENDING` means the user completed the privacy explanation and is ready to begin connection setup. It does not mean Gmail access has been granted.

## Google connection

All endpoints require a valid OwnTrace session. Provider tokens and the Google account ID are never returned.

### Connection status

`GET /api/google/connection`

Returns whether Google is configured for the current environment and either `connection: null` or safe connection metadata including email, scopes, status, expiry timestamp, and sync timestamps. The response also includes a `capabilities` contract grouped as `confirmed`, `inferred`, and `unsupported`. Each item has a stable ID, current `active` flag, label, and plain-language summary. It never exposes provider IDs or credentials.

### Begin OAuth

`GET /api/google/oauth/start`

Sets a short-lived httpOnly OAuth-state cookie and redirects to Google. The request contains exactly `openid`, `email`, and `https://www.googleapis.com/auth/gmail.metadata`, with offline access for refresh support. OwnTrace does not enable automatic inclusion of scopes granted to other clients or earlier requests.

### OAuth callback

`GET /api/google/oauth/callback`

Validates the session-bound state, exchanges the code on the server, verifies the Google ID token, encrypts provider tokens, and redirects to `/connect/gmail` with a safe result code. Raw provider errors and credentials are not placed in the URL.

### Disconnect

`DELETE /api/google/connection`

Attempts Google token revocation, then deletes the authenticated user's connection, sync state, derived Gmail signals, Gmail-derived account evidence, actions for accounts that are removed, and accounts with no remaining evidence. A provider network failure returns `502 GOOGLE_REVOCATION_FAILED` without deleting local state so revocation can be retried.

## Gmail metadata sync

The sync is split into bounded requests. Every route is scoped to the authenticated user.

- `GET /api/google/sync` — current safe job state or `null`.
- `POST /api/google/sync` — create or restart a queued job (`202 Accepted`) when no batch is active.
- `POST /api/google/sync/next` — process the next batch of up to 25 message IDs and selected metadata headers.
- `DELETE /api/google/sync` — cancel an active job without deleting previously derived signals.

Job states are `QUEUED`, `SCANNING`, `PROCESSING`, `COMPLETED`, `FAILED`, and `CANCELLED`. Progress includes processed/stored counts and an estimated mailbox total; provider page tokens remain server-only. Repeated scans upsert by a user-scoped HMAC message identifier and do not duplicate signals. Starting another scan or advancing a second batch while one is active returns `409 GMAIL_SYNC_IN_PROGRESS` so concurrent browser tabs cannot reset or double-count progress. A stale batch lock can be reclaimed after an interrupted worker.

A completed bounded sync automatically runs deterministic account discovery. Account browsing endpoints are introduced in the separate accounts milestone.

Safe error codes include `GOOGLE_NOT_CONNECTED`, `GOOGLE_RECONNECT_REQUIRED`, `GOOGLE_RATE_LIMITED`, `GOOGLE_REQUEST_FAILED`, `GMAIL_SYNC_NOT_STARTED`, `GMAIL_SYNC_IN_PROGRESS`, `PARTIAL_METADATA_RESULTS`, and `MESSAGE_LIMIT_REACHED`.

## Raphael-owned website APIs

Every endpoint below requires the authenticated `owntrace_session` cookie. List endpoints accept positive `page` and `limit` values; limits are capped at 100, except notifications which are capped at 50. Unsupported query controls return `400`.

### Subscription detections

`GET /api/subscriptions`

Returns authenticated, user-scoped `Subscription` records created deterministically after a completed Gmail metadata scan. Each item includes service identity, `PAYMENT`/`SUBSCRIPTION` evidence basis, confidence, evidence count, optional amount/currency, billing cycle, last payment date, and an explicitly estimated next renewal date. Amounts are integer minor currency units. Ambiguous currency symbols are not converted into amounts, marketing-only messages are excluded, and no detection claims that a subscription is currently active. Repeated scans update the same user/service record instead of creating duplicates.

### Breach status and security signals

`GET /api/breaches`

Returns the authenticated user's cached, paginated verified breach names together with `breachPagination`, check/cache state, and a separately paginated `securitySignals` review list derived from `SECURITY_ALERT` or `PASSWORD_RESET` metadata. Use `breachPage`/`breachLimit` for verified breach records and `signalPage`/`signalLimit` for security signals; each defaults to page 1 with a limit of 24 and is capped at 100. Legacy `page` and `limit` apply to both collections for compatibility. Security signals always have `verifiedBreach: false` and are not verified check findings.

`POST /api/breaches/check`

Requires an explicit consent body before OwnTrace sends the authenticated user's OwnTrace account email to XposedOrNot, an external breach-data service:

```json
{ "consent": true }
```

OwnTrace stores only the XposedOrNot source identifier, up to 500 minimal breach names, safe timestamps, and safe error state; it never stores the submitted email, provider URL, raw provider response, Gmail data, or passwords. Responses larger than 256 KB or outside the expected shape are rejected. Successful results are cached for 24 hours. A second check within that interval returns the cache without contacting XposedOrNot. Actual outbound checks use sliding allowances of 90 per 24 hours, 20 per hour, and one per second for this single-instance beta. A multi-instance deployment must use a shared atomic limiter before scaling. Safe failure codes are `BREACH_CHECK_CONSENT_REQUIRED`, `BREACH_CHECK_IN_PROGRESS`, `BREACH_CHECK_RATE_LIMITED`, and `BREACH_CHECK_UNAVAILABLE`.

### Exposure review

`GET /api/exposures`

Returns a paginated review projection over discovered account evidence. Levels prioritize security-alert and dormant signals. Every item has `verifiedPublicExposure: false`; this endpoint does not claim public data exposure.

### Privacy Health

`GET /api/privacy-health`

Returns `score: null` until account evidence or a verified breach report exists. Otherwise it subtracts bounded penalties for dormant/possibly dormant accounts, lower-confidence accounts, high-priority open actions, and verified breaches from a 100-point baseline. Verified breaches deduct 10 points each, capped at 30. The response includes every factor and identifies the result as a deterministic estimate rather than an audit.

### Privacy requests

- `GET /api/privacy-requests` — paginated records, with optional `status` filter.
- `POST /api/privacy-requests` — create a draft from `serviceName`, `requestType`, and optional `notes`.
- `PATCH /api/privacy-requests/:id` — apply a supported lifecycle transition.

Types are `ACCESS`, `DELETE`, `CORRECT`, and `OPT_OUT`. Statuses are `DRAFT`, `READY`, `SENT`, `COMPLETED`, and `CANCELLED`. `SENT` records a manual user action; OwnTrace does not deliver the request to a third party. Invalid and cross-user IDs return the same safe `404` response.

### Notifications

`GET /api/notifications`

Returns a bounded, read-only projection over open account actions, privacy requests in `READY` or `SENT` state, and currently cached verified breach reports. Notifications are not a separate persistent collection.

## Accounts

All account endpoints require a valid OwnTrace session and scope every query to the authenticated user. Responses never include provider credentials, raw email bodies, normalized subject signals, Gmail message identifiers, or Google connection identifiers.

### List accounts

`GET /api/accounts`

Supported query parameters:

- `page` (default `1`) and `limit` (default `24`, maximum `100`)
- `search` for a service name or domain, maximum 80 characters
- `confidence`: `UNKNOWN`, `POSSIBLE`, `LIKELY`, or `CONFIRMED`
- `dormant`: `UNKNOWN`, `ACTIVE`, `POSSIBLY_DORMANT`, or `DORMANT`
- `sort`: `lastSeen`, `firstSeen`, `serviceName`, or `confidence`
- `direction`: `asc` or `desc`

Response:

```json
{
  "success": true,
  "accounts": [
    {
      "id": "...",
      "serviceName": "Canva",
      "primaryDomain": "canva.com",
      "confidenceScore": 93,
      "confidenceLevel": "CONFIRMED",
      "evidenceCount": 3,
      "ownershipEvidenceCount": 2,
      "dormantStatus": "ACTIVE",
      "dormantReason": "Account-related evidence was detected within the last 12 months.",
      "firstSeenAt": "...",
      "lastSeenAt": "..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 24,
    "total": 1,
    "pages": 1
  }
}
```

Invalid query controls return `400 INVALID_ACCOUNT_QUERY`.

### Account summary

`GET /api/accounts/summary`

This stable integration contract is intended for clients such as Raphael's dashboard:

```json
{
  "success": true,
  "summary": {
    "total": 186,
    "dormant": 47,
    "possiblyDormant": 18,
    "highConfidence": 120,
    "recentlySeen": 32
  }
}
```

`highConfidence` counts scores of 70 or greater. `recentlySeen` counts accounts with any derived signal in the last 90 days. Dormancy uses ownership evidence only.

### Account detail

`GET /api/accounts/:id`

Returns the safe account shape plus up to 100 of its most recent minimized evidence records, `evidenceTotal`, and `evidenceTruncated`. Evidence includes class, weight, ownership flag, reason code, source domain, and occurrence time. Cross-user, missing, and invalid identifiers return `404 ACCOUNT_NOT_FOUND` without revealing whether another user owns the identifier.

## Identity graph

`GET /api/identity`

Requires a valid OwnTrace session. Returns a derived graph containing typed `nodes`, typed `edges`, `generatedAt`, and a `summary`:

```json
{
  "success": true,
  "graph": {
    "nodes": [
      {
        "id": "profile",
        "type": "PROFILE",
        "label": "Example User",
        "detail": "OwnTrace profile",
        "status": "CONFIRMED"
      }
    ],
    "edges": [
      {
        "id": "profile:AUTHENTICATES_AS:email:primary",
        "source": "profile",
        "target": "email:primary",
        "type": "AUTHENTICATES_AS",
        "label": "Authenticates as"
      }
    ],
    "summary": {
      "emailIdentityCount": 1,
      "connectedIdentityCount": 1,
      "accountCount": 186,
      "serviceCount": 186,
      "renderedAccountCount": 186,
      "truncated": false
    },
    "generatedAt": "..."
  }
}
```

Node types are `PROFILE`, `EMAIL_IDENTITY`, `GOOGLE_IDENTITY`, `ACCOUNT`, and `SERVICE`. Edge types are `AUTHENTICATES_AS`, `CONNECTED_IDENTITY`, `DISCOVERED_ACCOUNT`, `HAS_ACCOUNT_EVIDENCE`, and `BELONGS_TO_SERVICE`.

The summary reports full counts. Node rendering is capped at the 200 highest-confidence accounts; `truncated` indicates when the cap applies. Provider IDs, OAuth tokens, Gmail identifiers, connection identifiers, raw subjects, and raw evidence are never returned.

## Account actions

Account actions are account-owned cleanup recommendations, not Raphael's Privacy Inbox or privacy-request system. All endpoints require a valid OwnTrace session and scope reads/updates to the authenticated user.

### List actions

`GET /api/account-actions`

Query parameters:

- `status`: `OPEN` (default), `IN_PROGRESS`, `COMPLETED`, or `DISMISSED`
- `accountId`: optional user-owned account filter
- `page` (default `1`) and `limit` (default `24`, maximum `100`)

Each action includes its type, title, description, explanation, priority, lifecycle status, timestamps, and safe account display metadata. Recommendation types are `REVIEW_ACCOUNT`, `SECURE_ACCOUNT`, `REVIEW_SIGN_IN`, and `CONSIDER_DELETION`. Responses do not include provider credentials, provider identifiers, raw evidence, Gmail identifiers, or subjects.

Invalid filters return `400 INVALID_ACCOUNT_ACTION_QUERY`.

### Action summary

`GET /api/account-actions/summary`

```json
{
  "success": true,
  "summary": {
    "open": 8,
    "inProgress": 2,
    "completed": 5,
    "dismissed": 1,
    "highPriority": 1
  }
}
```

`highPriority` counts high-priority actions that are open or in progress.

### Update action status

`PATCH /api/account-actions/:id`

Request:

```json
{
  "status": "COMPLETED"
}
```

Supported transitions allow open work to start, complete, or dismiss; in-progress work to reopen, complete, or dismiss; and completed/dismissed work to reopen. Repeating the current status is idempotent. Invalid statuses return `400 INVALID_ACCOUNT_ACTION_STATUS`, unsupported transitions return `409 ACCOUNT_ACTION_TRANSITION_NOT_ALLOWED`, and invalid, missing, or cross-user IDs return `404 ACCOUNT_ACTION_NOT_FOUND`.
