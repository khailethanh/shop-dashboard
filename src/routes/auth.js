'use strict';
const express = require('express');

const router = express.Router();

router.get('/auth/etsy', (req, res) => {
  res.json({ status: 'oauth_not_implemented' });
});

router.get('/auth/callback', (req, res) => {
  res.json({ status: 'oauth_not_implemented' });
});

module.exports = router;
