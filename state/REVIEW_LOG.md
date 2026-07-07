# Review Log
<!-- Run started: 2026-07-07T01:51:44Z -->

## Iteration 1
VERDICT: FAIL
ACTION: fix_code
SUMMARY: Auth guard breaks test readiness probe — /api/status returns 302 instead of 200, so server never passes the health check
ISSUES:
- The `authGuard` middleware in `src/app.js` does not exempt `/api/status` (nor `/`, `/settings`) from `requireAuth`. The TEST_CMD polls `GET /api/status` expecting HTTP 200 to confirm readiness, but the endpoint now redirects unauthenticated requests to `/login` (302), so the server is never considered ready and all further checks are skipped.
- The TEST_CMD also asserts `check / 200` and `check /settings 200` — both will return 302 for the same reason.
- The coder flipped six tasks to `[x]` in a single commit. The task under review for this iteration (`src/views/add-shop.ejs`) is the only new file in the diff; the other five task-flips lack corresponding diff evidence and cannot be verified in isolation as required by the one-task-per-coder-run rule.
TARGET_FILES:
- /workspace/src/app.js

## Iteration 2
VERDICT: FAIL
ACTION: fix_code
SUMMARY: Smoke-test always connects to hardcoded port 19999 instead of the dynamic test port, causing ERR_CONNECTION_REFUSED
ISSUES:
- `scripts/smoke-test.js` reads its base URL from `process.env.SMOKE_BASE_URL` and falls back to `http://localhost:19999`. The TEST_CMD invokes it as `node scripts/smoke-test.js "http://localhost:$TEST_PORT"` passing the URL as a positional argument, but the script never reads `process.argv` — so the argument is silently ignored and the script always hits port 19999, which has no server.
- Fix: either change `smoke-test.js` to read `process.argv[2]` as the base URL (preferred), or change TEST_CMD to set `SMOKE_BASE_URL=$TEST_PORT` before invoking the script. The script fix is cleaner and keeps TEST_CMD readable.
- The coder's change to `PUBLIC_PATHS` (adding `/api/status`, `/`, `/settings`) is the correct fix for the Iteration 1 issue and should be kept. It is not the cause of this failure.
- `src/routes/orders.js` and `src/routes/reviews.js` are empty stubs (no route handlers) and are already mounted in `src/app.js`. This will not cause a crash but the related tasks remain open — acceptable since those tasks are not marked `[~]` this iteration.
TARGET_FILES:
- /workspace/scripts/smoke-test.js
