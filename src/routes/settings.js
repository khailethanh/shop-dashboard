'use strict';
const express = require('express');
const mockData = require('../data/mockData');

const router = express.Router();

router.get('/settings', (req, res) => {
  res.render('settings', {
    title: 'Settings',
    shop: mockData.shop,
    currentPath: '/settings',
    notice: req.query.notice || null,
  });
});

router.post('/settings/save', (req, res) => {
  res.json({ ok: true });
});

module.exports = router;
