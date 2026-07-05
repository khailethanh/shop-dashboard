'use strict';

const listings = [
  { id: 'L001', title: 'Hand-painted Watercolour Cat Print', price: 24.99, quantity: 15, views: 342, status: 'active', thumbnail: '/img/placeholder.png' },
  { id: 'L002', title: 'Minimalist Mountain Line Art', price: 18.50, quantity: 8, views: 512, status: 'active', thumbnail: '/img/placeholder.png' },
  { id: 'L003', title: 'Personalised Name Necklace', price: 45.00, quantity: 3, views: 789, status: 'active', thumbnail: '/img/placeholder.png' },
  { id: 'L004', title: 'Botanical Pressed Flower Bookmark', price: 12.00, quantity: 22, views: 198, status: 'active', thumbnail: '/img/placeholder.png' },
  { id: 'L005', title: 'Handmade Soy Candle — Lavender', price: 22.00, quantity: 11, views: 456, status: 'active', thumbnail: '/img/placeholder.png' },
  { id: 'L006', title: 'Vintage-style Recipe Card Set (10)', price: 15.99, quantity: 0, views: 134, status: 'inactive', thumbnail: '/img/placeholder.png' },
  { id: 'L007', title: 'Macramé Wall Hanging — Small', price: 38.00, quantity: 5, views: 621, status: 'active', thumbnail: '/img/placeholder.png' },
  { id: 'L008', title: 'Custom Pet Portrait — Digital', price: 55.00, quantity: 99, views: 803, status: 'active', thumbnail: '/img/placeholder.png' },
  { id: 'L009', title: 'Dried Flower Resin Keyring', price: 14.50, quantity: 0, views: 87, status: 'inactive', thumbnail: '/img/placeholder.png' },
  { id: 'L010', title: 'Hand-lettered Motivational Print', price: 19.99, quantity: 30, views: 275, status: 'active', thumbnail: '/img/placeholder.png' },
];

const orders = [
  { id: 'O1001', buyerName: 'Alice Johnson', date: '2026-04-07', items: [{ title: 'Hand-painted Watercolour Cat Print', qty: 1 }], itemCount: 1, total: 24.99, status: 'completed' },
  { id: 'O1002', buyerName: 'Bob Martinez', date: '2026-04-18', items: [{ title: 'Minimalist Mountain Line Art', qty: 2 }], itemCount: 2, total: 37.00, status: 'completed' },
  { id: 'O1003', buyerName: 'Carol Smith', date: '2026-05-03', items: [{ title: 'Personalised Name Necklace', qty: 1 }], itemCount: 1, total: 45.00, status: 'completed' },
  { id: 'O1004', buyerName: 'David Lee', date: '2026-05-20', items: [{ title: 'Handmade Soy Candle — Lavender', qty: 1 }, { title: 'Botanical Pressed Flower Bookmark', qty: 2 }], itemCount: 3, total: 46.00, status: 'cancelled' },
  { id: 'O1005', buyerName: 'Emma Wilson', date: '2026-06-02', items: [{ title: 'Macramé Wall Hanging — Small', qty: 1 }], itemCount: 1, total: 38.00, status: 'completed' },
  { id: 'O1006', buyerName: 'Frank Brown', date: '2026-06-11', items: [{ title: 'Custom Pet Portrait — Digital', qty: 1 }], itemCount: 1, total: 55.00, status: 'completed' },
  { id: 'O1007', buyerName: 'Grace Kim', date: '2026-06-19', items: [{ title: 'Hand-lettered Motivational Print', qty: 2 }], itemCount: 2, total: 39.98, status: 'completed' },
  { id: 'O1008', buyerName: 'Henry Patel', date: '2026-06-25', items: [{ title: 'Personalised Name Necklace', qty: 1 }], itemCount: 1, total: 45.00, status: 'open' },
  { id: 'O1009', buyerName: 'Isabel Chen', date: '2026-07-01', items: [{ title: 'Minimalist Mountain Line Art', qty: 1 }, { title: 'Hand-painted Watercolour Cat Print', qty: 1 }], itemCount: 2, total: 43.49, status: 'open' },
  { id: 'O1010', buyerName: 'James Taylor', date: '2026-07-04', items: [{ title: 'Handmade Soy Candle — Lavender', qty: 2 }], itemCount: 2, total: 44.00, status: 'open' },
];

const recentOrders = orders.slice(-5);

const revenueByDay = [
  { date: '2026-06-29', revenue: 24.99 },
  { date: '2026-06-30', revenue: 0 },
  { date: '2026-07-01', revenue: 43.49 },
  { date: '2026-07-02', revenue: 55.00 },
  { date: '2026-07-03', revenue: 0 },
  { date: '2026-07-04', revenue: 44.00 },
  { date: '2026-07-05', revenue: 0 },
];

const analyticsData = {
  topListings: [
    { title: 'Custom Pet Portrait — Digital', views: 803 },
    { title: 'Personalised Name Necklace', views: 789 },
    { title: 'Macramé Wall Hanging — Small', views: 621 },
    { title: 'Minimalist Mountain Line Art', views: 512 },
    { title: 'Handmade Soy Candle — Lavender', views: 456 },
  ],
  byDayOfWeek: [
    { day: 'Mon', orders: 3 },
    { day: 'Tue', orders: 1 },
    { day: 'Wed', orders: 2 },
    { day: 'Thu', orders: 4 },
    { day: 'Fri', orders: 2 },
    { day: 'Sat', orders: 5 },
    { day: 'Sun', orders: 1 },
  ],
  revenueByMonth: [
    { month: 'Feb', revenue: 89.99 },
    { month: 'Mar', revenue: 134.50 },
    { month: 'Apr', revenue: 106.99 },
    { month: 'May', revenue: 91.00 },
    { month: 'Jun', revenue: 232.97 },
    { month: 'Jul', revenue: 87.49 },
  ],
  conversionRate: 3.2,
};

const shop = {
  name: 'MyShop',
  currency: 'USD',
  totalSales: 147,
  isStarSeller: true,
  onVacation: false,
  lastSynced: '2026-07-05T09:00:00Z',
};

const stats = {
  totalOrders: { value: 147, trend: '+12%' },
  revenue: { value: 743.93, trend: '+8%' },
  avgOrderValue: { value: 38.20, trend: '+3%' },
  activeListings: { value: 8, trend: '0%' },
};

const mockData = { shop, stats, listings, orders, recentOrders, revenueByDay, analyticsData };

module.exports = mockData;
