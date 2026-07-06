# MyShop Dashboard

A personal, single-owner dashboard for tracking and analysing an Etsy
shop's performance — orders, listings, and sales trends in one place.
Built as a self-hosted tool for the shop owner, not a multi-tenant SaaS.

## What it's for

Running an Etsy shop means checking sales, order status, and listing
performance across scattered pages. This app pulls that into one screen
with four views:

- **Dashboard** — key stats (orders, revenue, average order value,
  active listings) and a 7-day revenue chart at a glance
- **Listings** — search, sort, and paginate through all listings with
  price, quantity, and view counts
- **Orders** — filter by status and date, search by buyer or order ID,
  sort by date/total, and drill into an order's shipping address and
  notes
- **Analytics** — top listings by views and by revenue, orders by day
  of week, revenue by day/week/month with period toggle and
  percent-change badge, and CSV export

Keyboard shortcuts (`1`–`4` to switch tabs, `R` to refresh, `S` for
settings) make it fast to use day-to-day.

## Screenshots

**Dashboard** — stats at a glance and 7-day revenue trend

![Dashboard tab](docs/screenshots/dashboard.png)

**Orders** — search, filter, sort, and paginate orders

![Orders tab](docs/screenshots/orders.png)

**Analytics** — top listings, revenue trends, and CSV export

![Analytics tab](docs/screenshots/analytics.png)

## Status

Currently runs entirely on mock data (`src/data/mockData.js`) — no
Etsy API key required to try it out. It's built to later plug in a real
Etsy OAuth2 connection and live shop data without changing the UI.

## Tech stack

- Node.js 20 + Express 4
- EJS server-side templates, no client-side framework
- Chart.js 4 and Lucide icons via CDN
- Vanilla CSS, no framework
- No database — settings persisted in browser localStorage

## Running it

### Docker (recommended)

```bash
docker compose up -d --build
```

The app listens inside the container on port 3000; `docker-compose.yml`
maps it to `${APP_PORT:-4000}` on the host, so open
http://localhost:4000.

### Locally

```bash
npm install
cp .env.example .env
npm start
```

Open http://localhost:3000 (or whatever `PORT` is set to in `.env`).

## Project layout

```
src/
  app.js            Express entry point
  data/mockData.js  Mock shop data
  routes/           index, auth, api, settings
  views/            EJS templates (layout, app, about, settings)
public/
  css/style.css     All styling
  js/               Tab switching, charts, settings
state/              Design/requirements docs for this project's build process
```
