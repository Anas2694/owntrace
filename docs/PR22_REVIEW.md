# PR #22: reliability and user-flow review

Date: 5 September 2026. Branch: `anas/post-merge-hardening`.

## What changed

- Temporary database failures return a retryable session error, without clearing a valid session. Failed server-side logout no longer reports success. Older browser session requests are cancelled before they can overwrite newer authentication state.
- Gmail starts are atomic. Each batch owns a run/lease; disconnect waits for the active batch before deleting discoveries. A cap such as 37 stops at exactly 37 rather than the next multiple of 25.
- Both providers reject reconnecting a different identity over an existing connection, preventing refresh-token reuse across identities. Completed onboarding stays completed after Google reconnect/disconnect.
- Scan errors stay visible after status reloads. Leaving a scan stops scheduling further batches. Completed scans refresh the session and link directly to Accounts.
- Reviewing an earlier onboarding step does not write a backwards transition. Users can complete the privacy introduction without connecting a provider. Settings remains accessible before setup is complete.
- One workspace navigation replaces the duplicate header. Seven primary destinations remain; additional tools are expandable. No product records or features were deleted.
- Dashboard requests drop from eight to two. Independent results survive partial API failures. Actions now includes in-progress, completed, and dismissed views. Shared pagination supports both existing API page-count field names.
- The home-page 3D map labels your digital identity and four review areas. Each button changes an explanation. It contains no live counters, security guarantees, or invented metrics.
- Removed the unused dashboard preview and its CSS, duplicate workspace header/styles, and the GitHub footer link. Git retains their history. Local `output/`, `tmp/`, and environment files were preserved.
- Updated the vulnerable transitive `qs` dependency using the existing compatible dependency range. Three.js is pinned and lazy-loaded; no copied library source or third-party visual assets were added.

## Other PR reviewed

Reviewed PR #23 at `eb5be3989ee90c5aae80b2c58dd90dd02d458f56`. Its capability-selector interaction informed the identity explorer. Its fabricated counters, text-scrambling controls, extra scrolling runtime, copied site assets, and vendored libraries were not imported. PR #22 remains the base; neither PR is merged by this work.

## Design decisions and skill checks

Reading: a personal privacy workspace, retaining PR #22's dark green visual direction. Energy 1, rhythm 2, motion 1. This is a workflow improvement, not a replacement of the chosen brand.

The existing green accent identifies the primary action and selected map area. System sans-serif type keeps forms and evidence readable without a new font download. The dashboard prioritizes the next decision instead of repeating every feature's data. Consistent navigation prevents users from learning a different menu on each screen. The 3D centre represents the user's identity; its four connections explain Accounts, Subscriptions, Breach reports, and Privacy actions. Brief, selection-triggered rotation gives feedback; there is no continuous ornamental loop.

- Function/state checks: registration, onboarding backtracking, optional connections, authenticated redirects, partial dashboard failure, action status transitions, scan failure/retry, and logout exercised.
- Layout checks: 18 public/protected routes at 390, 768, and 1440 px; no horizontal overflow in these tested states.
- Keyboard checks: expanded mobile navigation contains focus, including More tools; Escape restores trigger focus. Identity controls work with keyboard and reduced motion.
- Contrast calculations: muted text on the map surface 8.57:1; primary button text 12.14:1; secondary control border 5.51:1; connector line 3.11:1. Connector color is not used for normal text.
- Content checks: map is explicitly illustrative, explanations state provider limits, and no numeric security promise is introduced.

These are scoped checks, not a claim of complete WCAG certification, every possible device state, or a bug-free product.

## Reproduce the checks

Run the normal suite:

```powershell
npm run validate
npm audit
npm audit --prefix client
npm audit --prefix server
npm run smoke:production --prefix server
node scripts/check-tracked-secrets.mjs
git diff --check
```

Use two terminals for isolated browser QA:

```powershell
node server/scripts/serve-qa.mjs
```

```powershell
npm run dev --prefix client -- --config vite.qa.config.js
```

Then, with Playwright CLI installed:

```powershell
playwright-cli -s=owntrace-pr22 open http://localhost:5175 --browser=chrome
playwright-cli -s=owntrace-pr22 run-code --filename=scripts/check-browser-journey.js
playwright-cli -s=owntrace-pr22 run-code --filename=scripts/check-browser-recovery.js
playwright-cli -s=owntrace-pr22 close
```

The QA API binds to loopback port 5056, creates an ephemeral MongoDB instance, disables providers, and does not load `.env`. Stop both QA terminals afterward. Browser registration uses a synthetic account. Populated action and provider recovery tests intercept responses; they do not invoke real OAuth or inboxes.

## Results and remaining limits

- 130 Vitest tests across 14 files passed; lint and server syntax checks passed.
- Production build passed. Vite reports a size advisory for the lazy 3D chunk (524.53 kB minified, 131.47 kB gzip); it is separate from the initial application bundle. This remains a performance follow-up, not a runtime error.
- All three dependency audits passed with zero known vulnerabilities after updating `qs`.
- Production smoke passed; 100 concurrent local health requests had 171 ms p95. This is not production capacity evidence.
- Happy-path browser checks had no uncaught errors or console warnings. Recovery tests intentionally generate HTTP 429/503 responses and verify the visible retry states.
- Production smoke originally inherited local Microsoft configuration through dotenv; the harness now explicitly disables Microsoft and passed on rerun.
- Live Google/Microsoft OAuth, provider revocation, real inbox results, deployment behaviour, and multi-instance worker coordination were not validated here. The in-process disconnect barrier assumes the existing single API process; horizontal scaling needs distributed worker coordination.
- PR #22 stays draft until the separately documented live-integration and release checks pass.
- Latest browser rerun: the logout request ends the session, but the redirect can land on `/login` instead of `/`. The strict redirect assertion failed. Resolve this navigation race and rerun the recovery script before treating the change as merge-ready. The user requested a visual preview before any merge.
