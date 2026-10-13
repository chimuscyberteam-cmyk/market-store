import crypto from 'node:crypto';
import { pool } from '../db/pool.js';
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
export async function storeRefreshToken(userId, token, expiresAt) {
  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1,$2,$3)`,
    [userId, sha256(token), expiresAt]
  );
}
export async function isRefreshTokenValid(token) {
  const { rows } = await pool.query(
    `SELECT 1 FROM refresh_tokens WHERE token_hash = $1 AND expires_at > now()`,
    [sha256(token)]
  );
  return rows.length > 0;
}
export async function revokeRefreshToken(token) {
  await pool.query(`DELETE FROM refresh_tokens WHERE token_hash = $1`, [sha256(token)]);
}
