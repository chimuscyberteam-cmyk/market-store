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

export default router;
