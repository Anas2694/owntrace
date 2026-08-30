# OwnTrace production readiness

Review date: 31 August 2026

Review branch: `anas/post-merge-hardening`

Base commit: `0f30dfc6b902f86b2e03d3cf04ccb2a9005b462f`

## Verdict

**BLOCKED for public production launch.** The repository-owned hardening work is in progress and the current website is suitable for a controlled local/test-user beta after validation. Public launch remains blocked by external environment, provider-approval, monitoring, backup/restore, legal-review, and staging evidence that cannot be created by source code alone.

## Service and assumptions

OwnTrace is a low-volume, single-instance MERN web beta serving a React client and Express API from one HTTPS origin with managed MongoDB. It integrates with Google OAuth/Gmail metadata, optional Microsoft OAuth/Outlook metadata, and the free XposedOrNot endpoint. Provisional targets are 99.0% monthly availability, p95 under 1 second for non-provider API work, RPO 24 hours, and RTO 4 hours. These targets require owner approval.

## Gate status

| ID | Category | Status | Evidence / required follow-up | Owner |
| --- | --- | --- | --- | --- |
| PR-001 | Build | Passed | Lint, production build, syntax, 118 tests across 12 files, browser matrix, production smoke, dependency audits, and pull-request CI passed. | Engineering |
| PR-002 | Configuration | Implemented, unverified in hosting | Startup validation and `docs/ENVIRONMENT.md` exist; production values and rotation ownership must be configured in a secret store. | Deployment/security |
| PR-003 | Security | Code gate passed | Root `SECURITY_REVIEW.md` records no open Critical/High finding and one remediated Medium session-replay finding. | Engineering/security |
| PR-004 | Health/shutdown | Local pass; hosting pending | Liveness, MongoDB readiness, request IDs, bounded timeouts, redacted logs, and graceful shutdown passed the production-process smoke; verify signals in the selected platform. | Engineering/hosting |
| PR-005 | Deployment/rollback | Documented, unverified | Container, immutable-image deployment, and rollback steps exist in `docs/DEPLOYMENT.md`; hosting/domain are not selected. | Owner/hosting |
| PR-006 | Monitoring | Blocked | Configure log storage, uptime checks, metrics, alert rules, private destination, retention, and access. | Owner/operations |
| PR-007 | Backup/restore | Blocked | Enable encrypted managed backups and complete a recorded isolated restore test. | Owner/database |
| PR-008 | Google production | Blocked | Complete OAuth verification and the applicable restricted-scope security assessment; keep access to test users meanwhile. | Google Cloud owner |
| PR-013 | Microsoft integration | Locally implemented; live validation blocked | Add environment-specific Entra credentials, then validate consent, token refresh, metadata sync, idempotency, disconnect, and deletion with an approved disposable account. | Microsoft integration owner |
| PR-014 | Account-evidence migration | Isolated validation passed; target pending | On 31 August 2026 the migration removed a seeded legacy index, created both provider-aware partial indexes, and passed a second idempotent run in disposable MongoDB. Back up and migrate the eventual staging database before deployment. | Database owner |
| PR-009 | Legal/privacy | Blocked | Draft policy/terms exist; add operator/jurisdiction/private contact/retention decisions and obtain owner/legal approval. | Owner/legal reviewer |
| PR-010 | External workflows | Blocked | Validate real staging OAuth, token refresh, Gmail sync, disconnect/revocation, and XposedOrNot outage/rate-limit behavior with approved test accounts. | Owner/engineering |
| PR-011 | Capacity | Blocked | Run a representative single-instance load test and record latency, errors, saturation, database connections, and recovery. | Engineering/operations |
| PR-012 | Automatic privacy requests | Deferred | Product clearly states requests are manually tracked. A delivery provider/legal workflow is not selected and is outside the initial beta boundary. | Product owner |

## Required launch evidence

- Reviewed and passing release-readiness pull request and GitHub CI
- Hosting platform, final domain, TLS, proxy topology, and immutable image SHA
- Production/preview configuration inventory with named secret owners
- Google production approval or an explicitly limited test-user beta
- Monitoring dashboard, alert destination, log retention/access, and uptime check
- Successful encrypted backup plus isolated restore record
- Approved privacy policy, terms, private support contact, retention, and incident-notification process
- Staging critical-journey, configured-provider OAuth, browser/accessibility, load, shutdown, migration, and rollback results

Deployment, rollback, smoke, incident, backup, and scaling procedures are in `docs/DEPLOYMENT.md` and `docs/OPERATIONS.md`. This artifact must be refreshed with the final commit and evidence before its verdict can change.
