import { Router } from 'express';
import { z } from 'zod';
import crypto from 'node:crypto';
import { pool } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import { hashPassword, verifyPassword } from '../utils/password.js';

const router = Router();
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, email, phone, full_name, role, created_at
       FROM users WHERE id = $1`,
      [req.user.sub]
    );
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json({ user: rows[0] });
  } catch (err) { next(err); }
});

router.post('/me/become-seller', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `UPDATE users SET role = 'seller'
       WHERE id = $1 AND role = 'buyer'
       RETURNING id, email, phone, full_name, role`,
      [req.user.sub]
    );
    if (!rows[0]) {
      const current = await pool.query(
        `SELECT id, email, phone, full_name, role FROM users WHERE id = $1`,
        [req.user.sub]
      );
      return res.json({ user: current.rows[0], message: 'Already seller or admin' });
    }
    res.json({ user: rows[0] });
  } catch (err) { next(err); }
});

router.post('/me/change-password', requireAuth, async (req, res, next) => {
  try {
    const { currentPassword, newPassword, keepRefreshToken } = z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(8),
      keepRefreshToken: z.string().optional()
    }).parse(req.body);

    const { rows } = await pool.query(
      `SELECT id, password_hash FROM users WHERE id = $1`,
      [req.user.sub]
    );
    const user = rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });

    const ok = await verifyPassword(currentPassword, user.password_hash);
    if (!ok) return res.status(400).json({ error: 'Current password is incorrect' });

    if (currentPassword === newPassword) {
      return res.status(400).json({ error: 'New password must be different' });
    }

    const passwordHash = await hashPassword(newPassword);

    await pool.query('BEGIN');
    try {
      await pool.query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [passwordHash, req.user.sub]);
      if (keepRefreshToken) {
        await pool.query(
          `DELETE FROM refresh_tokens WHERE user_id = $1 AND token_hash != $2`,
          [req.user.sub, sha256(keepRefreshToken)]
        );
      } else {
        await pool.query(`DELETE FROM refresh_tokens WHERE user_id = $1`, [req.user.sub]);
      }
      await pool.query('COMMIT');
    } catch (e) {
      await pool.query('ROLLBACK');
      throw e;
    }

    res.json({ ok: true, message: 'Password updated' });
  } catch (err) { next(err); }
});


// Become a seller
router.post('/become-seller', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `UPDATE users SET role = 'seller' WHERE id = $1 RETURNING id, email, full_name, role`,
      [req.user.sub]
    );
    
    // Note: The user must log out and log back in to get a new token with the new role.
    res.json({ user: rows[0], message: 'You are now a seller. Please log out and log back in to apply changes.' });
  } catch (err) { next(err); }
});

export default router;

