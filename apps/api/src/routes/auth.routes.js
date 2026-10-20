import { Router } from 'express';
import { z } from 'zod';
import crypto from 'node:crypto';
import { createUser, findUserByEmail, findUserById, verifyCredentials } from '../services/auth.service.js';
import { storeRefreshToken, isRefreshTokenValid, revokeRefreshToken } from '../services/token.service.js';
import { signAccess, signRefresh, verifyRefresh } from '../utils/jwt.js';
import { requireAuth } from '../middleware/auth.js';
import { hashPassword } from '../utils/password.js';
import { sendPasswordResetCodeEmail } from '../utils/email.js';
import { pool } from '../db/pool.js';

const router = Router();
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

async function issueTokens(user) {
  const payload = { sub: user.id, role: user.role };
  const accessToken = signAccess(payload);
  const refreshToken = signRefresh(payload);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await storeRefreshToken(user.id, refreshToken, expiresAt);
  return { accessToken, refreshToken };
}

// Register
const registerSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(9),
  password: z.string().min(8),
  fullName: z.string().min(2),
  role: z.enum(['buyer', 'seller']).optional()
});


router.post('/register', async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    if (await findUserByEmail(data.email)) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const user = await createUser(data);
    
    // Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = sha256(code);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    
    // Save to DB
    await pool.query('INSERT INTO email_verifications (user_id, code_hash, expires_at) VALUES ($1, $2, $3)', [user.id, codeHash, expiresAt]);
    
    // Send email
    await sendVerificationCodeEmail({ to: user.email, name: user.full_name, code });

    // CRITICAL: Do NOT send tokens here. Force them to verify.
    res.status(201).json({ user, message: 'Verification code sent to email.' });
  } catch (err) { next(err); }
});

// Add the Verify Email Route
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
    if (!session) return res.status(400).json({ error: 'No verification code found' });
    if (new Date(session.expires_at) < new Date()) return res.status(400).json({ error: 'Code expired' });
    if (session.code_hash !== sha256(code)) return res.status(400).json({ error: 'Invalid code' });

    // Mark verified
    await pool.query('UPDATE users SET is_email_verified = true WHERE id = $1', [user.id]);
    await pool.query('DELETE FROM email_verifications WHERE user_id = $1', [user.id]);
    
    // NOW issue tokens
    const tokens = await issueTokens(user);
    res.json({ user, ...tokens });
  } catch (err) { next(err); }
});
    }
    const user = await createUser(data);
    const tokens = await issueTokens(user);
    res.status(201).json({ user, ...tokens });
  } catch (err) { next(err); }
});

// Login
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await verifyCredentials(email, password);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const safe = { id: user.id, email: user.email, phone: user.phone, full_name: user.full_name, role: user.role };
    res.json({ user: safe, ...(await issueTokens(user)) });
  } catch (err) { next(err); }
});

// Refresh
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

// Logout
router.post('/logout', async (req, res, next) => {
  try {
    const { refreshToken } = req.body || {};
    if (refreshToken) await revokeRefreshToken(refreshToken);
    res.status(204).end();
  } catch (err) { next(err); }
});

// Me
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await findUserById(req.user.sub);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) { next(err); }
});

// ========== FORGOT PASSWORD ==========

// Step 1 — Request code
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);
    const user = await findUserByEmail(email);

    if (user) {
      await pool.query(
        `UPDATE password_reset_sessions SET used_at = now()
         WHERE user_id = $1 AND used_at IS NULL`,
        [user.id]
      );

      const code = String(Math.floor(100000 + Math.random() * 900000));
      const codeHash = sha256(code);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await pool.query(
        `INSERT INTO password_reset_sessions (user_id, code_hash, code_expires_at)
         VALUES ($1, $2, $3)`,
        [user.id, codeHash, expiresAt]
      );

      await sendPasswordResetCodeEmail({
        to: user.email,
        name: user.full_name,
        code
      });
    }

    res.json({ ok: true, message: 'If that email is registered, a code has been sent.' });
  } catch (err) { next(err); }
});

// Step 2 — Verify code
router.post('/verify-code', async (req, res, next) => {
  try {
    const { email, code } = z.object({
      email: z.string().email(),
      code: z.string().length(6)
    }).parse(req.body);

    const user = await findUserByEmail(email);
    if (!user) return res.status(400).json({ error: 'Invalid or expired code' });

    const { rows } = await pool.query(
      `SELECT id, code_hash, code_expires_at, attempts
       FROM password_reset_sessions
       WHERE user_id = $1 AND used_at IS NULL
       ORDER BY created_at DESC LIMIT 1`,
      [user.id]
    );
    const session = rows[0];
    if (!session) return res.status(400).json({ error: 'Invalid or expired code' });
    if (new Date(session.code_expires_at) < new Date()) {
      return res.status(400).json({ error: 'Code expired. Request a new one.' });
    }
    if (session.attempts >= 5) {
      return res.status(429).json({ error: 'Too many attempts. Request a new code.' });
    }

    await pool.query(
      `UPDATE password_reset_sessions SET attempts = attempts + 1 WHERE id = $1`,
      [session.id]
    );

    if (session.code_hash !== sha256(code)) {
      const remaining = 4 - session.attempts;
      return res.status(400).json({
        error: remaining > 0
          ? `Invalid code. ${remaining} attempt${remaining === 1 ? '' : 's'} left.`
          : 'Too many attempts. Request a new code.'
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = sha256(resetToken);
    const tokenExpires = new Date(Date.now() + 5 * 60 * 1000);

    await pool.query(
      `UPDATE password_reset_sessions
       SET verified_at = now(), reset_token_hash = $1, reset_token_expires_at = $2
       WHERE id = $3`,
      [resetTokenHash, tokenExpires, session.id]
    );

    res.json({ ok: true, resetToken });
  } catch (err) { next(err); }
});

// Step 3 — Reset password
router.post('/reset-password', async (req, res, next) => {
  try {
    const { resetToken, newPassword } = z.object({
      resetToken: z.string().min(20),
      newPassword: z.string().min(8)
    }).parse(req.body);

    const tokenHash = sha256(resetToken);
    const { rows } = await pool.query(
      `SELECT id, user_id, reset_token_expires_at, used_at
       FROM password_reset_sessions
       WHERE reset_token_hash = $1`,
      [tokenHash]
    );
    const session = rows[0];
    if (!session) return res.status(400).json({ error: 'Invalid or expired reset token' });
    if (session.used_at) return res.status(400).json({ error: 'Reset token already used' });
    if (new Date(session.reset_token_expires_at) < new Date()) {
      return res.status(400).json({ error: 'Reset session expired' });
    }

    const passwordHash = await hashPassword(newPassword);

    await pool.query('BEGIN');
    try {
      await pool.query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [passwordHash, session.user_id]);
      await pool.query(`UPDATE password_reset_sessions SET used_at = now() WHERE id = $1`, [session.id]);
      await pool.query(`DELETE FROM refresh_tokens WHERE user_id = $1`, [session.user_id]);
      await pool.query('COMMIT');
    } catch (e) {
      await pool.query('ROLLBACK');
      throw e;
    }

    res.json({ ok: true, message: 'Password updated. Please sign in.' });
  } catch (err) { next(err); }
});

export default router;
