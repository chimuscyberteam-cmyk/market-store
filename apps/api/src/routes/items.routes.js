import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

const createSchema = z.object({
  categoryId: z.number().int().positive(),
  title: z.string().min(3).max(120),
  description: z.string().max(2000).optional().default(''),
  priceZmw: z.number().positive(),
  imageUrls: z.array(z.string().url()).max(6).optional().default([]),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  quantity: z.number().int().positive().default(1)
});

router.post('/', requireAuth, requireRole('seller', 'admin'), async (req, res, next) => {
  try {
    const d = createSchema.parse(req.body);
    const { rows } = await pool.query(
      `INSERT INTO items (seller_id, category_id, title, description, price_zmw, image_urls, latitude, longitude, quantity)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [req.user.sub, d.categoryId, d.title, d.description, d.priceZmw,
       JSON.stringify(d.imageUrls), d.latitude, d.longitude, d.quantity]
    );
    res.status(201).json({ item: rows[0] });
  } catch (err) { next(err); }
});

router.get('/', async (req, res, next) => {
  try {
    const { category, q, limit = 50, offset = 0 } = req.query;
    const params = [];
    const where = [`i.status = 'active'`];
    if (category) { params.push(category); where.push(`c.slug = $${params.length}`); }
    if (q) { params.push(`%${q}%`); where.push(`(i.title ILIKE $${params.length} OR i.description ILIKE $${params.length})`); }
    params.push(Math.min(Number(limit) || 50, 100), Number(offset) || 0);
    const { rows } = await pool.query(
      `SELECT i.*, c.slug AS category_slug, c.name AS category_name, u.full_name AS seller_name, u.is_verified
       FROM items i
       JOIN categories c ON c.id = i.category_id
       JOIN users u ON u.id = i.seller_id
       WHERE ${where.join(' AND ')}
       ORDER BY i.is_featured DESC, i.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    res.json({ items: rows });
  } catch (err) { next(err); }
});

router.get('/mine/list', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM items WHERE seller_id = $1 ORDER BY created_at DESC`, [req.user.sub]
    );
    res.json({ items: rows });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT i.*, c.slug AS category_slug, c.name AS category_name,
              u.id AS seller_id, u.full_name AS seller_name, u.is_verified
       FROM items i
       JOIN categories c ON c.id = i.category_id
       JOIN users u ON u.id = i.seller_id
       WHERE i.id = $1`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Item not found' });
    res.json({ item: rows[0] });
  } catch (err) { next(err); }
});

router.patch('/:id/status', requireAuth, requireRole('seller', 'admin'), async (req, res, next) => {
  try {
    const { status } = z.object({ status: z.enum(['active', 'sold', 'removed']) }).parse(req.body);
    const { rows } = await pool.query(
      `UPDATE items SET status = $1 WHERE id = $2 AND seller_id = $3 RETURNING *`,
      [status, req.params.id, req.user.sub]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Item not found or not yours' });
    res.json({ item: rows[0] });
  } catch (err) { next(err); }
});


// Edit item price and quantity
router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const { priceZmw, quantity } = z.object({
      priceZmw: z.number().positive(),
      quantity: z.number().int().nonnegative()
    }).parse(req.body);

    const { rows } = await pool.query(
      `UPDATE items 
       SET price_zmw = $1, 
           quantity = $2, 
           status = CASE WHEN $2 = 0 THEN 'sold' ELSE 'active' END 
       WHERE id = $3 AND seller_id = $4 RETURNING *`,
      [priceZmw, quantity, req.params.id, req.user.sub]
    );
    
    if (!rows[0]) return res.status(404).json({ error: 'Item not found or not yours' });
    res.json({ item: rows[0] });
  } catch (err) { next(err); }
});


// Mock Boost Route (We will replace with real payment later)
router.post('/:id/boost', requireAuth, async (req, res, next) => {
  try {
    // In the future, verify payment here.
    const { rows } = await pool.query(
      `UPDATE items SET is_featured = true WHERE id = $1 AND seller_id = $2 RETURNING *`,
      [req.params.id, req.user.sub]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Item not found or not yours' });
    res.json({ item: rows[0] });
  } catch (err) { next(err); }
});

export default router;

