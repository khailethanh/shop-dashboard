'use strict';
require('dotenv').config();

const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const session = require('express-session');
const ConnectSQLite = require('connect-sqlite3')(session);
const db = require('./db');

const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const apiRouter = require('./routes/api');
const settingsRouter = require('./routes/settings');
const ordersRouter = require('./routes/orders');
const reviewsRouter = require('./routes/reviews');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));
app.get('/favicon.ico', (req, res) => res.status(204).end());

const sessionStore = new ConnectSQLite({
  db: 'sessions.db',
  dir: path.join(__dirname, '..', 'data'),
  table: 'sessions'
});

app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 }
}));

function loadUser(req, res, next) {
  res.locals.user = null;
  res.locals.activeShop = null;
  if (req.session && req.session.userId) {
    const user = db.prepare('SELECT id, email, created_at FROM users WHERE id = ?').get(req.session.userId);
    if (user) {
      res.locals.user = user;
      const shopId = req.session.activeShopId;
      if (shopId) {
        const shop = db.prepare('SELECT * FROM shops WHERE id = ? AND user_id = ?').get(shopId, user.id);
        res.locals.activeShop = shop || null;
      }
      if (!res.locals.activeShop) {
        const firstShop = db.prepare('SELECT * FROM shops WHERE user_id = ? ORDER BY id ASC LIMIT 1').get(user.id);
        if (firstShop) {
          req.session.activeShopId = firstShop.id;
          res.locals.activeShop = firstShop;
        }
      }
    }
  }
  next();
}

const PUBLIC_PATHS = new Set(['/login', '/logout', '/signup', '/about']);

function requireAuth(req, res, next) {
  if (res.locals.user) return next();
  res.redirect('/login');
}

function authGuard(req, res, next) {
  if (PUBLIC_PATHS.has(req.path)) return next();
  return requireAuth(req, res, next);
}

app.use(loadUser);

// Health check: must stay reachable without a session (Docker healthcheck,
// uptime probes) and must never leak shop data to an unauthenticated caller.
app.get('/api/status', (req, res) => {
  res.json({ ok: true });
});

app.use('/', authRouter);
app.use(authGuard);
app.use('/', indexRouter);
app.use('/', apiRouter);
app.use('/', settingsRouter);
app.use('/', ordersRouter);
app.use('/', reviewsRouter);

app.listen(PORT, () => {
  console.log(`Etsy Dashboard running on port ${PORT}`);
});

module.exports = app;
