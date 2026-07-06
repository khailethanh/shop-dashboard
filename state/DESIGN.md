# Design: Personal Etsy Shop Dashboard (Phase 3 — Multi-tenant, Multi-shop, Fulfillment, Reviews)

## Summary

Phase 1 built a fully functional mock-data dashboard. Phase 2 converted it to
a real personal-app look-and-feel (removed demo framing, deepened Orders and
Analytics tabs). Phase 3 adds real persistent storage, session-based
authentication, multi-user/multi-shop support, an extended order fulfillment
lifecycle, and a new Reviews tab. All data remains local (no live Etsy API
calls). Mock data from Phases 1/2 becomes seed data for a demo user + demo
shop populated via `npm run seed`.

---

## Assumptions / Clarifications

- Phase 2 implementation is complete and committed. Phase 3 is layered on top.
- "No real Etsy API calls" — all Etsy credential fields (access token, refresh
  token) are stored in the DB and reserved for Phase 4; for now they are
  nullable/empty strings.
- The seed script (`scripts/seed.js`) creates one demo user
  (`demo@example.com` / `password123`) and one demo shop ("Artisan
  Collective") populated with the existing mock data arrays.
- Password validation: minimum 8 characters. No complexity requirements.
- No email verification, no password reset.
- Sessions use a file-based SQLite store so they survive server restarts
  inside the container.
- `SESSION_SECRET` is read from `.env`; a default fallback is used in
  development only — production `.env` must set it explicitly.
- `/` and `/about` remain publicly accessible. All routes under `/settings`,
  `/app`, `/api/*`, `/auth/*` require an active session; unauthenticated
  requests redirect to `/login`.
- The existing `GET /app` route stays as an alias for `/` (both require auth
  in Phase 3).
- Shop-switching sets `req.session.activeShopId`. All data queries filter by
  `shop_id = req.session.activeShopId`.
- Order statuses are extended: `pending`, `processing`, `shipped`,
  `delivered`, `cancelled`. Existing mock seed data maps old statuses
  (`open` → `pending`, `completed` → `delivered`).
- "Overdue pending" = any order with status `pending` and
  `order_date < NOW() - 3 days`.
- Review responses are stored locally only; no Etsy API call is made.
- The "Export CSV" button on Analytics tab (Phase 2) remains unchanged.
- UI never mentions "mock data", "demo", or "connect later".

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
| Database | SQLite via `better-sqlite3`, file at `data/app.db` |
| Sessions | `express-session` + `connect-sqlite3` session store |
| Passwords | `bcrypt` (cost factor 10) |
| Config | `dotenv`, reads `.env` at startup |

---

## Container Internal Port

**3000** — the app listens on the port defined by the `PORT` env var,
defaulting to `3000`. The Dockerfile sets `ENV PORT=3000`;
`docker-compose.yml` exposes `${APP_PORT}:3000`. The app reads
`process.env.PORT` at startup.

---

## File Structure

New files/directories added in Phase 3 (existing files modified where noted):

```
/
├── migrations/
│   ├── 001_create_users.sql
│   ├── 002_create_shops.sql
│   ├── 003_create_orders.sql
│   ├── 004_create_order_items.sql
│   ├── 005_create_listings.sql
│   └── 006_create_reviews.sql
├── scripts/
│   └── seed.js              ← populates demo user + shop from mockData
├── src/
│   ├── app.js               ← UPDATED: session middleware, auth guard middleware
│   ├── db.js                ← NEW: opens better-sqlite3, runs migrations on startup
│   ├── data/
│   │   └── mockData.js      ← unchanged (used only by seed.js now)
│   ├── routes/
│   │   ├── index.js         ← UPDATED: auth guard, pass activeShop to views
│   │   ├── auth.js          ← UPDATED: /login, /signup, /logout added; /auth/etsy stub kept
│   │   ├── api.js           ← UPDATED: all queries use DB, filtered by activeShopId
│   │   ├── settings.js      ← UPDATED: reads/writes shop row in DB for connection section
│   │   ├── orders.js        ← NEW: POST /orders/:id/fulfill, POST /orders/bulk-process
│   │   └── reviews.js       ← NEW: GET /api/mock/reviews, POST /reviews/:id/respond,
│   │                                POST /reviews/:id/flag
│   └── views/
│       ├── layout.ejs       ← UPDATED: shop switcher dropdown in nav, auth-aware nav links
│       ├── app.ejs          ← UPDATED: Reviews tab added; Orders tab fulfillment UI;
│       │                               Dashboard cards updated (fulfillment count, avg rating)
│       ├── about.ejs        ← unchanged
│       ├── settings.ejs     ← unchanged (Connection section already present from Phase 2)
│       ├── login.ejs        ← NEW
│       ├── signup.ejs       ← NEW
│       └── add-shop.ejs     ← NEW
├── public/
│   ├── css/
│   │   └── style.css        ← UPDATED: styles for auth forms, shop switcher, fulfillment modal,
│   │                                    reviews tab, star ratings, flag badge
│   └── js/
│       ├── app.js           ← UPDATED: Reviews tab logic; Orders tab fulfillment action;
│       │                               bulk select + bulk process; overdue badge; shop switcher
│       ├── charts.js        ← unchanged
│       └── settings.js      ← unchanged
├── data/                    ← gitignored directory; app.db created here at runtime
├── .env                     ← UPDATED: add SESSION_SECRET=
├── package.json             ← UPDATED: add better-sqlite3, express-session, connect-sqlite3, bcrypt
├── Dockerfile               ← UPDATED: ensure data/ dir exists; install native build tools for better-sqlite3
└── docker-compose.yml       ← UPDATED: mount data/ volume for DB persistence (use named volume, not bind mount)
```

---

## Database Schema

Migrations are plain `.sql` files in `migrations/`. At startup `src/db.js`
creates a `_migrations` table if it does not exist, then runs any unapplied
migration files in order (comparing filenames already recorded in the table).

```sql
-- _migrations (managed by db.js)
CREATE TABLE IF NOT EXISTS _migrations (
  name TEXT PRIMARY KEY,
  applied_at TEXT DEFAULT (datetime('now'))
);

-- 001_create_users.sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 002_create_shops.sql
CREATE TABLE shops (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  etsy_shop_id TEXT,
  etsy_access_token TEXT,
  etsy_refresh_token TEXT,
  currency TEXT DEFAULT 'USD',
  is_star_seller INTEGER DEFAULT 0,
  on_vacation INTEGER DEFAULT 0,
  last_synced_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 003_create_orders.sql
CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shop_id INTEGER NOT NULL REFERENCES shops(id),
  etsy_order_id TEXT,
  buyer_name TEXT,
  order_date TEXT,
  total REAL,
  status TEXT DEFAULT 'pending',
  shipping_address TEXT,
  notes TEXT,
  tracking_number TEXT,
  carrier TEXT,
  fulfilled_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 004_create_order_items.sql
CREATE TABLE order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  title TEXT,
  qty INTEGER,
  price REAL
);

-- 005_create_listings.sql
CREATE TABLE listings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shop_id INTEGER NOT NULL REFERENCES shops(id),
  etsy_listing_id TEXT,
  title TEXT,
  price REAL,
  quantity INTEGER,
  views INTEGER,
  status TEXT DEFAULT 'active',
  thumbnail_url TEXT
);

-- 006_create_reviews.sql
CREATE TABLE reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shop_id INTEGER NOT NULL REFERENCES shops(id),
  etsy_review_id TEXT,
  buyer_name TEXT,
  rating INTEGER,
  review_text TEXT,
  review_date TEXT,
  shop_response TEXT,
  responded_at TEXT,
  flagged INTEGER DEFAULT 0
);
```

---

## Routes

### Auth routes (new — `src/routes/auth.js`)

| Method | Path | Description |
|---|---|---|
| GET | /login | Render `login.ejs`. Redirect to `/` if already authenticated. |
| POST | /login | Validate email+password against DB. On success set `req.session.userId`, redirect to `/`. On fail re-render with error. |
| GET | /signup | Render `signup.ejs`. Redirect to `/` if already authenticated. |
| POST | /signup | Validate min-8-char password, check email uniqueness, bcrypt hash, insert user, set session, redirect to `/`. On fail re-render with error. |
| GET | /logout | Destroy session, redirect to `/login`. |
| GET | /auth/etsy | Stub — kept from Phase 2, no longer does redirect-to-settings. |
| GET | /auth/callback | Stub — returns JSON `{ status: "oauth_not_implemented" }`. |

### Shop routes (handled in `src/routes/index.js`)

| Method | Path | Description |
|---|---|---|
| GET | / | Requires auth. Loads active shop, renders `app.ejs`. |
| GET | /app | Alias for `/`. |
| POST | /shops/switch | Sets `req.session.activeShopId` from body `shopId`. Redirect to `/`. |
| GET | /shops/add | Render `add-shop.ejs`. |
| POST | /shops/add | Insert new shop row for `req.session.userId`. Redirect to `/`. |

### Order fulfillment routes (`src/routes/orders.js`)

| Method | Path | Description |
|---|---|---|
| POST | /orders/:id/fulfill | Set order `status='shipped'`, `tracking_number`, `carrier`, `fulfilled_at=now()`. Return `{ ok: true }`. |
| POST | /orders/bulk-process | Accept `{ ids: [] }` body. Set status=`processing` for all matching order IDs in active shop. Return `{ updated: N }`. |

### Review routes (`src/routes/reviews.js`)

| Method | Path | Description |
|---|---|---|
| GET | /api/mock/reviews | Return all reviews for active shop. |
| POST | /reviews/:id/respond | Save `shop_response` and `responded_at=now()` for review. Return `{ ok: true }`. |
| POST | /reviews/:id/flag | Toggle `flagged` boolean. Return `{ ok: true, flagged: <newValue> }`. |

### API routes (updated `src/routes/api.js`)

| Method | Path | Description |
|---|---|---|
| GET | /api/status | Return `{ connected: false, shop: <activeShop row> }`. |
| GET | /api/mock/listings | Return listings for `activeShopId`. |
| GET | /api/mock/orders | Return orders for `activeShopId` including items. |

---

## Views

### layout.ejs — Phase 3 changes

- If session exists (`res.locals.user`): show shop name in status bar from
  `res.locals.activeShop`.
- Shop switcher dropdown in top nav (right side, before settings icon):
  shows all shops for the current user; selecting one POSTs to `/shops/switch`.
- Nav links "Dashboard", "About", "Settings" remain; add "Log out" link when
  authenticated.
- When not authenticated: nav shows only "Log in" and "Sign up".

### app.ejs — Phase 3 changes

Dashboard tab:
- Stat card "Orders needing fulfillment": count of `pending` orders for
  active shop. Clicking it activates Orders tab pre-filtered to `pending`.
- Stat card "Avg Rating": average rating from reviews table; sub-label
  "unresponded: N".
- Overdue orders indicator on the Orders tab button: a small badge showing
  count of overdue-pending orders (pending + older than 3 days).

Orders tab:
- Fulfillment action on order detail modal:
  - Fields: carrier (text input) + tracking number (text input)
  - "Mark as Shipped" button → POST `/orders/:id/fulfill`
  - Only visible if status is `pending` or `processing`
- Bulk select: checkbox column; "Mark as Processing" button above table
  activates when one or more `pending` rows are checked → POST
  `/orders/bulk-process`
- Status values updated to: `pending`, `processing`, `shipped`, `delivered`,
  `cancelled`
- Overdue rows: `pending` orders older than 3 days get a warning badge in the
  Status column

Reviews tab (new, 5th tab):
- Tab button label: "Reviews"
- Filter toolbar: star rating select (All / 1★–5★), responded select
  (All / Responded / Not responded), flagged toggle (All / Flagged only)
- Review list (not a table — card-per-review layout):
  - Buyer name, date, star rating (rendered as filled/empty stars)
  - Review text (truncated to 3 lines with expand)
  - Shop response (if exists): shown in indented box
  - Response textarea + "Save Response" button (POST `/reviews/:id/respond`)
  - Flag toggle button (POST `/reviews/:id/flag`); flagged reviews show a
    "Needs attention" badge
- Empty state: "No reviews match your filters."

Inline data passed via `<script>` blocks in app.ejs (additions):
```html
<script>
  window.__REVIEWS__  = <%- JSON.stringify(reviews) %>;
  window.__SHOPS__    = <%- JSON.stringify(shops) %>;
</script>
```

### login.ejs

- Single-column centred form, max-width 400px
- Email + password inputs, "Log in" submit button
- Error message area (shown server-side if login fails)
- "Don't have an account? Sign up" link

### signup.ejs

- Same layout as login.ejs
- Email + password + confirm-password inputs, "Sign up" submit button
- Error message area
- "Already have an account? Log in" link

### add-shop.ejs

- Form: shop name (required), currency radio (USD/VND), optional Etsy Shop
  ID field (can be filled later)
- "Add Shop" submit button → POST `/shops/add`

---

## Authentication Middleware

`src/app.js` defines a `requireAuth` middleware:
```js
function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.redirect('/login');
  }
  next();
}
```

Applied to all routes except: `/login`, `/logout`, `/signup`, `/about`,
`/favicon.ico`, and static assets.

A `loadUser` middleware (also in `src/app.js` or a separate `src/middleware.js`)
runs on every request, loads `req.session.userId` → user row and active shop
row from DB, sets `res.locals.user` and `res.locals.activeShop`. Used by
layout.ejs to render the nav conditionally.

---

## Seed Script (`scripts/seed.js`)

- Checks if demo user (`demo@example.com`) already exists; if so, exits
  without modification.
- Inserts user, inserts one shop, inserts all listings and orders (with items)
  and reviews from `src/data/mockData.js`.
- Reviews: 10 mock reviews added to `mockData.js` with fields
  `{ etsy_review_id, buyer_name, rating, review_text, review_date, shop_response, flagged }`.
- Run via `npm run seed` (add to `package.json` scripts).

---

## CSS additions (Phase 3)

New selectors needed in `public/css/style.css`:
- `.auth-form` — centred card for login/signup, max-width 400px
- `.shop-switcher` — dropdown in nav, styled to match nav height
- `.star-rating` — star icons rendered from rating integer
- `.review-card` — card layout for each review
- `.review-response` — indented box for shop response
- `.flag-badge` — small "Needs attention" pill badge
- `.bulk-action-bar` — sticky bar above orders table when checkboxes selected
- `.checkbox-col` — narrow column for bulk select checkboxes
- `.fulfillment-fields` — section inside order detail modal (carrier + tracking)
- `.overdue-badge` — warning indicator on overdue-pending orders
- `.tab-badge` — small count bubble on a tab button (used for overdue orders)

---

## Non-Goals (Phase 3 scope boundaries)

- Real Etsy OAuth2 PKCE flow or live API calls (Phase 4)
- Actually sending fulfillment tracking to Etsy (local-only record)
- Actually posting review responses to Etsy (local-only)
- Billing / subscription model
- Password reset / email verification
- Any UI text implying data is mock/local-only with a "sync later" plan
- Role-based access control beyond single owner per shop
