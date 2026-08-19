# Account discovery

## Boundary

Account discovery is deterministic and uses only minimized `GmailSignal` records already stored by the Gmail integration. It does not read message bodies, snippets, raw MIME, attachments, or provider tokens.

The pipeline runs after a Gmail sync reaches a completed bounded batch:

```text
GmailSignal
  -> public-suffix-aware sender-domain normalization
  -> evidence classification
  -> user and service aggregation
  -> explainable confidence
  -> AccountEvidence and Account upserts
```

Account browsing endpoints and frontend screens consume these derived records through a separate account read layer; they do not reimplement discovery.

## Evidence classes

- `ACCOUNT_CREATED`
- `ACCOUNT_VERIFICATION`
- `WELCOME`
- `LOGIN_ALERT`
- `OTP`
- `PASSWORD_RESET`
- `SECURITY_ALERT`
- `SUBSCRIPTION`
- `PAYMENT`
- `ACCOUNT_DELETION`
- `OTHER`

Rules are evaluated in a fixed order and store a reason code and numeric evidence weight. Marketing, discount, newsletter, and unsubscribe language maps to low-weight `OTHER` evidence and is not treated as an ownership signal.

## Confidence

Confidence is reproducible from the stored evidence:

1. Start with the strongest ownership-evidence weight.
2. Add up to 12 points for corroborating ownership signals.
3. Add up to 8 points for distinct ownership evidence classes.
4. Cap the result at 100.

If no ownership signal exists, confidence is capped at 20.

Levels:

- `CONFIRMED`: 90-100
- `LIKELY`: 70-89
- `POSSIBLE`: 40-69
- `UNKNOWN`: 0-39

These levels describe evidence strength, not universal proof that an account exists or is still active.

## Data model

`Account` stores the user-scoped service key, display name, primary domain, confidence result, evidence counts/classes, and first/last observed timestamps.

`AccountEvidence` stores the account relationship, evidence class, weight, ownership flag, reason code, source domain, and occurrence timestamp. Internal Gmail signal and Google connection identifiers remain server-only.

Unique indexes enforce:

- one account per user and normalized service domain
- one evidence record per user and Gmail signal

Repeated discovery runs update the same records instead of duplicating them.

## Dormancy inference

Dormancy uses only the most recent ownership evidence date; marketing-only signals cannot make an account appear active.

- `ACTIVE`: account-related ownership evidence within 12 months
- `POSSIBLY_DORMANT`: no account-related ownership evidence within 12 months
- `DORMANT`: no account-related ownership evidence within 24 months
- `UNKNOWN`: no ownership evidence is available

The account APIs refresh these time-based states before returning account data. The reason is stored and returned with the status. These labels are inferences about observed evidence, not confirmation that an external account is open, used, or closed.

Completed discovery also refreshes deterministic account-action recommendations. Recommendation generation is idempotent and remains a separate layer from discovery scoring.

## Disconnect behavior

Google disconnect first revokes provider access. It then removes the connection's Gmail signals and account evidence. An account is removed only when no evidence remains for that user and account; actions belonging to a removed account are deleted with it.
