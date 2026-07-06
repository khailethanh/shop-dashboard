'use strict';
const express = require('express');
const mockData = require('../data/mockData');

const router = express.Router();

function renderDashboard(req, res) {
  res.render('app', {
    title: 'Dashboard',
    shop: mockData.shop,
    stats: mockData.stats,
    listings: mockData.listings,
    orders: mockData.orders,
    recentOrders: mockData.recentOrders,
    revenueByDay: mockData.revenueByDay,
    analyticsData: mockData.analyticsData,
    currentPath: '/',
  });
}

router.get('/', renderDashboard);
router.get('/app', renderDashboard);
router.get('/about', (req, res) => {
  res.render('about', { title: 'About', currentPath: '/about' });
});

module.exports = router;
