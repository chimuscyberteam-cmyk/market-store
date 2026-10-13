import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/:itemId/:otherUserId', requireAuth, async (req, res, next) => {
  try {
    const { itemId, otherUserId } = req.params;
    const me = req.user.sub;
    const { rows } = await pool.query(
      `SELECT * FROM messages
       WHERE item_id = $1
         AND ((sender_id = $2 AND receiver_id = $3)
           OR (sender_id = $3 AND receiver_id = $2))
       ORDER BY created_at ASC
       LIMIT 500`,
      [itemId, me, otherUserId]
    );
    res.json({ messages: rows });
  } catch (err) { next(err); }
});

export default router;
