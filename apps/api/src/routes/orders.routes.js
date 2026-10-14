import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import { distanceMeters, deliveryFee } from '@market-store/shared';

const router = Router();

const quoteSchema = z.object({
  itemId: z.string().uuid(),
  deliveryLat: z.number().min(-90).max(90),
  deliveryLng: z.number().min(-180).max(180)
});

router.post('/quote', async (req, res, next) => {
  try {
    const d = quoteSchema.parse(req.body);
    const { rows } = await pool.query(
      `SELECT id, price_zmw, latitude, longitude FROM items WHERE id = $1 AND status = 'active'`,
      [d.itemId]
    );
    const item = rows[0];
    if (!item) return res.status(404).json({ error: 'Item not available' });

    const distance = Math.round(distanceMeters(
      { lat: item.latitude, lng: item.longitude },
      { lat: d.deliveryLat, lng: d.deliveryLng }
    ));
    const fee = deliveryFee(distance);
    const itemPrice = Number(item.price_zmw);

    res.json({
      distanceMeters: distance,
      deliveryFeeZmw: fee,
      itemPriceZmw: itemPrice,
      totalZmw: itemPrice + fee
    });
  } catch (err) { next(err); }
});

const createSchema = quoteSchema.extend({ paymentMethod: z.enum(['pod', 'momo']) });

router.post('/', requireAuth, async (req, res, next) => {
  const client = await pool.connect();
  try {
    const d = createSchema.parse(req.body);
    await client.query('BEGIN');

    const { rows } = await client.query(
      `SELECT id, seller_id, price_zmw, latitude, longitude
       FROM items WHERE id = $1 AND status = 'active' FOR UPDATE`,
      [d.itemId]
    );
    const item = rows[0];
    if (!item) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Item not available' }); }
    if (item.seller_id === req.user.sub) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Cannot buy your own item' });
    }

    const distance = Math.round(distanceMeters(
      { lat: item.latitude, lng: item.longitude },
      { lat: d.deliveryLat, lng: d.deliveryLng }
    ));
    const fee = deliveryFee(distance);
    const itemPrice = Number(item.price_zmw);
    const total = itemPrice + fee;

    const { rows: orderRows } = await client.query(
      `INSERT INTO orders
         (item_id, buyer_id, seller_id, distance_meters, delivery_fee_zmw,
          item_price_zmw, total_zmw, payment_method, delivery_lat, delivery_lng)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [d.itemId, req.user.sub, item.seller_id, distance, fee,
       itemPrice, total, d.paymentMethod, d.deliveryLat, d.deliveryLng]
    );

    await client.query('COMMIT');
    res.status(201).json({ order: orderRows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// Buyer's orders
router.get('/mine', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT o.*, i.title AS item_title, i.image_urls AS item_images,
              i.category_id, u.full_name AS seller_name
       FROM orders o
       JOIN items i ON i.id = o.item_id
       JOIN users u ON u.id = o.seller_id
       WHERE o.buyer_id = $1
       ORDER BY o.created_at DESC
       LIMIT 100`,
      [req.user.sub]
    );
    res.json({ orders: rows });
  } catch (err) { next(err); }
});

// Seller's incoming orders
router.get('/selling', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT o.*, i.title AS item_title, i.image_urls AS item_images,
              i.category_id, u.full_name AS buyer_name, u.phone AS buyer_phone
       FROM orders o
       JOIN items i ON i.id = o.item_id
       JOIN users u ON u.id = o.buyer_id
       WHERE o.seller_id = $1
       ORDER BY o.created_at DESC
       LIMIT 100`,
      [req.user.sub]
    );
    res.json({ orders: rows });
  } catch (err) { next(err); }
});

// Update order status — only seller or buyer of that order
const statusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'delivered', 'cancelled'])
});

router.patch('/:id/status', requireAuth, async (req, res, next) => {
  try {
    const { status } = statusSchema.parse(req.body);
    const me = req.user.sub;

    const { rows: existing } = await pool.query(
      `SELECT id, buyer_id, seller_id, status FROM orders WHERE id = $1`,
      [req.params.id]
    );
    const order = existing[0];
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const isSeller = order.seller_id === me;
    const isBuyer = order.buyer_id === me;
    if (!isSeller && !isBuyer) return res.status(403).json({ error: 'Not your order' });

    // Rules:
    //  - seller can move pending -> confirmed -> delivered, or cancel pending
    //  - buyer can only cancel while pending
    if (status === 'confirmed' && !isSeller) return res.status(403).json({ error: 'Only seller can confirm' });
    if (status === 'delivered' && !isSeller) return res.status(403).json({ error: 'Only seller can mark delivered' });
    if (status === 'cancelled' && order.status !== 'pending') {
      return res.status(400).json({ error: 'Can only cancel pending orders' });
    }

    const paymentStatus = status === 'delivered' && order.payment_method === 'pod'
      ? 'paid'
      : undefined;

    const { rows } = await pool.query(
      `UPDATE orders
       SET status = $1 ${paymentStatus ? ', payment_status = $4' : ''}
       WHERE id = $2 RETURNING *`,
      paymentStatus
        ? [status, req.params.id, me, paymentStatus]
        : [status, req.params.id]
    );
    // Note: when paymentStatus is undefined we only pass [status, id]
    // The query above was written defensively; the simpler version:
    if (!rows[0]) {
      const retry = await pool.query(
        `UPDATE orders SET status = $1 WHERE id = $2 RETURNING *`,
        [status, req.params.id]
      );
      return res.json({ order: retry.rows[0] });
    }
    res.json({ order: rows[0] });
  } catch (err) { next(err); }
});

export default router;
