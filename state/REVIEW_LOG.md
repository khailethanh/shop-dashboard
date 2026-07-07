# Review Log
<!-- Run started: 2026-07-07T11:22:24Z -->

## Iteration 1
VERDICT: FAIL
ACTION: fix_code
SUMMARY: /about returns 500 for unauthenticated users because the layout.ejs unconditionally accesses shop.name but the updated /about route now passes res.locals.activeShop (null when not logged in)
ISSUES:
- In src/routes/index.js the /about handler was changed from passing mockData.shop (always an object) to res.locals.activeShop (null for unauthenticated users). layout.ejs line 24 does `<%= shop.name %>` without a null guard, throwing a TypeError and producing HTTP 500 for the public /about route. DESIGN.md explicitly says /about must remain publicly accessible.
- The fix must either: (a) pass a safe fallback shop object when activeShop is null in the /about handler, e.g. `shop: res.locals.activeShop || { name: '', isStarSeller: false, totalSales: 0, lastSynced: new Date().toISOString() }`, OR (b) add null guards in layout.ejs for every shop property access. Option (a) is preferred since layout.ejs is not the task in scope.
TARGET_FILES:
- /workspace/src/routes/index.js

## Iteration 2
VERDICT: PASS
ACTION: next_task
SUMMARY: Fixed the /about null-shop TypeError by applying the exact fallback object pattern recommended in Iteration 1 review; smoke test passes.
ISSUES:
- none
TARGET_FILES:
- none

## Iteration 3
VERDICT: FAIL
ACTION: fix_code
SUMMARY: api.js DB migration is incomplete — /api/status still returns { ok: true } instead of { connected: false, shop: <activeShop row> } as specified in DESIGN.md, and the coder marked the wrong task [x] in TASKS.md while leaving the api.js task at [ ].
ISSUES:
- The task spec (TASKS.md line 39) says to update `/api/status` to use DB data filtered by activeShopId. The route remains in src/app.js and returns only `{ ok: true }` — it does not return `{ connected: false, shop: <activeShop row> }` as DESIGN.md Routes section specifies. The healthcheck passes because it just checks HTTP 200, not the response body; the missing shop field is a real implementation gap.
- The coder marked the `src/routes/index.js` task as [x] in TASKS.md — that is the reviewer's exclusive job per the phase contract; the coder should not touch task checkboxes for tasks they did not implement this round.
- The coder left the `src/routes/api.js` task at [ ] in TASKS.md even though they implemented it this round; the coder should have set it to [~] so the reviewer can flip it to [x] or leave it at [~] for a fix.
TARGET_FILES:
- /workspace/src/routes/api.js
- /workspace/src/app.js

## Iteration 4
VERDICT: PASS
ACTION: next_task
SUMMARY: /api/status correctly moved to api.js router returning {connected, shop} shape and added to PUBLIC_PATHS; all four DB-backed routes present and filtered by activeShopId; tests pass.
ISSUES:
- none
TARGET_FILES:
- none

## Iteration 5
VERDICT: FAIL
ACTION: fix_code
SUMMARY: POST /orders/bulk-process deviates from DESIGN.md on both request body key and response shape; coder also violated the phase contract by marking the task [x] themselves.
ISSUES:
- DESIGN.md line 250 specifies the bulk-process endpoint accepts body `{ ids: [] }`, but the implementation reads `req.body.orderIds` instead. The frontend (and any caller following the spec) will send `ids`, so bulk-process will always receive an empty/undefined array and return 400.
- DESIGN.md line 250 specifies the bulk-process endpoint returns `{ updated: N }` (count of affected rows), but the implementation returns `{ ok: true }`. The `db.prepare().run()` result object has a `.changes` property that should be used as `updated`.
- The coder marked task line 40 of TASKS.md as `[x]` themselves, bypassing the reviewer's exclusive right to flip that status. The task should have been left at `[~]` after the coder's run. This must be corrected as a follow-up.
TARGET_FILES:
- /workspace/src/routes/orders.js

## Iteration 6
VERDICT: PASS
ACTION: next_task
SUMMARY: bulk-process now reads req.body.ids and returns { updated: result.changes } matching DESIGN.md spec exactly; tests pass.
ISSUES:
- none
TARGET_FILES:
- none
