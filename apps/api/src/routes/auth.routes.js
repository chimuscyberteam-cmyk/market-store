import { Router } from 'express';
import { z } from 'zod';
import crypto from 'node:crypto';
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



router.post('/register', async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    
    // Explicitly check for duplicate email
    if (await findUserByEmail(data.email)) {
      return res.status(409).json({ error: 'This email is already registered.' });
    }

    // Explicitly check for duplicate phone
    const phoneCheck = await pool.query('SELECT id FROM users WHERE phone = $1', [data.phone]);
    if (phoneCheck.rows.length > 0) {
      return res.status(409).json({ error: 'This phone number is already in use.' });
    }

    const user = await createUser(data);
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = sha256(code);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    
    await pool.query('INSERT INTO email_verifications (user_id, code_hash, expires_at) VALUES ($1, $2, $3)', [user.id, codeHash, expiresAt]);
    await sendVerificationCodeEmail({ to: user.email, name: user.full_name, code });

    res.status(201).json({ user, message: 'Verification code sent to email.' });
  } catch (err) { next(err); }
});

// 2. Add the Resend Verification Route
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
    }

    // 2. Check for existing Phone
    const phoneCheck = await pool.query('SELECT id FROM users WHERE phone = $1', [data.phone]);
    if (phoneCheck.rows.length > 0) {
      return res.status(409).json({ error: 'This phone number is already in use.' });
    }

    // 3. Create the user
    const user = await createUser(data);
    
    // Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    
    await pool.query('INSERT INTO email_verifications (user_id, code_hash, expires_at) VALUES ($1, $2, $3)', [user.id, codeHash, expiresAt]);
    await sendVerificationCodeEmail({ to: user.email, name: user.full_name, code });

    res.status(201).json({ user, message: 'Verification code sent to email.' });
  } catch (err) { next(err); }
});
    }
    const user = await createUser(data);
    
    // Generate code
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = sha256(code);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    
    await pool.query('INSERT INTO email_verifications (user_id, code_hash, expires_at) VALUES ($1, $2, $3)', [user.id, codeHash, expiresAt]);
    await sendVerificationCodeEmail({ to: user.email, name: user.full_name, code });

    // NO TOKENS ISSUED HERE. User must verify first.
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
    
    // NOW issue tokens
    const tokens = await issueTokens(user);
    res.json({ user, ...tokens });
  } catch (err) { next(err); }
});

// Keep standard Login route
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = z.object({ email: z.string().email(), password: z.string().min(1) }).parse(req.body);
    const user = await verifyCredentials(email, password);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    
    // Check if verified
    if (!user.is_email_verified) {
      return res.status(403).json({ error: 'Please verify your email before logging in.' });
    }

    const safe = { id: user.id, email: user.email, phone: user.phone, full_name: user.full_name, role: user.role };
    res.json({ user: safe, ...(await issueTokens(user)) });
  } catch (err) { next(err); }
});

router.post('/refresh', async (req, res, next) => { /* keep existing */ });
router.post('/logout', async (req, res, next) => { /* keep existing */ });
router.get('/me', requireAuth, async (req, res, next) => { /* keep existing */ });
router.post('/forgot-password', async (req, res, next) => { /* keep existing */ });

export default router;
