'use strict';
const express = require('express');
const mockData = require('../data/mockData');

const router = express.Router();

router.get('/', (req, res) => {
  res.render('landing', { title: 'Welcome', shop: mockData.shop, currentPath: '/' });
});

router.get('/app', (req, res) => {
  res.render('app', {
    title: 'Dashboard',
    shop: mockData.shop,
    stats: mockData.stats,
    recentOrders: mockData.recentOrders,
    revenueByDay: mockData.revenueByDay,
    analyticsData: mockData.analyticsData,
    currentPath: '/app',
  });
});

router.get('/about', (req, res) => {
  res.render('about', { title: 'About', shop: mockData.shop, currentPath: '/about' });
});

module.exports = router;
