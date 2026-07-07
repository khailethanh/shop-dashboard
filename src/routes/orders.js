'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/orders/:id/fulfill', (req, res) => {
  const orderId = parseInt(req.params.id, 10);
  const shopId = req.session.activeShopId;
  const { carrier, tracking_number } = req.body;

  if (!shopId) return res.status(403).json({ ok: false, error: 'No active shop' });

  const order = db.prepare('SELECT id FROM orders WHERE id = ? AND shop_id = ?').get(orderId, shopId);
  if (!order) return res.status(404).json({ ok: false, error: 'Order not found' });

  db.prepare(
    `UPDATE orders SET status = 'shipped', carrier = ?, tracking_number = ?, fulfilled_at = datetime('now') WHERE id = ?`
  ).run(carrier || null, tracking_number || null, orderId);

  res.json({ ok: true });
});

router.post('/orders/bulk-process', (req, res) => {
  const shopId = req.session.activeShopId;
  const { orderIds } = req.body;

  if (!shopId) return res.status(403).json({ ok: false, error: 'No active shop' });
  if (!Array.isArray(orderIds) || orderIds.length === 0) {
    return res.status(400).json({ ok: false, error: 'orderIds must be a non-empty array' });
  }

  const placeholders = orderIds.map(() => '?').join(', ');
  db.prepare(
    `UPDATE orders SET status = 'processing' WHERE id IN (${placeholders}) AND shop_id = ?`
  ).run(...orderIds, shopId);

  res.json({ ok: true });
});

module.exports = router;
