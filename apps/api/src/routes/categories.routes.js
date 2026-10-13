import { Router } from 'express';
import { pool } from '../db/pool.js';
const router = Router();
router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(`SELECT id, name, slug, icon FROM categories ORDER BY name`);
    res.json({ categories: rows });
  } catch (err) { next(err); }
});
export default router;
