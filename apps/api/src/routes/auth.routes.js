import { Router } from 'express';
import { z } from 'zod';
import { createUser, findUserByEmail, findUserById, verifyCredentials } from '../services/auth.service.js';
import { storeRefreshToken, isRefreshTokenValid, revokeRefreshToken } from '../services/token.service.js';
import { signAccess, signRefresh, verifyRefresh } from '../utils/jwt.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

async function issueTokens(user) {
  const payload = { sub: user.id, role: user.role };
  const accessToken = signAccess(payload);
  const refreshToken = signRefresh(payload);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
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
    if (await findUserByEmail(data.email)) return res.status(409).json({ error: 'Email already registered' });
    const user = await createUser(data);
    const tokens = await issueTokens(user);
    res.status(201).json({ user, ...tokens });
  } catch (err) { next(err); }
});

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

export default router;
