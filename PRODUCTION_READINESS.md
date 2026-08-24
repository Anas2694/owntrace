# OwnTrace production readiness

Review date: 24 August 2026

Review branch: `anas/release-readiness`

Base commit: `26c2d2e04e7e50ae17d821858e9521c82e81806b`

## Verdict

**BLOCKED for public production launch.** The repository-owned hardening work is in progress and the current website is suitable for a controlled local/test-user beta after validation. Public launch remains blocked by external environment, provider-approval, monitoring, backup/restore, legal-review, and staging evidence that cannot be created by source code alone.

## Service and assumptions

OwnTrace is a low-volume, single-instance MERN web beta serving a React client and Express API from one HTTPS origin with managed MongoDB. It integrates with Google OAuth/Gmail metadata and the free XposedOrNot endpoint. Provisional targets are 99.0% monthly availability, p95 under 1 second for non-provider API work, RPO 24 hours, and RTO 4 hours. These targets require owner approval.

## Gate status

| ID | Category | Status | Evidence / required follow-up | Owner |
| --- | --- | --- | --- | --- |
| PR-001 | Build | Passed | Fresh lockfile installs, lint, production build, syntax, 105 tests, browser matrix, production smoke, dependency audits, and the PR Docker image build passed. | Engineering |
| PR-002 | Configuration | Implemented, unverified in hosting | Startup validation and `docs/ENVIRONMENT.md` exist; production values and rotation ownership must be configured in a secret store. | Deployment/security |
| PR-003 | Security | Code gate passed | Root `SECURITY_REVIEW.md` records no open Critical/High finding and one remediated Medium session-replay finding. | Engineering/security |
| PR-004 | Health/shutdown | Local pass; hosting pending | Liveness, MongoDB readiness, request IDs, bounded timeouts, redacted logs, and graceful shutdown passed the production-process smoke; verify signals in the selected platform. | Engineering/hosting |
| PR-005 | Deployment/rollback | Documented, unverified | Container, immutable-image deployment, and rollback steps exist in `docs/DEPLOYMENT.md`; hosting/domain are not selected. | Owner/hosting |
| PR-006 | Monitoring | Blocked | Configure log storage, uptime checks, metrics, alert rules, private destination, retention, and access. | Owner/operations |
| PR-007 | Backup/restore | Blocked | Enable encrypted managed backups and complete a recorded isolated restore test. | Owner/database |
| PR-008 | Google production | Blocked | Complete OAuth verification and the applicable restricted-scope security assessment; keep access to test users meanwhile. | Google Cloud owner |
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
- Staging critical-journey, browser/accessibility, load, shutdown, and rollback results

Deployment, rollback, smoke, incident, backup, and scaling procedures are in `docs/DEPLOYMENT.md` and `docs/OPERATIONS.md`. This artifact must be refreshed with the final commit and evidence before its verdict can change.
