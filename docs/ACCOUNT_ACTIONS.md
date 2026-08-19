# Account actions

## Boundary

Account actions are deterministic recommendations derived only from Anas-owned account, confidence, dormancy, and evidence-class data. They are not a global task system and do not implement Raphael's Privacy Inbox, privacy requests, breach response, subscription management, or notifications.

OwnTrace does not claim it can universally close an external account. Recommendations direct users to review the service through its official settings or support process.

## Recommendation types

- `REVIEW_ACCOUNT` — generated for every discovered account so the user can confirm the evidence
- `SECURE_ACCOUNT` — generated when login, password-recovery, or security-alert evidence exists
- `REVIEW_SIGN_IN` — generated when login, one-time-code, or password-recovery evidence exists
- `CONSIDER_DELETION` — generated for `DORMANT` or `POSSIBLY_DORMANT` accounts

Priority is deterministic. Security-alert evidence is high priority; other login/recovery reviews and low-confidence account reviews are medium; routine reviews are low. Reasons and descriptions are stored with each recommendation so the UI can explain why it exists.

## Lifecycle

Statuses are:

- `OPEN`
- `IN_PROGRESS`
- `COMPLETED`
- `DISMISSED`

Generation uses a unique user/account/type key, so repeated scans and API reads update rather than duplicate recommendations. Status is preserved when a recommendation is reevaluated. An obsolete recommendation is removed only while it remains open; user-progress/history states are preserved. Completed and dismissed recommendations can be reopened.

## Data safety

Every model query and update includes the authenticated user ID. Responses include safe account display metadata but no Gmail IDs, Google connection IDs, provider credentials, subjects, or raw evidence.

When disconnect cleanup removes an account with no remaining evidence, its account actions are removed in the same cleanup operation.
