# Design: Personal Etsy Shop Dashboard (Phase 2 — Real Personal App)

## Summary

A single-owner Etsy shop dashboard web app rendered server-side with EJS.
Phase 1 (mock data, demo landing page, demo banner) is complete. Phase 2
converts the app into a real personal-use tool: the landing page and demo
framing are removed, the dashboard becomes the root route, and the Orders and
Analytics tabs gain deeper functionality. All data remains mock; no Etsy API
calls are added in this pass. Phase 3 (real OAuth2 + live data) is out of
scope.

---

## Assumptions / Clarifications

- Phase 1 implementation is complete and committed. Phase 2 tasks are additive
  changes and deletions on top of Phase 1 code.
- "Remove landing.ejs and its route" means the file is deleted and `GET /`
  now renders `app.ejs` directly (keeping `/app` as an alias for backward
  compatibility).
- `shippingAddress` and `notes` fields are added to every order in
  `mockData.js`; existing fields are unchanged.
- For the Analytics period toggle (Monthly / Weekly / Daily), new mock data
  arrays `revenueByWeek` and the existing `revenueByDay` are used.
  The toggle switches which dataset the `revenueMonthChart` renders without a
  page reload.
- "% change vs previous period" on the revenue chart title is computed
  client-side from mock data (compare sum of last half vs first half of the
  currently selected period dataset).
- The "Top Listings by Revenue" chart uses a `topListingsByRevenue` array
  added to `analyticsData`. Revenue per listing is computed from orders mock
  data at module load time.
- "Export CSV" on Analytics tab downloads whatever is currently in the visible
  orders table (all filtered rows) as CSV, built entirely client-side (no
  server route).
- The `/auth/etsy` route stays in the codebase but removes the
  "api_key_required" redirect logic — it can redirect to Etsy OAuth or return
  a stub; no user-facing error text.
- Settings page: `?notice=api_key_required` handling is removed; instead a
  static "Connection" section is added showing `Last synced` timestamp and a
  "Next sync" placeholder.
- No text anywhere in the UI mentions "mock data", "demo", or "connect to
  Etsy". The app presents itself as a live personal shop dashboard.
- `recentOrders` remains `orders.slice(-5)` computed at module load.

---

## Stack

| Concern | Choice |
|---|---|
| Runtime | Node.js 20 |
| Framework | Express 4 |
| Templates | EJS (server-side rendering) |
| Styling | Vanilla CSS (`public/css/style.css`) |
| Charts | Chart.js 4 via CDN |
| Icons | Lucide via CDN |
| Storage | No database; mock data in `src/data/mockData.js`; settings in browser localStorage |
| Config | `dotenv` package, reads `.env` at startup |

---

## Container Internal Port

**3000** — the app listens on the port defined by the `PORT` env var, defaulting
to `3000`. The Dockerfile sets `ENV PORT=3000`; docker-compose.yml exposes
`${APP_PORT:-4000}:3000`. The app reads `process.env.PORT` at startup.

---

## File Structure

Phase 2 deletes `src/views/landing.ejs`; all other files from Phase 1 are
retained and modified where noted.

```
etsy-dashboard/            (files at project root, no subdirectory)
├── src/
│   ├── app.js                  ← Express entry; reads PORT from env
│   ├── data/
│   │   └── mockData.js         ← all mock data (Phase 2: add shippingAddress,
│   │                               notes to orders; add topListingsByRevenue,
│   │                               revenueByWeek to analyticsData)
│   ├── routes/
│   │   ├── index.js            ← GET / → app.ejs, GET /app alias, GET /about
│   │   ├── auth.js             ← GET /auth/etsy (no user-facing error), GET /auth/callback
│   │   ├── api.js              ← GET /api/status, GET /api/mock/*
│   │   └── settings.js         ← GET /settings, POST /settings/save
│   └── views/
│       ├── layout.ejs          ← shared HTML shell (unchanged from Phase 1)
│       ├── app.ejs             ← UPDATED: no demo banner; deeper Orders & Analytics tabs
│       ├── about.ejs           ← unchanged
│       └── settings.ejs        ← UPDATED: remove notice handling, add Connection section
├── public/
│   ├── css/
│   │   └── style.css           ← UPDATED: styles for new UI elements
│   └── js/
│       ├── app.js              ← UPDATED: orders enhancements, export CSV, no demo banner
│       ├── charts.js           ← UPDATED: period toggle, % change badge, dual top-listings charts
│       └── settings.js         ← unchanged
├── .env
├── .gitignore
├── package.json
├── Dockerfile
└── docker-compose.yml
```

---

## Data Model (`src/data/mockData.js`) — Phase 2 changes

### Orders — new fields on every order object

```js
{
  // existing fields unchanged ...
  shippingAddress: "123 Main St, Springfield, IL 62701, USA",
  notes: ""   // empty string for most; a few have a short note
}
```

### `analyticsData` — new keys

```js
analyticsData = {
  // existing keys unchanged ...
  topListingsByRevenue: [
    // top 5 listings by total revenue earned (computed from orders at module load)
    // each: { title (max 20 chars), revenue }
  ],
  revenueByWeek: [
    // 6 items, last 6 weeks: { week: "Jun W1", revenue: 310 }
  ]
  // revenueByDay (existing) is also used for the "Daily" period view
}
```

---

## Routes — Phase 2 changes

| Method | Path | Notes |
|---|---|---|
| GET | / | Now renders `app.ejs` directly (was `landing.ejs`) |
| GET | /app | Alias; renders same `app.ejs` |
| GET | /about | Unchanged |
| GET | /settings | Remove `?notice=api_key_required` handling |
| GET | /auth/etsy | Keep route; remove redirect-to-settings-with-notice logic |
| All others | unchanged | — |

---

## Views — Phase 2 changes

### app.ejs

Removed:
- Demo mode banner div and its dismiss button entirely.

Orders tab additions:
- Search input: "Search by buyer or order ID..." — client-side filter on `buyerName` and `id`
- Sort dropdown: "Sort by: Date ↓ | Date ↑ | Total ↓ | Total ↑ | Status"
- Pagination: 10 rows per page with "Showing X–Y of Z" label and Prev/Next buttons
- Order detail modal: add `shippingAddress` field and `notes` field (show "—" if empty)

Analytics tab additions:
- Revenue by Month chart: add period toggle buttons above chart (Monthly / Weekly / Daily)
- "% change vs previous period" badge next to "Revenue" chart section heading
- Second "Top Listings" chart: `canvas#topListingsByRevenueChart` — horizontal bar, by revenue;
  displayed side-by-side with existing `topListingsChart` (by views)
- "Export CSV" button in the tab toolbar; downloads current visible orders table as CSV

Inline data passed to client via `<script>` blocks:
```html
<script>
  window.__REVENUE_DATA__    = <%- JSON.stringify(revenueByDay) %>;
  window.__ANALYTICS__       = <%- JSON.stringify(analyticsData) %>;
  // analyticsData now includes topListingsByRevenue and revenueByWeek
</script>
```

### settings.ejs

Removed:
- `?notice=api_key_required` yellow dismissible notice block

Added:
- "Connection" section (styled info box, below the form):
  - "Status: Connected"
  - "Last synced: [formatted lastSynced from mockData.shop]"
  - "Next sync: Automatic" (static placeholder text)

### landing.ejs

Deleted entirely. File removed from the repo.

---

## Client-Side JS — Phase 2 changes

### public/js/app.js

Removed:
- Demo banner dismiss logic (references to `demoBannerDismissed` localStorage key)

Orders section additions:
- Buyer/order-ID search input: filters `ordersData` array on `buyerName.toLowerCase()` and `id.toLowerCase()`
- Sort dropdown handler: sorts filtered array by date, total, or status before rendering
- Pagination: track `ordersPage` state, 10 per page, render "Showing X–Y of Z", Prev/Next
- Modal: display `shippingAddress` and `notes` fields in order detail modal

Analytics:
- "Export CSV" button: on click, serialise current orders data (all filtered rows, all columns) as CSV and trigger browser download via `Blob` + `URL.createObjectURL`

### public/js/charts.js

Added:
- `topListingsByRevenueChart` — horizontal bar chart, `canvas#topListingsByRevenueChart`
- Period toggle for revenue chart:
  - Track `currentPeriod` state (`'monthly'` / `'weekly'` / `'daily'`)
  - On toggle button click: destroy and re-create `revenueMonthChart` with appropriate dataset from `window.__ANALYTICS__`
  - Button labels: "Monthly" / "Weekly" / "Daily"
- `% change` badge:
  - Computed from currently selected period dataset: compare sum of last half vs first half
  - Rendered as text node updated alongside the period toggle
  - Green if positive, red if negative, grey if zero

---

## Styling (`public/css/style.css`) — Phase 2 additions

New selectors / rules needed:
- `.period-toggle` — button group above revenue chart, active button gets `--etsy-orange` fill
- `.pct-change-badge` — inline badge next to revenue chart heading (reuses existing trend badge colours)
- `.orders-toolbar` — flex row with gap for search + sort + date filter dropdowns
- `.export-csv-btn` — styled button in analytics tab toolbar
- `.connection-section` — info box in settings.ejs (light border, border-radius 8px, padding)
- `.side-by-side-charts` — flex row for the two top-listings charts, wraps at 600px

All existing CSS rules from Phase 1 remain unchanged.

---

## Non-Goals (Out of Scope)

- Real Etsy OAuth2 PKCE flow or live API calls
- Database or file-based session storage
- User authentication / multi-user support
- Production HTTPS
- Image upload or file management
- Any UI text implying this is a demo, uses mock data, or will "connect later"
- Phase 3 (live Etsy data) features of any kind
