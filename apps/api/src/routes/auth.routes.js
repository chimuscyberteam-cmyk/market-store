import { Router } from 'express';
import { z } from 'zod';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { createUser, findUserByEmail, findUserById, verifyCredentials } from '../services/auth.service.js';
import { storeRefreshToken, isRefreshTokenValid, revokeRefreshToken } from '../services/token.service.js';
import { signAccess, signRefresh, verifyRefresh } from '../utils/jwt.js';
import { requireAuth } from '../middleware/auth.js';
import { sendPasswordResetCodeEmail, sendVerificationCodeEmail } from '../utils/email.js';
import { pool } from '../db/pool.js';

const router = Router();
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

async function issueTokens(user) {
  const payload = { sub: user.id, role: user.role };
  const accessToken = signAccess(payload);
  const refreshToken = signRefresh(payload);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await storeRefreshToken(user.id, refreshToken, expiresAt);
  return { accessToken, refreshToken };
}

const registerSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(9),
  password: z.string().min(8),
  fullName: z.string().min(2),
  role: z.enum(['buyer', 'seller']).optional()
});

// ========== REGISTRATION & VERIFICATION ==========

router.post('/register', async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    
    if (await findUserByEmail(data.email)) {
      return res.status(409).json({ error: 'This email is already registered. Please log in.' });
    }

    const phoneCheck = await pool.query('SELECT id FROM users WHERE phone = $1', [data.phone]);
    if (phoneCheck.rows.length > 0) {
      return res.status(409).json({ error: 'This phone number is already in use.' });
    }

    const user = await createUser(data);
    
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = sha256(code);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    
    await pool.query('DELETE FROM email_verifications WHERE user_id = $1', [user.id]);
    await pool.query('INSERT INTO email_verifications (user_id, code_hash, expires_at) VALUES ($1, $2, $3)', [user.id, codeHash, expiresAt]);
    await sendVerificationCodeEmail({ to: user.email, name: user.full_name, code });

    res.status(201).json({ user, message: 'Verification code sent to email.' });
  } catch (err) { next(err); }
});

router.post('/verify-email', async (req, res, next) => {
  try {
    const { email, code } = z.object({ email: z.string().email(), code: z.string().length(6) }).parse(req.body);
    const user = await findUserByEmail(email);
    if (!user) return res.status(400).json({ error: 'User not found' });

    const { rows } = await pool.query(
      'SELECT id, code_hash, expires_at FROM email_verifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [user.id]
    );
    const session = rows[0];
    if (!session) return res.status(400).json({ error: 'No code found' });
    if (new Date(session.expires_at) < new Date()) return res.status(400).json({ error: 'Code expired' });
    if (session.code_hash !== sha256(code)) return res.status(400).json({ error: 'Invalid code' });

    await pool.query('UPDATE users SET is_email_verified = true WHERE id = $1', [user.id]);
    await pool.query('DELETE FROM email_verifications WHERE user_id = $1', [user.id]);
    
    const tokens = await issueTokens(user);
    res.json({ user, ...tokens });
  } catch (err) { next(err); }
});

router.post('/resend-verification', async (req, res, next) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);
    const user = await findUserByEmail(email);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.is_email_verified) return res.status(400).json({ error: 'Email is already verified. Please log in.' });

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = sha256(code);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    
    await pool.query('DELETE FROM email_verifications WHERE user_id = $1', [user.id]);
    await pool.query('INSERT INTO email_verifications (user_id, code_hash, expires_at) VALUES ($1, $2, $3)', [user.id, codeHash, expiresAt]);
    await sendVerificationCodeEmail({ to: user.email, name: user.full_name, code });

    res.json({ message: 'New verification code sent.' });
  } catch (err) { next(err); }
});

// ========== LOGIN & SESSION ==========

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = z.object({ email: z.string().email(), password: z.string().min(1) }).parse(req.body);
    const user = await verifyCredentials(email, password);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    
    if (!user.is_email_verified) {
      return res.status(403).json({ error: 'Please verify your email before logging in.' });
    }

    const safe = { id: user.id, email: user.email, phone: user.phone, full_name: user.full_name, role: user.role };
    res.json({ user: safe, ...(await issueTokens(user)) });
  } catch (err) { next(err); }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken) return res.status(400).json({ error: 'refreshToken required' });
    let payload;
    try { payload = verifyRefresh(refreshToken); }
    catch { return res.status(401).json({ error: 'Invalid refresh token' }); }
    if (!(await isRefreshTokenValid(refreshToken))) return res.status(401).json({ error: 'Refresh token revoked' });
    await revokeRefreshToken(refreshToken);
    const user = await findUserById(payload.sub);
    if (!user) return res.status(401).json({ error: 'User not found' });
    res.json({ user, ...(await issueTokens(user)) });
  } catch (err) { next(err); }
});

router.post('/logout', async (req, res, next) => {
  try {
    const { refreshToken } = req.body || {};
    if (refreshToken) await revokeRefreshToken(refreshToken);
    res.status(204).end();
  } catch (err) { next(err); }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await findUserById(req.user.sub);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) { next(err); }
});

// ========== PASSWORD MANAGEMENT ==========

router.post('/change-password', requireAuth, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(8)
    }).parse(req.body);

    const { rows } = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.sub]);
    const user = rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) return res.status(401).json({ error: 'Incorrect current password' });

    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, req.user.sub]);
    await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [req.user.sub]);

    res.json({ message: 'Password updated successfully. Please log in again.' });
  } catch (err) { next(err); }
});

router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);
    const user = await findUserByEmail(email);
    if (user) {
      await pool.query('UPDATE password_reset_sessions SET used_at = now() WHERE user_id = $1 AND used_at IS NULL', [user.id]);
      const code = String(Math.floor(100000 + Math.random() * 900000));
      const codeHash = sha256(code);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      await pool.query('INSERT INTO password_reset_sessions (user_id, code_hash, code_expires_at) VALUES ($1, $2, $3)', [user.id, codeHash, expiresAt]);
      await sendPasswordResetCodeEmail({ to: user.email, name: user.full_name, code });
    }
    res.json({ ok: true, message: 'If that email is registered, a code has been sent.' });
  } catch (err) { next(err); }
});

router.post('/verify-code', async (req, res, next) => {
  try {
    const { email, code } = z.object({ email: z.string().email(), code: z.string().length(6) }).parse(req.body);
    const user = await findUserByEmail(email);
    if (!user) return res.status(400).json({ error: 'Invalid or expired code' });
    
    const { rows } = await pool.query('SELECT id, code_hash, code_expires_at, attempts FROM password_reset_sessions WHERE user_id = $1 AND used_at IS NULL ORDER BY created_at DESC LIMIT 1', [user.id]);
    const session = rows[0];
    if (!session) return res.status(400).json({ error: 'Invalid or expired code' });
    if (new Date(session.code_expires_at) < new Date()) return res.status(400).json({ error: 'Code expired. Request a new one.' });
    if (session.attempts >= 5) return res.status(429).json({ error: 'Too many attempts. Request a new code.' });
    
    await pool.query('UPDATE password_reset_sessions SET attempts = attempts + 1 WHERE id = $1', [session.id]);
    if (session.code_hash !== sha256(code)) return res.status(400).json({ error: 'Invalid code' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = sha256(resetToken);
    const tokenExpires = new Date(Date.now() + 5 * 60 * 1000);
    
    await pool.query('UPDATE password_reset_sessions SET verified_at = now(), reset_token_hash = $1, reset_token_expires_at = $2 WHERE id = $3', [resetTokenHash, tokenExpires, session.id]);
    res.json({ ok: true, resetToken });
  } catch (err) { next(err); }
});

router.post('/reset-password', async (req, res, next) => {
  try {
    const { resetToken, newPassword } = z.object({ resetToken: z.string().min(20), newPassword: z.string().min(8) }).parse(req.body);
    const tokenHash = sha256(resetToken);
    
    const { rows } = await pool.query('SELECT id, user_id, reset_token_expires_at, used_at FROM password_reset_sessions WHERE reset_token_hash = $1', [tokenHash]);
    const session = rows[0];
    if (!session || session.used_at || new Date(session.reset_token_expires_at) < new Date()) return res.status(400).json({ error: 'Invalid or expired reset token' });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await pool.query('BEGIN');
    try {
      await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, session.user_id]);
      await pool.query('UPDATE password_reset_sessions SET used_at = now() WHERE id = $1', [session.id]);
      await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [session.user_id]);
      await pool.query('COMMIT');
    } catch (e) { await pool.query('ROLLBACK'); throw e; }
    res.json({ ok: true, message: 'Password updated. Please sign in.' });
  } catch (err) { next(err); }
});

// ========== ACCOUNT DELETION (SOFT DELETE) ==========

router.delete('/account', requireAuth, async (req, res, next) => {
  try {
    const { password } = z.object({ password: z.string().min(1) }).parse(req.body);

    const { rows } = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.sub]);
    const user = rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) return res.status(401).json({ error: 'Incorrect password' });

    const randomSuffix = crypto.randomBytes(4).toString('hex');
    const dummyEmail = `deleted_${randomSuffix}@deleted.local`;
    const dummyPhone = `deleted_${randomSuffix}`;
    const dummyPassword = await bcrypt.hash('DELETED_' + randomSuffix, 10);

    await pool.query(
      `UPDATE users 
       SET full_name = 'Deleted User', 
           email = $1, 
           phone = $2, 
           password_hash = $3,
           is_email_verified = false
       WHERE id = $4`,
      [dummyEmail, dummyPhone, dummyPassword, req.user.sub]
    );

    await pool.query(`UPDATE items SET status = 'removed' WHERE seller_id = $1 AND status = 'active'`, [req.user.sub]);
    await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [req.user.sub]);

    res.json({ message: 'Account deleted and anonymized successfully.' });
  } catch (err) { next(err); }
});

export default router;
