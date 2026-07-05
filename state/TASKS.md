# Tasks

- [x] Initialise project: create `etsy-dashboard/` directory structure, `package.json` with dependencies (express, ejs, dotenv), `.gitignore`, and `.env` file
- [x] Implement `src/data/mockData.js` with all mock data as specified (shop, stats, 10 listings, 10 orders, recentOrders computed, revenueByDay, analyticsData)
- [x] Implement `src/app.js` — Express entry point: load dotenv, set up EJS, serve static files from `public/`, mount all route modules, listen on `PORT` env var
- [x] Implement `src/routes/index.js` — GET `/`, GET `/app`, GET `/about` routes rendering landing.ejs, app.ejs, about.ejs
- [x] Implement `src/routes/auth.js` — GET `/auth/etsy` (check ETSY_API_KEY, redirect accordingly) and GET `/auth/callback` (return JSON stub)
- [x] Implement `src/routes/api.js` — GET `/api/status`, GET `/api/mock/listings`, GET `/api/mock/orders`
- [x] Implement `src/routes/settings.js` — GET `/settings` (render settings.ejs with optional notice) and POST `/settings/save` (return `{ ok: true }`)
- [x] Implement `src/views/layout.ejs` — shared HTML shell with nav, shop status bar, content area, footer, CDN script tags
- [x] Implement `src/views/landing.ejs` — hero section, features cards, demo preview section
- [x] Implement `src/views/app.ejs` — demo banner, 4 tab buttons, all 4 tab panel contents (Dashboard, Listings, Orders, Analytics) with inline data script blocks
- [x] Implement `src/views/about.ejs` — about page content
- [x] Implement `src/views/settings.ejs` — settings form with all 4 fields, save button, optional API key notice
- [x] Implement `public/css/style.css` — CSS variables, nav, status bar, stat cards, tables, badges, modal, skeleton, tab styles, responsive breakpoint at 768px
- [x] Implement `public/js/app.js` — tab switching, keyboard shortcuts, listings table (fetch + filter + sort + pagination), orders table (fetch + filter), order detail modal, demo banner dismiss, on-vacation toggle
- [x] Implement `public/js/charts.js` — initialise all 4 Chart.js charts using `window.__REVENUE_DATA__` and `window.__ANALYTICS__` with specified colour palette
- [x] Implement `public/js/settings.js` — localStorage load on page load, save on button click, 3-second toast notification
- [x] Write `Dockerfile` using node:20-alpine, WORKDIR /app, npm ci --omit=dev, COPY source, EXPOSE 3000, ENV PORT=3000, CMD node src/app.js
- [x] Write `docker-compose.yml` with app service, ports `${APP_PORT:-4000}:3000`, env_file `.env`, and healthcheck hitting `/api/status`
