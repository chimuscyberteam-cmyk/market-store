import { pool } from '../db/pool.js';

export async function logAdminAction({
  adminId,
  action,
  targetType = null,
  targetId = null,
  metadata = {},
  ip = null
}) {
  try {
    await pool.query(
      `INSERT INTO admin_actions (admin_id, action, target_type, target_id, metadata, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [adminId, action, targetType, targetId, JSON.stringify(metadata), ip]
    );
  } catch (err) {
    console.error('Audit log failed:', err);
  }
}
