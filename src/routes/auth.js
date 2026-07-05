'use strict';
const express = require('express');

const router = express.Router();

router.get('/auth/etsy', (req, res) => {
  if (process.env.ETSY_API_KEY) {
    res.redirect('https://www.etsy.com/oauth/connect?response_type=code&redirect_uri=http://localhost:3000/auth/callback');
  } else {
    res.redirect('/settings?notice=api_key_required');
  }
});

router.get('/auth/callback', (req, res) => {
  res.json({ status: 'oauth_not_implemented' });
});

module.exports = router;
