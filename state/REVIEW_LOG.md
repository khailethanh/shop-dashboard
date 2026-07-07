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
