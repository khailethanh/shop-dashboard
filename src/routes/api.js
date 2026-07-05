'use strict';
const express = require('express');
const mockData = require('../data/mockData');

const router = express.Router();

router.get('/api/status', (req, res) => {
  res.json({ connected: false, shop: mockData.shop });
});

router.get('/api/mock/listings', (req, res) => {
  res.json(mockData.listings);
});

router.get('/api/mock/orders', (req, res) => {
  res.json(mockData.orders);
});

module.exports = router;
