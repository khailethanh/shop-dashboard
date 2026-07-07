'use strict';
const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/api/status', (req, res) => {
  res.json({ connected: false, shop: res.locals.activeShop || null });
});

router.get('/api/mock/listings', (req, res) => {
  const shopId = req.session && req.session.activeShopId;
  if (!shopId) return res.json([]);
  const listings = db.prepare('SELECT * FROM listings WHERE shop_id = ?').all(shopId);
  res.json(listings);
});

router.get('/api/mock/orders', (req, res) => {
  const shopId = req.session && req.session.activeShopId;
  if (!shopId) return res.json([]);
  const orders = db.prepare('SELECT * FROM orders WHERE shop_id = ? ORDER BY order_date DESC').all(shopId);
  const orderIds = orders.map(o => o.id);
  const items = orderIds.length
    ? db.prepare(`SELECT * FROM order_items WHERE order_id IN (${orderIds.map(() => '?').join(',')})`)
        .all(...orderIds)
    : [];
  const itemsByOrder = {};
  for (const item of items) {
    if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
    itemsByOrder[item.order_id].push(item);
  }
  const result = orders.map(o => ({
    ...o,
    items: itemsByOrder[o.id] || []
  }));
  res.json(result);
});

router.get('/api/mock/reviews', (req, res) => {
  const shopId = req.session && req.session.activeShopId;
  if (!shopId) return res.json([]);
  const reviews = db.prepare('SELECT * FROM reviews WHERE shop_id = ? ORDER BY review_date DESC').all(shopId);
  res.json(reviews);
});

module.exports = router;
