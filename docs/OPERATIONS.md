# Operations runbook

## Initial beta objectives

These provisional objectives are calibrated for a small, single-instance beta and require owner approval before launch:

- Availability target: 99.0% monthly, excluding announced maintenance
- OwnTrace API latency target: p95 below 1 second for non-provider requests
- Error target: fewer than 1% server errors over 15 minutes
- Recovery point objective (RPO): 24 hours
- Recovery time objective (RTO): 4 hours
- Supported browsers: current Chrome, Edge, Firefox, and Safari; responsive web from 320 px upward

Google, Microsoft, and XposedOrNot response time and availability are external dependencies and should be reported separately from OwnTrace API latency.

## Signals and alerts

Configure the hosting platform to collect JSON logs and retain only the period approved by the privacy owner. Alert a private, named destination for:

- `/api/health/ready` failing for 5 consecutive minutes
- 5xx responses above 5% for 5 minutes
- sustained p95 API latency above 2 seconds for 15 minutes
- container restart loops or memory/CPU saturation
- MongoDB connection, storage, backup, or restore failures
- repeated Google reconnect/rate-limit errors above the expected beta baseline
- repeated Microsoft reconnect/rate-limit errors above the expected beta baseline
- approaching XposedOrNot free-provider limits

Logs contain `event`, `timestamp`, `requestId`, method, path, status, and duration where applicable. They must not ingest request/response bodies, cookies, query strings, authorization data, provider tokens, email addresses, Gmail subject data, or IP addresses.

## Release smoke checklist

Use dedicated test accounts and never a real production user's mailbox:

1. `/api/health` and `/api/health/ready` return `200`.
2. Landing, Privacy Policy, Terms, registration, and login load over HTTPS.
3. Registration, logout, old-cookie replay rejection, login, and session restoration work.
4. Google consent requests exactly `openid`, `email`, and `gmail.metadata`.
5. Gmail scan completes, progress resumes, repeated sync remains idempotent, and no email body is stored or logged.
6. When Microsoft is configured, consent requests exactly `openid`, `profile`, `email`, `offline_access`, `User.Read`, and `Mail.ReadBasic`; its scan and repeated-sync checks pass without reading bodies or attachments.
7. Account and subscription detections are labeled as inferences; single-provider and dual-provider dashboard routes load without console errors.
8. A consented breach check succeeds or returns a safe bounded provider error.
9. Provider disconnect removes its local derived data; Google revocation is confirmed when available; account deletion removes all user-scoped active records.
10. Keyboard, reduced-motion, 390/768/1440 px layouts, and horizontal-overflow checks pass.

## Incident response

1. **Detect and classify:** record start time, affected journey, environment, image SHA, request IDs, and severity without copying personal data.
2. **Contain:** disable the affected integration or roll back the image. Rotate a credential immediately if exposure is suspected.
3. **Preserve minimal evidence:** restrict logs and provider audit data to the incident team; do not export Gmail metadata unnecessarily.
4. **Recover:** deploy the last known-good image, restore only when necessary, and validate readiness plus critical journeys.
5. **Communicate:** use the approved private incident channel and legal notification process. Do not discuss user data in public GitHub issues.
6. **Learn:** document root cause, timeline, impact, remediation, and regression tests; delete incident copies according to retention policy.

## Backup and restore

Enable encrypted managed MongoDB backups with at least daily recovery points and access restricted to the database owner. Before launch, restore the latest backup into an isolated non-production project, verify collection/index counts and representative authentication-owned records, then delete the restored test environment. Record the date, backup identifier, operator, duration, and result in the readiness artifact. A configured backup without a successful restore test is not launch evidence.

## Capacity and scaling

Start with one API instance. Record CPU, memory, database connections, response sizes, and p95/p99 latency during the release load test. Before adding an instance, replace both Express in-memory rate limiting and the XposedOrNot limiter with a shared atomic store. Reassess free-provider terms and limits before the beta grows.
