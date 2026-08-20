# Identity graph

## Purpose

The first OwnTrace website graph is a derived view over existing owned records. It does not introduce a graph database or duplicate account discovery. It answers:

- which sign-in email belongs to the OwnTrace profile
- which Google identity is currently connected
- which discovered accounts have evidence from that Google identity
- which service domain corresponds to each discovered account

## Nodes

- `PROFILE` — the authenticated OwnTrace user
- `EMAIL_IDENTITY` — the OwnTrace sign-in email
- `GOOGLE_IDENTITY` — safe metadata for the connected Google identity
- `ACCOUNT` — a discovered, user-scoped account with confidence
- `SERVICE` — the normalized service domain for an account

## Edges

- `AUTHENTICATES_AS` — profile to sign-in email
- `CONNECTED_IDENTITY` — profile to connected Google identity
- `DISCOVERED_ACCOUNT` — connected Google identity to an account derived from its evidence
- `HAS_ACCOUNT_EVIDENCE` — profile to an account when no current provider relationship remains
- `BELONGS_TO_SERVICE` — account to normalized service domain

Every query is scoped to the authenticated user. The response excludes provider account IDs, OAuth tokens, Gmail message identifiers, connection identifiers, raw subjects, and raw evidence.

## Scale boundary

The graph summary reports the full account and service counts. The visual node set is capped at the 200 highest-confidence accounts so the API and browser do not load an unbounded graph. When capped, `summary.truncated` is `true`; the paginated Accounts API remains the complete browsing contract.

## Deferred nodes

Phone, device, permission, breach, subscription, and other Raphael-owned or future domains are intentionally absent. They can be integrated later through owned API contracts rather than direct collection access.
