'use strict';

const bcrypt = require('bcrypt');
const db = require('../src/db');
const { shop: shopData, listings, orders, reviews } = require('../src/data/mockData');

const DEMO_EMAIL = 'demo@example.com';
const DEMO_PASSWORD = 'password123';
const DEMO_SHOP_NAME = 'Artisan Collective';

async function seed() {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(DEMO_EMAIL);
  if (existing) {
    console.log('Demo data already seeded — skipping.');
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const userId = db.prepare(
    'INSERT INTO users (email, password_hash) VALUES (?, ?)'
  ).run(DEMO_EMAIL, passwordHash).lastInsertRowid;

  const shopId = db.prepare(
    `INSERT INTO shops (user_id, name, currency, is_star_seller, on_vacation, last_synced_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    userId,
    DEMO_SHOP_NAME,
    shopData.currency || 'USD',
    shopData.isStarSeller ? 1 : 0,
    shopData.onVacation ? 1 : 0,
    shopData.lastSynced || null,
  ).lastInsertRowid;

  // Build listing title → price lookup for order item pricing
  const priceByTitle = {};
  for (const listing of listings) {
    priceByTitle[listing.title] = listing.price;
  }

  const insertListing = db.prepare(
    `INSERT INTO listings (shop_id, etsy_listing_id, title, price, quantity, views, status, thumbnail_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const listing of listings) {
    insertListing.run(shopId, listing.id, listing.title, listing.price, listing.quantity, listing.views, listing.status, listing.thumbnail || null);
  }

  const insertOrder = db.prepare(
    `INSERT INTO orders (shop_id, etsy_order_id, buyer_name, order_date, total, status, shipping_address, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertItem = db.prepare(
    'INSERT INTO order_items (order_id, title, qty, price) VALUES (?, ?, ?, ?)'
  );

  const seedOrders = db.transaction(() => {
    for (const order of orders) {
      const orderId = insertOrder.run(
        shopId,
        order.id,
        order.buyerName,
        order.date,
        order.total,
        order.status,
        JSON.stringify(order.shippingAddress || {}),
        order.notes || '',
      ).lastInsertRowid;

      const totalQty = order.items.reduce((s, it) => s + it.qty, 0);
      for (const item of order.items) {
        const price = priceByTitle[item.title] ?? (totalQty > 0 ? (item.qty / totalQty) * order.total : 0);
        insertItem.run(orderId, item.title, item.qty, price);
      }
    }
  });
  seedOrders();

  const insertReview = db.prepare(
    `INSERT INTO reviews (shop_id, etsy_review_id, buyer_name, rating, review_text, review_date, shop_response, responded_at, flagged)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const review of reviews) {
    const respondedAt = review.shop_response ? review.review_date : null;
    insertReview.run(
      shopId,
      review.etsy_review_id,
      review.buyer_name,
      review.rating,
      review.review_text,
      review.review_date,
      review.shop_response || '',
      respondedAt,
      review.flagged ? 1 : 0,
    );
  }

  console.log(`Seeded: user ${DEMO_EMAIL}, shop "${DEMO_SHOP_NAME}", ${listings.length} listings, ${orders.length} orders, ${reviews.length} reviews.`);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
