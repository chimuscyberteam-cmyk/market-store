import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { logAdminAction } from '../utils/audit.js';

const router = Router();

router.use(requireAuth, requireRole('admin'));

// List all users
router.get('/users', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, full_name, email, phone, role, created_at
       FROM users ORDER BY created_at DESC LIMIT 200`
    );
    res.json({ users: rows });
  } catch (err) { next(err); }
});

// Change a user's role
const roleSchema = z.object({
  role: z.enum(['buyer', 'seller', 'admin'])
});

router.patch('/users/:id/role', async (req, res, next) => {
  try {
    const { role } = roleSchema.parse(req.body);
    const targetId = req.params.id;

    const { rows: before } = await pool.query(
      `SELECT id, full_name, email, role FROM users WHERE id = $1`,
      [targetId]
    );
    if (!before[0]) return res.status(404).json({ error: 'User not found' });

    if (targetId === req.user.sub && role !== 'admin') {
      return res.status(400).json({ error: 'Cannot demote your own admin account' });
    }

    const { rows } = await pool.query(
      `UPDATE users SET role = $1 WHERE id = $2
       RETURNING id, full_name, email, role`,
      [role, targetId]
    );

    await logAdminAction({
      adminId: req.user.sub,
      action: 'role_changed',
      targetType: 'user',
      targetId,
      metadata: { from: before[0].role, to: role, user_email: before[0].email },
      ip: req.ip
    });

    res.json({ user: rows[0] });
  } catch (err) { next(err); }
});

// Soft-delete a listing
router.delete('/items/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `UPDATE items SET status = 'removed' WHERE id = $1
       RETURNING id, title, seller_id`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Item not found' });

    await logAdminAction({
      adminId: req.user.sub,
      action: 'item_removed',
      targetType: 'item',
      targetId: req.params.id,
      metadata: { title: rows[0].title, seller_id: rows[0].seller_id },
      ip: req.ip
    });

    res.status(204).end();
  } catch (err) { next(err); }
});

// View all orders
router.get('/orders', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT o.*, i.title AS item_title,
              bu.full_name AS buyer_name, su.full_name AS seller_name
       FROM orders o
       JOIN items i ON i.id = o.item_id
       JOIN users bu ON bu.id = o.buyer_id
       JOIN users su ON su.id = o.seller_id
       ORDER BY o.created_at DESC LIMIT 200`
    );
    res.json({ orders: rows });
  } catch (err) { next(err); }
});

// Platform stats
router.get('/stats', async (req, res, next) => {
  try {
    const [users, items, orders, revenue] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS n FROM users`),
      pool.query(`SELECT COUNT(*)::int AS n FROM items WHERE status = 'active'`),
      pool.query(`SELECT COUNT(*)::int AS n FROM orders`),
      pool.query(`SELECT COALESCE(SUM(total_zmw),0)::numeric AS sum FROM orders WHERE status = 'delivered'`)
    ]);
    res.json({
      users: users.rows[0].n,
      activeItems: items.rows[0].n,
      orders: orders.rows[0].n,
      deliveredRevenue: revenue.rows[0].sum
    });
  } catch (err) { next(err); }
});

// Audit log
router.get('/audit', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT a.*, u.full_name AS admin_name
       FROM admin_actions a
       LEFT JOIN users u ON u.id = a.admin_id
       ORDER BY a.created_at DESC LIMIT 200`
    );
    res.json({ actions: rows });
  } catch (err) { next(err); }
});

export default router;
