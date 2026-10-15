import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/conversations', requireAuth, async (req, res, next) => {
  try {
    const me = req.user.sub;
    const { rows } = await pool.query(
      `WITH pairs AS (
         SELECT
           m.item_id,
           CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END AS other_user_id,
           MAX(m.created_at) AS last_message_at
         FROM messages m
         WHERE m.sender_id = $1 OR m.receiver_id = $1
         GROUP BY m.item_id, other_user_id
       )
       SELECT
         p.item_id,
         p.other_user_id,
         p.last_message_at,
         i.title AS item_title,
         u.full_name AS other_user_name,
         (
           SELECT m2.body FROM messages m2
           WHERE m2.item_id = p.item_id
             AND ((m2.sender_id = $1 AND m2.receiver_id = p.other_user_id)
               OR (m2.sender_id = p.other_user_id AND m2.receiver_id = $1))
           ORDER BY m2.created_at DESC
           LIMIT 1
         ) AS last_message_body
       FROM pairs p
       JOIN items i ON i.id = p.item_id
       JOIN users u ON u.id = p.other_user_id
       ORDER BY p.last_message_at DESC
       LIMIT 100`,
      [me]
    );
    res.json({ conversations: rows });
  } catch (err) { next(err); }
});

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
