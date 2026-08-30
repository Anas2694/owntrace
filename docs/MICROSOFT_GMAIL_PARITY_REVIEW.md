# Microsoft/Gmail parity hardening review

Status: implementation and review record for PR #20.

## Review method

The branch was reviewed as a provider-integration change, not as a general project review. The analysis compared the current working tree with `HEAD`, traced each Microsoft route into its service and model, followed the resulting records into the shared dashboard/account/identity services, and checked the browser state transitions for initial load, reload during a scan, cancellation, disconnect, and partial API failure.

The review was adversarial in four ways:

1. **Data-flow tracing:** follow a Microsoft signal from Graph response to `MicrosoftSignal`, `AccountEvidence`, `Account`, account actions, subscriptions, identity graph, and deletion.
2. **Cross-provider checks:** run the same user through Gmail first and Microsoft second, then reverse the order and disconnect one provider. This exposes overwrite and stale-record bugs that a Microsoft-only test misses.
3. **Lifecycle/race checks:** inspect concurrent start requests, lease expiry, cancellation while a batch is in flight, OAuth account switching, refresh-token races, reload during `SCANNING`/`PROCESSING`, and deletion when provider cleanup fails.
4. **Contract/UI checks:** compare route response shapes and status states with the React page, including pagination/batch continuation, error recovery, and provider-neutral dashboard copy.

## Findings, cause, fix, and verification

### P1 — Microsoft scanning could erase Gmail account evidence

- **How it was found:** The Microsoft completion path called `discoverAccountsFromSignals` with only Microsoft signals. The account service writes aggregate fields such as `evidenceCount`, confidence, dates, and evidence classes with `$set`, so the input list was the complete source of truth even though the account model is shared by providers.
- **What it meant:** Running Microsoft after Gmail could reduce or replace the account’s Gmail-derived aggregate. The dashboard would become order-dependent.
- **Fix:** `discoverAccountsForUser` now loads Gmail and Microsoft signals, tags each signal with its evidence field, merges and sorts them, then recomputes the account from the union. Microsoft sync calls this shared recomputation path.
- **Testing:** Add a regression test with one Gmail and one Microsoft signal for the same domain; assert both evidence records remain and the aggregate count/confidence includes both. Repeat after disconnecting one provider and assert the remaining provider’s aggregate is rebuilt.

### P1 — Disconnect/account switching could leave stale shared discoveries

- **How it was found:** Microsoft OAuth account switching deleted Microsoft signals/jobs/subscriptions but did not remove `AccountEvidence`. Disconnect removed evidence but only deleted the Account document when no evidence remained; it did not recompute an Account that still had evidence from another provider.
- **What it meant:** Old Microsoft accounts could remain visible after switching identities, and surviving accounts could retain stale aggregate counts.
- **Fix:** Account switching calls `removeConnectionDiscoveries` first. Removal now recomputes all providers for affected accounts before deleting accounts with no remaining evidence.
- **Testing:** Create two Microsoft connections sequentially for one user, switch identities, and verify old evidence/accounts are gone. Create Gmail+Microsoft evidence for one service, disconnect Microsoft, and verify the Gmail-only aggregate remains accurate.

### P1 — Identity graph was Google-only

- **How it was found:** The graph service imported only `GoogleConnection` and looked up evidence only by that connection. A Microsoft-only user therefore had no connected identity node or provider edge.
- **What it meant:** Microsoft was connected in the connection page but absent from the dashboard identity graph.
- **Fix:** The graph now loads both provider connections, emits provider-specific identity nodes and edges, and calculates connected identity counts across both providers.
- **Testing:** Add Google-only, Microsoft-only, and dual-provider graph tests. Assert node types, provider edges, account counts, and user isolation.

### P1 — Cancellation cleanup was only process-local

- **How it was found:** The in-flight barrier map exists only in one Node process. A second process could cancel/delete while the first process was between its lease check and signal write.
- **What it meant:** A cancelled scan could recreate signals after cleanup, especially after a restart or on multiple instances.
- **Fix:** Jobs persist cancellation time, newly inserted signals carry the originating run ID, and cancellation selects that otherwise-hidden run ID before cleanup. Existing signals keep their original run ownership. A worker that loses its lease to cancellation also removes any late writes from its own run, covering the cross-process check/write race.
- **Testing:** The regression suite cancels an active run and verifies its newly inserted signals are removed while signals from an earlier completed run survive. Full validation also exercises repeated metadata deduplication.

### P2 — Account evidence had a misleading Google-only reference

- **How it was found:** `AccountEvidence.connectionId` declared `ref: 'GoogleConnection'`, while Microsoft evidence stored Microsoft connection IDs in the same field.
- **What it meant:** Population/debugging tools could resolve Microsoft IDs against the wrong collection.
- **Fix:** The misleading model reference was removed and `connectionProvider` was added with `GOOGLE`/`MICROSOFT` values. Existing records remain compatible through the Google default while new discovery writes the explicit provider.
- **Testing:** Validate both provider records and assert serialized API evidence still excludes internal connection identifiers.

### P2 — OAuth refresh race could mark a healthy connection for reconnect

- **How it was found:** Refresh locking was process-local. If another process refreshed first, the conditional update returned no document and the current code immediately changed the connection to `NEEDS_RECONNECT`.
- **What it meant:** A healthy Microsoft connection could be invalidated by a normal multi-instance refresh race.
- **Fix:** When the conditional update loses the race, the service reloads the connection and uses its still-valid encrypted access token instead of forcing reconnect.
- **Testing:** Mock two refreshes with one conditional update losing; assert both callers obtain a valid token and the connection remains connected.

### P2 — Account deletion could stop before local deletion

- **How it was found:** `disconnectMicrosoft` ran outside the existing best-effort Google revocation boundary. Any cleanup error could abort the deletion workflow before sessions, local records, and the user were removed.
- **What it meant:** Account deletion was not reliably destructive of OwnTrace-held data and could leave encrypted provider tokens.
- **Fix:** Microsoft cleanup is best-effort in the deletion workflow; the final local deletion phase still removes all provider records, sessions, and Raphael-owned data.
- **Testing:** Force Microsoft cleanup to reject and assert the user, sessions, connection, signals, jobs, evidence, and Raphael-owned records are still deleted.

### P3 — Reloading the Microsoft page could strand an active scan

- **How it was found:** The page only offered “Resume” for `QUEUED`, and only showed “Cancel” while the current tab’s `isSyncing` flag was true. A reload during `SCANNING` or `PROCESSING` therefore hid recovery controls while the API correctly reported an active job.
- **What it meant:** The user could see a scan that could neither be continued nor cancelled from the page.
- **Fix:** The page polls active persisted statuses, exposes continuation/cancellation for all active states, and uses `Promise.allSettled` so a sync endpoint failure does not hide a successful connection response. Disconnect clears local state and reloads in `finally`.
- **Testing:** API tests cover cancellation and stale-run data retention. Browser review covers active-state controls, mobile layout, keyboard focus, and status announcements; live provider consent remains an environment-specific release check.

### P3 — Dashboard empty-state language was Gmail-specific

- **How it was found:** Dashboard, Accounts, and onboarding copy directed users specifically to Gmail despite Microsoft being a supported source.
- **What it meant:** Microsoft users received incorrect guidance and the dashboard integration appeared incomplete.
- **Fix:** Copy is provider-neutral and the dashboard review link points to a supported connection surface.
- **Testing:** Render empty and populated dashboard states for Gmail-only, Microsoft-only, and dual-provider users; verify links and labels.

## Validation gate

Run from the repository root before committing:

```powershell
cd server
npm test
cd ..\client
npm run lint
npm run build
```

Also run syntax checks on changed server modules, inspect the complete diff, verify no secret file is tracked, and perform browser checks at mobile, tablet, and desktop widths. Provider/OAuth tests must use mocks; no real tokens, message bodies, or `.env` values belong in test output.

## Known release checks

- Existing deployments should run `npm run migrate:account-evidence-indexes` once before rollout so the `AccountEvidence` partial unique indexes replace the legacy Gmail-only unique index.
- Production Microsoft redirect URI and tenant/account-type values must be exact and documented in deployment configuration.
- Microsoft disconnect currently removes OwnTrace-local access and data. Any provider-side consent revocation must use a separately verified Microsoft-supported mechanism; do not broaden permissions or revoke the user’s entire Microsoft session.
