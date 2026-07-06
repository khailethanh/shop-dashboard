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
  {
    id: 'O1001', buyerName: 'Alice Johnson', date: '2026-04-07',
    items: [{ title: 'Hand-painted Watercolour Cat Print', qty: 1 }], itemCount: 1, total: 24.99, status: 'delivered',
    shippingAddress: { street: '14 Maple Ave', city: 'Portland', state: 'OR', zip: '97201', country: 'USA' },
    notes: 'Please gift-wrap if possible.',
  },
  {
    id: 'O1002', buyerName: 'Bob Martinez', date: '2026-04-18',
    items: [{ title: 'Minimalist Mountain Line Art', qty: 2 }], itemCount: 2, total: 37.00, status: 'delivered',
    shippingAddress: { street: '8 Oak Street', city: 'Denver', state: 'CO', zip: '80203', country: 'USA' },
    notes: '',
  },
  {
    id: 'O1003', buyerName: 'Carol Smith', date: '2026-05-03',
    items: [{ title: 'Personalised Name Necklace', qty: 1 }], itemCount: 1, total: 45.00, status: 'delivered',
    shippingAddress: { street: '22 Birch Lane', city: 'Austin', state: 'TX', zip: '78701', country: 'USA' },
    notes: 'Engrave "Carol" on the necklace.',
  },
  {
    id: 'O1004', buyerName: 'David Lee', date: '2026-05-20',
    items: [{ title: 'Handmade Soy Candle — Lavender', qty: 1 }, { title: 'Botanical Pressed Flower Bookmark', qty: 2 }],
    itemCount: 3, total: 46.00, status: 'cancelled',
    shippingAddress: { street: '5 Pine Road', city: 'Seattle', state: 'WA', zip: '98101', country: 'USA' },
    notes: '',
  },
  {
    id: 'O1005', buyerName: 'Emma Wilson', date: '2026-06-02',
    items: [{ title: 'Macramé Wall Hanging — Small', qty: 1 }], itemCount: 1, total: 38.00, status: 'delivered',
    shippingAddress: { street: '77 Cedar Blvd', city: 'Chicago', state: 'IL', zip: '60601', country: 'USA' },
    notes: '',
  },
  {
    id: 'O1006', buyerName: 'Frank Brown', date: '2026-06-11',
    items: [{ title: 'Custom Pet Portrait — Digital', qty: 1 }], itemCount: 1, total: 55.00, status: 'delivered',
    shippingAddress: { street: '33 Elm Street', city: 'Boston', state: 'MA', zip: '02101', country: 'USA' },
    notes: 'Dog is a golden retriever, ref photo sent via message.',
  },
  {
    id: 'O1007', buyerName: 'Grace Kim', date: '2026-06-19',
    items: [{ title: 'Hand-lettered Motivational Print', qty: 2 }], itemCount: 2, total: 39.98, status: 'delivered',
    shippingAddress: { street: '101 Walnut Way', city: 'Nashville', state: 'TN', zip: '37201', country: 'USA' },
    notes: '',
  },
  {
    id: 'O1008', buyerName: 'Henry Patel', date: '2026-06-25',
    items: [{ title: 'Personalised Name Necklace', qty: 1 }], itemCount: 1, total: 45.00, status: 'pending',
    shippingAddress: { street: '55 Willow Court', city: 'Phoenix', state: 'AZ', zip: '85001', country: 'USA' },
    notes: 'Engrave "Henry & Priya" as two lines.',
  },
  {
    id: 'O1009', buyerName: 'Isabel Chen', date: '2026-07-01',
    items: [{ title: 'Minimalist Mountain Line Art', qty: 1 }, { title: 'Hand-painted Watercolour Cat Print', qty: 1 }],
    itemCount: 2, total: 43.49, status: 'pending',
    shippingAddress: { street: '9 Aspen Circle', city: 'San Francisco', state: 'CA', zip: '94102', country: 'USA' },
    notes: '',
  },
  {
    id: 'O1010', buyerName: 'James Taylor', date: '2026-07-04',
    items: [{ title: 'Handmade Soy Candle — Lavender', qty: 2 }], itemCount: 2, total: 44.00, status: 'pending',
    shippingAddress: { street: '18 Spruce Lane', city: 'Atlanta', state: 'GA', zip: '30301', country: 'USA' },
    notes: '',
  },
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

// Compute topListingsByRevenue from orders at module load time
// Map listing titles found in order items to total revenue
const _revMap = {};
orders.forEach(order => {
  if (order.status === 'cancelled') return;
  // Distribute order total proportionally by qty across items
  const totalQty = order.items.reduce((sum, it) => sum + it.qty, 0);
  order.items.forEach(item => {
    const share = totalQty > 0 ? (item.qty / totalQty) * order.total : 0;
    _revMap[item.title] = (_revMap[item.title] || 0) + share;
  });
});

const topListingsByRevenue = Object.entries(_revMap)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
  .map(([title, revenue]) => ({
    title: title.length > 20 ? title.slice(0, 20) : title,
    revenue: Math.round(revenue * 100) / 100,
  }));

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
  revenueByWeek: [
    { week: 'May W4', revenue: 45.00 },
    { week: 'Jun W1', revenue: 83.00 },
    { week: 'Jun W2', revenue: 93.00 },
    { week: 'Jun W3', revenue: 94.98 },
    { week: 'Jun W4', revenue: 45.00 },
    { week: 'Jul W1', revenue: 87.49 },
  ],
  topListingsByRevenue,
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

const reviews = [
  { etsy_review_id: 'R10001', buyer_name: 'Alice Johnson', rating: 5, review_text: 'Absolutely stunning print! The colours are vibrant and it arrived well-packaged. Will definitely order again.', review_date: '2026-04-10', shop_response: 'Thank you so much, Alice! So glad you love it.', flagged: false },
  { etsy_review_id: 'R10002', buyer_name: 'Bob Martinez', rating: 4, review_text: 'Great quality artwork. Shipping took a little longer than expected but the product itself is wonderful.', review_date: '2026-04-22', shop_response: '', flagged: false },
  { etsy_review_id: 'R10003', buyer_name: 'Carol Smith', rating: 5, review_text: 'The personalised necklace is perfect. Engraving is clean and the chain is delicate yet sturdy. Highly recommend!', review_date: '2026-05-08', shop_response: 'So happy you love it, Carol! Wear it in good health.', flagged: false },
  { etsy_review_id: 'R10004', buyer_name: 'Emma Wilson', rating: 5, review_text: 'This macramé wall hanging is even more beautiful in person. Great craftsmanship and fast shipping!', review_date: '2026-06-05', shop_response: '', flagged: false },
  { etsy_review_id: 'R10005', buyer_name: 'Frank Brown', rating: 5, review_text: 'The custom pet portrait is jaw-dropping. Captured my dog perfectly. This shop is incredibly talented.', review_date: '2026-06-14', shop_response: 'Thank you, Frank! Your golden retriever was a joy to paint.', flagged: false },
  { etsy_review_id: 'R10006', buyer_name: 'Grace Kim', rating: 4, review_text: 'Love the motivational prints! They look great framed. One corner had a tiny crease but overall very happy.', review_date: '2026-06-22', shop_response: "Sorry about the crease, Grace! Reach out and I'll send a replacement.", flagged: false },
  { etsy_review_id: 'R10007', buyer_name: 'Henry Patel', rating: 2, review_text: "Still waiting on my order. It's been over a week with no tracking update. Very disappointed.", review_date: '2026-07-03', shop_response: '', flagged: true },
  { etsy_review_id: 'R10008', buyer_name: 'Olivia Nguyen', rating: 5, review_text: 'The soy candle smells absolutely divine. Lavender is so calming. Packaging was cute too — great gift idea.', review_date: '2026-06-28', shop_response: '', flagged: false },
  { etsy_review_id: 'R10009', buyer_name: 'Liam Okonkwo', rating: 3, review_text: 'Decent quality but the colours in person are a bit duller than in the listing photos. Still happy enough.', review_date: '2026-07-01', shop_response: '', flagged: false },
  { etsy_review_id: 'R10010', buyer_name: 'Sophia Reyes', rating: 5, review_text: 'Ordered the botanical bookmark as a gift and my friend absolutely loved it. Will be back for more handmade goodies!', review_date: '2026-07-05', shop_response: 'That is so sweet to hear, Sophia! Thank you for sharing.', flagged: false },
];

const mockData = { shop, stats, listings, orders, recentOrders, revenueByDay, analyticsData, reviews };

module.exports = mockData;
