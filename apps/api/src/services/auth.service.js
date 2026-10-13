import { pool } from '../db/pool.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
export async function createUser({ email, phone, password, fullName, role = 'buyer' }) {
  const passwordHash = await hashPassword(password);
  const { rows } = await pool.query(
    `INSERT INTO users (email, phone, password_hash, full_name, role)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING id, email, phone, full_name, role, created_at`,
    [email.toLowerCase(), phone, passwordHash, fullName, role]
  );
  return rows[0];
}
export async function findUserByEmail(email) {
  const { rows } = await pool.query(`SELECT * FROM users WHERE email = $1`, [email.toLowerCase()]);
  return rows[0] || null;
}
export async function findUserById(id) {
  const { rows } = await pool.query(
    `SELECT id, email, phone, full_name, role, created_at FROM users WHERE id = $1`, [id]
  );
  return rows[0] || null;
}
export async function verifyCredentials(email, password) {
  const user = await findUserByEmail(email);
  if (!user) return null;
  return (await verifyPassword(password, user.password_hash)) ? user : null;
}
