# Design: Personal Etsy Shop Dashboard (Phase 1 — Mock Data)

## Summary

A single-owner Etsy shop dashboard web app rendered server-side with EJS.
Phase 1 delivers a fully functional demo using hardcoded mock data — no Etsy
API key required. The goal is a polished, reviewable app suitable for
presenting to Etsy when applying for API access. Phase 2 (real OAuth2 +
live data) is explicitly out of scope.

---

## Assumptions / Clarifications

- The `.env` file is included in source for developer convenience (it only
  sets `PORT` and an empty `ETSY_API_KEY`). It is listed in `.gitignore` so
  secrets are not committed. The Docker image uses the `ENV PORT=3000`
  instruction as the authoritative default; the `.env` file is also passed
  via `env_file` in docker-compose so local overrides still work.
- `recentOrders` in `mockData.js` is computed at module load time as the
  last 5 elements of the `orders` array (slice, not a separate hardcoded list).
- Chart data on the Analytics tab is embedded into the EJS template via an
  inline `<script>` block (i.e., `window.__ANALYTICS__ = <%- JSON.stringify(analyticsData) %>`),
  so `charts.js` does not need to make extra HTTP requests for that data.
  The revenue line chart on the Dashboard tab uses the same pattern with
  `revenueByDay`.
- Settings are stored entirely in browser `localStorage`; the `POST /settings/save`
  route returns `{ ok: true }` but is otherwise a no-op on the server.
- `POST /settings/save` is handled inside `src/routes/settings.js` (same
  file as the GET handler), not a separate file.

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
`${APP_PORT:-4000}:3000`.

---

## File Structure

```
etsy-dashboard/
├── src/
│   ├── app.js                  ← Express entry; reads PORT from env
│   ├── data/
│   │   └── mockData.js         ← all mock data, one exported object
│   ├── routes/
│   │   ├── index.js            ← GET /, GET /app, GET /about
│   │   ├── auth.js             ← GET /auth/etsy, GET /auth/callback
│   │   ├── api.js              ← GET /api/status, GET /api/mock/*
│   │   └── settings.js         ← GET /settings, POST /settings/save
│   └── views/
│       ├── layout.ejs          ← shared HTML shell, nav, status bar, footer
│       ├── landing.ejs
│       ├── app.ejs             ← 4-tab dashboard
│       ├── about.ejs
│       └── settings.ejs
├── public/
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── app.js              ← tab switching, listings/orders logic, modal
│       ├── charts.js           ← Chart.js init for all 4 charts
│       └── settings.js         ← localStorage save/load, toast
├── .env                        ← PORT=3000, ETSY_API_KEY= (committed for dev)
├── .gitignore
├── package.json
├── Dockerfile
└── docker-compose.yml
```

---

## Data Model (`src/data/mockData.js`)

Single exported object `mockData` with keys:

- **`shop`**: `{ name, currency, totalSales, isStarSeller, onVacation, lastSynced }`
- **`stats`**: `{ totalOrders, revenue, avgOrderValue, activeListings }` — each `{ value, trend }`
- **`listings`**: array of 10 objects `{ id, title, price, quantity, views, status, thumbnail }`
  - Mix of `"active"` / `"inactive"` statuses
  - Prices $12–$95, views 50–800
- **`orders`**: array of 10 objects `{ id, buyerName, date, items[{title,qty}], itemCount, total, status }`
  - Mix of `"open"` / `"completed"` / `"cancelled"` statuses
  - Dates spread across last 90 days from 2026-07-05
- **`recentOrders`**: computed at module load as `orders.slice(-5)`
- **`revenueByDay`**: 7 items `{ date, revenue }` for Jun 29–Jul 5 2026
- **`analyticsData`**: `{ topListings[5], byDayOfWeek[7], revenueByMonth[6], conversionRate }`

---

## Routes

| Method | Path | File | Notes |
|---|---|---|---|
| GET | / | routes/index.js → landing.ejs | Hero + features + demo preview |
| GET | /app | routes/index.js → app.ejs | 4-tab dashboard |
| GET | /about | routes/index.js → about.ejs | About page |
| GET | /settings | routes/settings.js → settings.ejs | Settings form; show notice if `?notice=api_key_required` |
| POST | /settings/save | routes/settings.js | Returns `{ ok: true }` |
| GET | /auth/etsy | routes/auth.js | If `ETSY_API_KEY` set: redirect to Etsy OAuth stub. Else: redirect to `/settings?notice=api_key_required` |
| GET | /auth/callback | routes/auth.js | Returns JSON `{ status: "oauth_not_implemented" }` |
| GET | /api/status | routes/api.js | Returns `{ connected: false, shop: mockData.shop }` |
| GET | /api/mock/listings | routes/api.js | Returns `mockData.listings` |
| GET | /api/mock/orders | routes/api.js | Returns `mockData.orders` |

---

## Views

### layout.ejs
Receives: `title`, `body`, `shop`, `currentPath` (for active nav highlighting).
- `<head>`: charset, viewport, `<title><%= title %> — MyShop Dashboard</title>`, style.css, Chart.js CDN, Lucide CDN
- Top nav (56px): logo "MyShop Dashboard" → `/`; links: Dashboard `/app`, About `/about`, Settings `/settings` (gear icon)
- Shop status bar (36px, `#FFF9F6`): shop name, Star Seller badge (if `isStarSeller`), total sales, On Vacation checkbox (localStorage), Last synced formatted
- `<%- body %>` content area
- Footer: "© 2026 MyShop Dashboard — Personal Etsy shop tool" + shortcut hint on /app page
- Script tags for `public/js/app.js`, `charts.js`, `settings.js` — included only on pages that need them

### landing.ejs
Hero: H1, subheading, "Connect with Etsy" CTA → `/auth/etsy`, "Or preview the demo →" → `/app`.
Features: 3 cards with Lucide icons (Track Orders, Manage Listings, View Analytics).
Demo preview: styled div with placeholder text "Live demo preview".

### app.ejs
- Demo mode banner (yellow, dismissible, localStorage key `demoBannerDismissed`)
- 4 tab buttons: `data-tab="dashboard"`, `data-tab="listings"`, `data-tab="orders"`, `data-tab="analytics"`
- Tab panels (shown/hidden by JS):
  - **Dashboard**: 4 stat cards, revenue line chart (`canvas#revenueChart`), recent orders table
  - **Listings**: search input + sort dropdown, table with pagination (5/page)
  - **Orders**: status filter + date range filter, table, order detail modal
  - **Analytics**: `canvas#topListingsChart`, `canvas#dayOfWeekChart`, `canvas#revenueMonthChart`, conversion rate card
- Inline `<script>` blocks embed `revenueByDay` and `analyticsData` as `window.__REVENUE_DATA__` and `window.__ANALYTICS__` for use by charts.js

### about.ejs
H1, purpose paragraph, tech stack list, privacy note box, developer disclaimer.

### settings.ejs
Form with 4 fields (shopName text, currency radio, dateFormat radio, etsyApiKey password).
Save button triggers `settings.js`. Yellow dismissible notice if `?notice=api_key_required`.

---

## Client-Side JS

### public/js/app.js
- Tab switching with `aria-selected` and active class management
- Keyboard shortcuts (1–4, r/R, s/S) — active only when no input is focused
- Listings: fetch `/api/mock/listings`, render table with search filter, sort, 5-per-page pagination, prev/next
- Orders: fetch `/api/mock/orders`, apply status + date-range filters, render table
- Order detail modal: open on row click, close on overlay click or ESC
- Demo banner dismiss (localStorage `demoBannerDismissed`)
- On Vacation toggle (localStorage `onVacation`)

### public/js/charts.js
- Reads `window.__REVENUE_DATA__` and `window.__ANALYTICS__` (set inline in app.ejs)
- Initialises 4 Chart.js charts on `DOMContentLoaded`:
  - `revenueChart` — line, last 7 days revenue
  - `topListingsChart` — horizontal bar, top 5 by views
  - `dayOfWeekChart` — vertical bar, orders by day of week
  - `revenueMonthChart` — line, revenue by month
- Colour palette: Primary `#F1641E`, Secondary `#222222`, Muted `#D4D4D4`, Success `#4CAF50`

### public/js/settings.js
- On load: populate form from localStorage
- On save click: write localStorage, show 3-second fixed bottom-right toast "Settings saved ✓"

---

## Styling (`public/css/style.css`)

CSS custom properties on `:root` as specified in requirements.
Key rules:
- Max content width 1100px centred
- Nav 56px, status bar 36px
- Tab buttons underline style, active tab `--etsy-orange` 2px underline
- Stat cards: 4-col grid desktop / 2-col tablet (≤768px) / 1-col mobile
- Tables: full-width, border-collapse, alternating row bg `#FAFAFA`
- Status badges: border-radius 999px
- Modal: position fixed, full-screen semi-transparent overlay, centred box max-width 500px
- `.skeleton` class: shimmer CSS animation (`@keyframes shimmer`, linear-gradient)
- Single breakpoint at 768px

---

## Non-Goals (Out of Scope)

- Real Etsy OAuth2 PKCE flow
- Any live API calls to Etsy
- Database or file-based session storage
- User authentication / multi-user support
- Production deployment or HTTPS
- Image upload or file management
- Any page or feature not listed in requirements
- Phase 2 features of any kind
