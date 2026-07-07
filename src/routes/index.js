'use strict';
const express = require('express');
const db = require('../db');
const mockData = require('../data/mockData');

const router = express.Router();

function renderDashboard(req, res) {
  const user = res.locals.user;
  const activeShop = res.locals.activeShop;

  if (!activeShop) {
    return res.redirect('/shops/add');
  }

  const shops = db.prepare('SELECT * FROM shops WHERE user_id = ? ORDER BY id ASC').all(user.id);
  const reviews = db.prepare('SELECT * FROM reviews WHERE shop_id = ? ORDER BY review_date DESC').all(activeShop.id);

  res.render('app', {
    title: 'Dashboard',
    shop: activeShop,
    stats: mockData.stats,
    listings: mockData.listings,
    orders: mockData.orders,
    recentOrders: mockData.recentOrders,
    revenueByDay: mockData.revenueByDay,
    analyticsData: mockData.analyticsData,
    shops,
    reviews,
    currentPath: '/',
  });
}

router.get('/', renderDashboard);
router.get('/app', renderDashboard);

router.get('/about', (req, res) => {
  res.render('about', { title: 'About', shop: res.locals.activeShop, currentPath: '/about' });
});

router.post('/shops/switch', (req, res) => {
  const shopId = parseInt(req.body.shopId, 10);
  if (shopId && res.locals.user) {
    const shop = db.prepare('SELECT id FROM shops WHERE id = ? AND user_id = ?').get(shopId, res.locals.user.id);
    if (shop) {
      req.session.activeShopId = shop.id;
    }
  }
  res.redirect('/');
});

router.get('/shops/add', (req, res) => {
  if (res.locals.user) {
    const shopCount = db.prepare('SELECT COUNT(*) AS cnt FROM shops WHERE user_id = ?').get(res.locals.user.id);
    if (shopCount && shopCount.cnt > 0 && res.locals.activeShop) {
      return res.redirect('/');
    }
  }
  res.render('add-shop', { title: 'Add Shop', layout: false });
});

router.post('/shops/add', (req, res) => {
  const { shopName, currency, etsyShopId } = req.body;

  if (!shopName || !shopName.trim()) {
    return res.render('add-shop', { title: 'Add Shop', layout: false, error: 'Shop name is required.' });
  }

  const result = db.prepare(
    'INSERT INTO shops (user_id, name, currency, etsy_shop_id) VALUES (?, ?, ?, ?)'
  ).run(res.locals.user.id, shopName.trim(), currency || 'USD', etsyShopId ? etsyShopId.trim() : null);

  req.session.activeShopId = result.lastInsertRowid;
  res.redirect('/');
});

module.exports = router;
