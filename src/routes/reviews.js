'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/reviews/:id/respond', (req, res) => {
  const reviewId = parseInt(req.params.id, 10);
  const shopId = req.session.activeShopId;
  const { shop_response } = req.body;

  if (!shopId) return res.status(403).json({ ok: false, error: 'No active shop' });

  const review = db.prepare('SELECT id FROM reviews WHERE id = ? AND shop_id = ?').get(reviewId, shopId);
  if (!review) return res.status(404).json({ ok: false, error: 'Review not found' });

  db.prepare(
    `UPDATE reviews SET shop_response = ?, responded_at = datetime('now') WHERE id = ?`
  ).run(shop_response || null, reviewId);

  res.json({ ok: true });
});

router.post('/reviews/:id/flag', (req, res) => {
  const reviewId = parseInt(req.params.id, 10);
  const shopId = req.session.activeShopId;

  if (!shopId) return res.status(403).json({ ok: false, error: 'No active shop' });

  const review = db.prepare('SELECT id, flagged FROM reviews WHERE id = ? AND shop_id = ?').get(reviewId, shopId);
  if (!review) return res.status(404).json({ ok: false, error: 'Review not found' });

  const newFlagged = review.flagged ? 0 : 1;
  db.prepare('UPDATE reviews SET flagged = ? WHERE id = ?').run(newFlagged, reviewId);

  res.json({ ok: true, flagged: newFlagged === 1 });
});

module.exports = router;
