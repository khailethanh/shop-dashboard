# Requirements

> **Note (2026-07-13):** Etsy's Personal Access API tier does not grant
> listing create/edit scopes — only read access to shop/order/review
> data. The Listings tab remains read-only (view existing listings,
> price, quantity, views). Do not implement listing create/edit
> features described anywhere below; app scope is order tracking &
> fulfillment, analytics, and review management. See README.md.

## What to build

A personal Etsy shop dashboard — a polished single-owner web app for
viewing and managing one Etsy shop's data in one place. Built in two
phases: Phase 1 is a fully functional demo with mock data (no API key
needed), professional enough to show Etsy reviewers when applying for
API access. Phase 2 adds real Etsy OAuth2 + live data (out of scope
for this build).

---

## Tech stack (mandatory — do not deviate)

- **Runtime:** Node.js 20
- **Framework:** Express 4
- **Templates:** EJS (server-side rendering, no client-side framework)
- **Styling:** Single vanilla CSS file (`public/css/style.css`) —
  no Tailwind, no Bootstrap, no external CSS framework
- **Charts:** Chart.js 4 loaded via CDN
  (`https://cdn.jsdelivr.net/npm/chart.js`)
- **Icons:** Lucide icons via CDN
  (`https://unpkg.com/lucide@latest/dist/umd/lucide.min.js`)
- **Storage:** No database. All mock data in one file. Settings
  persisted in browser localStorage only.
- **Environment:** `.env` file with `PORT` and optional
  `ETSY_API_KEY`. App must work fully without `ETSY_API_KEY` set.

---

## File structure (create exactly these files — no extras)
etsy-dashboard/
├── src/
│ ├── app.js ← Express entry point
│ ├── data/
│ │ └── mockData.js ← all mock data, exported as one object
│ ├── routes/
│ │ ├── index.js ← GET / (landing), GET /app, GET /about
│ │ ├── auth.js ← GET /auth/etsy, GET /auth/callback
│ │ ├── api.js ← GET /api/status, GET /api/mock/*
│ │ └── settings.js ← GET /settings, POST /settings/save
│ └── views/
│ ├── layout.ejs ← shared HTML shell, nav, status bar
│ ├── landing.ejs ← route GET /
│ ├── app.ejs ← route GET /app (all 4 tabs)
│ ├── about.ejs ← route GET /about
│ └── settings.ejs ← route GET /settings
├── public/
│ ├── css/
│ │ └── style.css ← all styles in one file
│ └── js/
│ ├── app.js ← tab switching, keyboard shortcuts,
│ │ listings/orders table logic
│ ├── charts.js ← Chart.js initialisation for all charts
│ └── settings.js ← localStorage save/load for settings
├── .env ← PORT=3000, ETSY_API_KEY= (optional)
├── .gitignore ← node_modules, .env, data/tokens.json
├── package.json
├── Dockerfile
└── docker-compose.yml


---

## Mock data (define in `src/data/mockData.js`)

Export one object `module.exports = mockData` with these exact keys:

```js
{
  shop: {
    name: "Artisan Collective",
    currency: "USD",
    totalSales: 312,
    isStarSeller: true,
    onVacation: false,
    lastSynced: "2026-07-05T10:00:00Z"
  },

  stats: {
    totalOrders:    { value: 47,      trend: "+8%"  },
    revenue:        { value: 1823.50, trend: "+12%" },
    avgOrderValue:  { value: 38.80,   trend: "+3%"  },
    activeListings: { value: 12,      trend: "0%"   }
  },

  listings: [
    // 10 items, each:
    {
      id: "L001",
      title: "Handmade Ceramic Mug",
      price: 28.00,
      quantity: 15,
      views: 342,
      status: "active",      // "active" | "inactive"
      thumbnail: null        // null = show placeholder
    },
    // ... 9 more, mix of active/inactive,
    //     varying price ($12–$95), views (50–800)
  ],

  orders: [
    // 10 items, each:
    {
      id: "O1001",
      buyerName: "Sarah M.",
      date: "2026-07-01",
      items: [
        { title: "Handmade Ceramic Mug", qty: 2 }
      ],
      itemCount: 2,
      total: 56.00,
      status: "completed"    // "open" | "completed" | "cancelled"
    },
    // ... 9 more, mix of all 3 statuses,
    //     dates spread across last 90 days
  ],

  recentOrders: [], // last 5 orders from orders array (computed at
                    // module load time, not hardcoded separately)

  revenueByDay: [
    // 7 items, last 7 days in order oldest→newest
    { date: "Jun 29", revenue: 112.50 },
    { date: "Jun 30", revenue: 88.00  },
    { date: "Jul 01", revenue: 156.00 },
    { date: "Jul 02", revenue: 0      },
    { date: "Jul 03", revenue: 204.00 },
    { date: "Jul 04", revenue: 76.50  },
    { date: "Jul 05", revenue: 95.00  }
  ],

  analyticsData: {
    topListings: [
      // top 5 by views, each: { title (max 20 chars), views }
    ],
    byDayOfWeek: [
      // 7 items Mon–Sun: { day: "Mon", orders: 8 }
    ],
    revenueByMonth: [
      // 6 items: { month: "Feb", revenue: 420 }
      // covering Feb–Jul 2026
    ],
    conversionRate: 3.2   // percent, mock
  }
}
```

---

## Routes

| Method | Path | Handler | Description |
|---|---|---|---|
| GET | / | landing.ejs | Landing page |
| GET | /app | app.ejs | Main dashboard (4 tabs) |
| GET | /about | about.ejs | About page |
| GET | /settings | settings.ejs | Settings page |
| POST | /settings/save | settings.js | No-op (settings in localStorage) — return { ok: true } |
| GET | /auth/etsy | auth.js | If ETSY_API_KEY set: redirect to Etsy OAuth. Else: redirect to /settings?notice=api_key_required |
| GET | /auth/callback | auth.js | Placeholder: render JSON { status: "oauth_not_implemented" } |
| GET | /api/status | api.js | Return { connected: false, shop: mockData.shop } |
| GET | /api/mock/listings | api.js | Return mockData.listings |
| GET | /api/mock/orders | api.js | Return mockData.orders |

---

## Views

### layout.ejs (shared shell)

Wraps every page. Contains:

- `<head>`: charset, viewport, title (`<%= title %> — MyShop Dashboard`),
  `style.css` link, Chart.js CDN, Lucide CDN
- Top nav:
  - Left: logo "MyShop Dashboard" (links to /)
  - Right: nav links — Dashboard (`/app`), About (`/about`),
    Settings (`/settings`) with a gear icon
- **Shop status bar** (thin bar below nav, always visible):
  - Shop name from `mockData.shop.name`
  - ⭐ "Star Seller" badge (shown if `isStarSeller: true`)
  - Total sales count: "312 sales"
  - 🌴 On Vacation toggle (checkbox, purely visual,
    state stored in localStorage key `onVacation`)
  - Last synced: "Last synced: Jul 5, 10:00 AM"
- `<%- body %>` content area
- Footer: "© 2026 MyShop Dashboard — Personal Etsy shop tool"
- `<script>` tags for public JS files (only on /app page)

### landing.ejs

Hero section:
- H1: "Your Etsy Shop, At a Glance"
- Subheading: "A personal dashboard for managing your shop — listings,
  orders, and stats in one place."
- CTA button: "Connect with Etsy" → calls `/auth/etsy`
- "Or preview the demo →" text link → `/app`

Features section (3 cards, icons from Lucide):
- 📦 Track Orders — "See all your orders, filter by status and date"
- 🏷️ Manage Listings — "Browse listings, check views and inventory"
- 📊 View Analytics — "Charts for revenue, top products, and trends"

Demo preview section:
- Static screenshot/mockup description (just a styled div with
  placeholder text "Live demo preview" — no actual image needed)

### app.ejs

**Demo mode banner** (yellow, dismissible):
"Demo mode — connect Etsy to see real data."
Dismiss button stores `demoBannerDismissed=true` in localStorage.

**4 tab buttons** (rendered as `<button data-tab="...">` elements):
- Dashboard | Listings | Orders | Analytics

**Tab: Dashboard**

Stat cards row (4 cards):
[Total Orders: 47 ↑8%] [Revenue: $1,823.50 ↑12%]
[Avg Order: $38.80 ↑3%] [Active Listings: 12 →0%]

Each card: large number, label below, trend badge
(green ↑ / red ↓ / grey → based on trend string).

Revenue chart:
- Line chart, last 7 days, using `revenueByDay` data
- Label: "Revenue — Last 7 Days"
- Canvas id: `revenueChart`, height 200px

Recent Orders table:
- Label: "Recent Orders"
- Columns: Order ID | Buyer | Date | Items | Total | Status badge
- Shows last 5 orders from `recentOrders`
- Status badge colours: open=blue, completed=green, cancelled=grey

**Tab: Listings**

Toolbar row:
- Search input: placeholder "Search listings..." — filters table
  client-side on `title` field as user types (no debounce needed)
- Sort dropdown: "Sort by: Default | Price ↑ | Price ↓ |
  Views ↑ | Views ↓"

Table columns:
- Thumbnail (60×60 grey placeholder div if `thumbnail` is null)
- Title
- Price (formatted "$28.00")
- Qty
- Views
- Status badge (active=green, inactive=grey)

Pagination:
- 5 rows per page
- "Showing 1–5 of 10" label
- Prev / Next buttons (disabled when at boundary)

Empty state (shown when search has no results):
- Icon + text "No listings match your search."

**Tab: Orders**

Toolbar row:
- Status filter dropdown: All | Open | Completed | Cancelled
- Date range dropdown: All time | Last 7 days | Last 30 days |
  Last 90 days

Table columns:
- Order ID
- Buyer
- Date (formatted per settings date format)
- Items (count)
- Total (formatted)
- Status badge

Row click → opens order detail modal:
- Modal overlay, click outside to close, ESC to close
- Shows: Order ID, Buyer name, Date, all items as list
  (title × qty), subtotal, status

Empty state: "No orders match your filters."

**Tab: Analytics**

4 chart/card sections (stacked vertically, full width):

1. **Top 5 Listings by Views** — horizontal bar chart,
   canvas id `topListingsChart`, data from `analyticsData.topListings`

2. **Orders by Day of Week** — vertical bar chart,
   canvas id `dayOfWeekChart`, data from `analyticsData.byDayOfWeek`

3. **Revenue by Month** — line chart,
   canvas id `revenueMonthChart`, data from `analyticsData.revenueByMonth`

4. **Conversion Rate** — single stat card:
   "3.2% conversion rate" with label "Views → Orders (mock)"

### about.ejs

- H1: "About MyShop Dashboard"
- Purpose paragraph: "A personal learning tool for managing my own
  Etsy shop more easily. Built to explore the Etsy Open API v3."
- Tech stack list: Node.js, Express, EJS, Chart.js, Etsy Open API v3
- Privacy note box (styled): "This app only accesses the shop owner's
  own Etsy account data. It is not a third-party tool and does not
  collect or share any data with anyone."
- Developer note: "Built as a personal project — not affiliated with
  or endorsed by Etsy Inc."

### settings.ejs

Form (saves to localStorage via `settings.js`, no server POST needed):

| Field | Type | Options | localStorage key |
|---|---|---|---|
| Shop display name | text input | — | `shopName` |
| Currency display | radio | USD / VND | `currency` |
| Date format | radio | MM/DD/YYYY / DD/MM/YYYY | `dateFormat` |
| API Key | password input | masked | `etsyApiKey` |

Save button → `settings.js` reads all fields, writes to localStorage,
shows success toast "Settings saved ✓" for 3 seconds.

If page loaded with `?notice=api_key_required` query param →
show dismissible yellow notice: "Please configure your Etsy API key
to connect your shop."

---

## Client-side JS

### public/js/app.js

- Tab switching: clicking a tab button shows the matching tab panel,
  hides others, updates `aria-selected` and active class
- Keyboard shortcuts (only when no input is focused):
  - `1` → Dashboard tab
  - `2` → Listings tab
  - `3` → Orders tab
  - `4` → Analytics tab
  - `r` or `R` → reload page
  - `s` or `S` → navigate to `/settings`
- Shortcut hint shown in footer: "Shortcuts: 1-4 tabs · R refresh · S settings"
- Listings table: render from `/api/mock/listings`, apply search
  filter and sort, render paginated rows, prev/next buttons
- Orders table: render from `/api/mock/orders`, apply status + date
  filters, render rows
- Order detail modal: open on row click, close on overlay click or ESC
- Demo banner dismiss: hide + set localStorage flag
- On vacation toggle: read/write localStorage `onVacation`,
  update status bar text

### public/js/charts.js

Initialise all 4 Chart.js charts after DOM ready.
Fetch data from `/api/mock/listings` and `/api/mock/orders` to build
chart datasets (or use inline data passed via EJS `<script>` tag —
whichever is simpler).

Chart colour palette (use consistently):
- Primary: `#F1641E` (Etsy orange)
- Secondary: `#222222`
- Muted: `#D4D4D4`
- Success: `#4CAF50`

### public/js/settings.js

- On load: read all localStorage keys, populate form fields
- On save button click: write all fields to localStorage, show toast
- Toast: fixed bottom-right, green background, auto-hides after 3s

---

## Styling (`public/css/style.css`)

Colour tokens (define as CSS variables on `:root`):
```css
--etsy-orange: #F1641E;
--etsy-dark:   #222222;
--bg:          #F7F7F7;
--surface:     #FFFFFF;
--border:      #E8E8E8;
--text:        #222222;
--text-muted:  #767676;
--success:     #4CAF50;
--warning:     #FF9800;
--danger:      #E53935;
--info:        #2196F3;
```

Layout rules:
- Max content width: 1100px, centred
- Nav height: 56px, white background, bottom border `--border`
- Status bar height: 36px, `#FFF9F6` background (light orange tint)
- Tab buttons: underline style (not pill/box), active tab gets
  `--etsy-orange` underline 2px
- Stat cards: white, border-radius 8px, box-shadow subtle,
  padding 20px, display grid 4-col on desktop / 2-col on tablet /
  1-col mobile
- Tables: full width, `border-collapse: collapse`, alternating row
  bg `#FAFAFA`, header row background `--bg`
- Status badges: `border-radius: 999px`, small padding, colour per
  status (see above colour tokens)
- Modal overlay: `position: fixed`, full screen, semi-transparent
  black bg, modal box centred, border-radius 12px, max-width 500px
- Shimmer loading skeleton: CSS-only animation
  (`background: linear-gradient` + `@keyframes shimmer`) applied to
  `.skeleton` class — used on table rows while data loads
- Responsive: single CSS breakpoint at 768px (no framework)

---

## Dockerfile

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 3000
ENV PORT=3000
CMD ["node", "src/app.js"]
```

## docker-compose.yml

```yaml
services:
  app:
    build: .
    ports:
      - "${APP_PORT:-4000}:3000"
    env_file:
      - .env
    healthcheck:
      test: ["CMD", "node", "-e",
             "require('http').get('http://localhost:3000/api/status',
             r=>process.exit(r.statusCode===200?0:1))
             .on('error',()=>process.exit(1))"]
      interval: 10s
      timeout: 5s
      retries: 3
```

---

## Phase 2 — Convert to real personal app (supersedes Phase 1 landing/demo spec above)

Context: Phase 1 built a demo-style landing page and "Demo mode"
banner because we thought Etsy required a live app to review before
granting API access. That is incorrect for personal-access apps —
Etsy's personal access tier is granted from the registration form
alone, no live app review needed. This app is single-owner personal
use only and will never need a "connect your account" flow, since
the owner is the only user and auth happens once outside the UI.

### Remove (delete these, do not just hide)
- `views/landing.ejs` and its route (`GET /` rendering landing.ejs)
- "Connect with Etsy" button and "Or preview the demo" link
- Demo preview static section
- Demo mode banner in `app.ejs` ("Demo mode — connect Etsy to see
  real data" + dismiss logic in `app.js`)
- `/auth/etsy` "not configured" redirect messaging — keep the route
  but it should assume a valid session going forward, no user-facing
  "please connect" text anywhere
- `?notice=api_key_required` handling in `settings.ejs`

### Change
- `GET /` now renders what used to be `app.ejs` directly (rename
  route mapping, keep `/app` as an alias if simplest)
- Layout status bar and footer stay as-is — they already read as a
  real running app, do not change them
- Settings page: remove "API key required" notice entirely; instead
  show a static "Connection" section with `Last synced` timestamp
  and a "Next sync" placeholder, styled as if the integration is
  live and healthy

### Deepen — Orders tab
- Add filters: status (open / completed / cancelled), date range
  (existing dropdown stays), search by buyer name or order ID
- Add sort: by date, by total, by status
- Keep existing row-click modal, add to it: shipping address field
  (add `shippingAddress` to each mock order), order notes field
  (add `notes`, can be empty string)
- Add pagination (10 per page) to match the Listings tab pattern

### Deepen — Analytics tab
- Add period toggle to Revenue by Month chart: Monthly / Weekly /
  Daily, backed by new mock data arrays as needed
- Add "% change vs previous period" badge next to the revenue chart
  title, computed from mock data
- Add a second "Top Listings" ranking by revenue (in addition to the
  existing by-views ranking) — two side-by-side small bar charts
- Add "Export CSV" button on the tab that downloads the currently
  visible table as CSV (client-side, no server route needed)

### Do not add
- Any comment, label, or UI text stating this currently uses mock
  data with a plan to connect to the real API later. Treat all data
  as if it is the real, current state of the shop.

  ---

## Phase 3 — Multi-tenant, multi-shop, fulfillment, reviews

Context: this phase reverses several Phase 1/2 non-goals. Previously
this was a single-owner, single-shop, no-database, no-auth app.
Starting now: multiple people can use this app, each with their own
account, and each account can manage multiple Etsy shops. This
requires real persistent storage and real authentication — mock data
and localStorage-only settings are no longer sufficient.

### Tech stack additions (extends, does not replace, existing stack)
- **Database:** SQLite via `better-sqlite3`, file at `data/app.db`,
  gitignored. Migrations as plain `.sql` files in `migrations/`,
  applied in order at startup if not yet applied (track applied
  migrations in a `_migrations` table).
- **Auth:** session-based. `express-session` + SQLite session store
  (`connect-sqlite3` or similar). Passwords hashed with `bcrypt`.
  No third-party OAuth login (no "Sign in with Google" etc.) — just
  email + password.
- **Per-shop Etsy credentials:** stored in DB per shop row, not
  `.env`. `.env` keeps only app-level config (`PORT`,
  `SESSION_SECRET`).

### Data model (new tables)
```sql
users (id, email UNIQUE, password_hash, created_at)
shops (id, user_id FK, name, etsy_shop_id, etsy_access_token,
       etsy_refresh_token, currency, is_star_seller, on_vacation,
       last_synced_at, created_at)
orders (id, shop_id FK, etsy_order_id, buyer_name, order_date,
        total, status, shipping_address, notes, tracking_number,
        carrier, fulfilled_at, created_at)
order_items (id, order_id FK, title, qty, price)
listings (id, shop_id FK, etsy_listing_id, title, price, quantity,
          views, status, thumbnail_url)
reviews (id, shop_id FK, etsy_review_id, buyer_name, rating,
         review_text, review_date, shop_response, responded_at,
         flagged BOOLEAN DEFAULT 0)
```
Existing mock data becomes seed data for one demo user + one demo
shop (`npm run seed` populates this), so the app still works
out-of-the-box in dev without real Etsy credentials.

### 1. Authentication
- `/signup`, `/login`, `/logout` routes
- Session cookie, redirect unauthenticated users to `/login` for any
  route under `/app/*`
- Simple password rules: min 8 chars, no complexity theatre
- No email verification, no password reset flow yet (out of scope,
  can be a later phase)

### 2. Shop switching
- After login, if user has 0 shops → redirect to "Add a shop" form
  (name + Etsy credentials, or skip credentials to add later)
- If user has 1+ shops → land on last-active shop's dashboard
- Shop switcher dropdown in top nav (next to shop status bar):
  lists all shops belonging to the logged-in user, switching
  updates session's "active shop" and reloads dashboard scoped to
  that shop
- "Add another shop" option always available in the switcher
- All existing routes (`/`, `/about` excluded, `/settings`,
  `/api/*`) become scoped to `req.session.activeShopId` — every
  query filters by shop_id, no cross-shop data leakage

### 3. Order tracking & fulfillment — deepen further
Building on Phase 2's filters/sort/pagination:
- New order statuses lifecycle: `pending` → `processing` →
  `shipped` → `delivered` (in addition to existing `cancelled`)
- Fulfillment action on order detail modal: enter carrier + tracking
  number → sets status to `shipped`, records `fulfilled_at`
- Bulk fulfillment: select multiple `pending` orders → "Mark as
  processing" bulk action
- Overdue orders indicator: any `pending` order older than 3 days
  shown with a warning badge on the Orders tab
- Dashboard stat card: "Orders needing fulfillment" count, links
  directly to Orders tab pre-filtered to `pending`

### 4. Review management (new tab)
- New nav tab: "Reviews"
- List all reviews for active shop: buyer name, rating (stars),
  review text, date, shop response (if any)
- Filter: rating (1-5 stars), responded / not responded, flagged
- Respond to a review: textarea + submit → saves `shop_response`,
  `responded_at` (this is local-only for now; does not call Etsy API
  since that's Phase 4/real-API scope)
- Flag a review for follow-up: toggle `flagged`, flagged reviews
  show a marker and can be filtered to a dedicated "Needs attention"
  view
- Dashboard stat card: average rating across all reviews, count of
  unresponded reviews

### Non-goals (still out of scope for this phase)
- Real Etsy OAuth2 PKCE flow / real API calls (still Phase 4)
- Actually sending fulfillment tracking info to Etsy (local-only
  record until real API integration exists)
- Actually posting review responses to Etsy (local-only until then)
- Billing/subscription for other users
- Password reset / email verification flows
- Do not add any comment stating current data is mock/local-only
  with a plan to sync later — treat local DB state as the real,
  current state of the shop for UI purposes