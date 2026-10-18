import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// 1. Get Platform Stats
router.get('/stats', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users) AS total_users,
        (SELECT COUNT(*) FROM items WHERE status = 'active') AS active_items,
        (SELECT COUNT(*) FROM orders) AS total_orders,
        (SELECT COALESCE(SUM(total_zmw), 0) FROM orders WHERE status = 'delivered') AS total_revenue
    `);
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// 2. Get All Users
router.get('/users', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT id, full_name, email, phone, role, subscription_tier, suspended_until, created_at
      FROM users ORDER BY created_at DESC
    `);
    res.json({ users: rows });
  } catch (err) { next(err); }
});

// 3. Suspend / Unsuspend a User
router.patch('/users/:id/suspend', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      UPDATE users 
      SET suspended_until = CASE 
        WHEN suspended_until IS NULL OR suspended_until < NOW() THEN NOW() + INTERVAL '7 days'
        ELSE NULL 
      END
      WHERE id = $1 RETURNING *
    `, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json({ user: rows[0] });
  } catch (err) { next(err); }
});

// 4. Get All Listings
router.get('/items', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT i.*, u.full_name AS seller_name 
      FROM items i 
      JOIN users u ON u.id = i.seller_id 
      ORDER BY i.created_at DESC
    `);
    res.json({ items: rows });
  } catch (err) { next(err); }
});

// 5. Force Remove an Item
router.patch('/items/:id/remove', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      UPDATE items SET status = 'removed' WHERE id = $1 RETURNING *
    `, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Item not found' });
    res.json({ item: rows[0] });
  } catch (err) { next(err); }
});

export default router;
