import { verifyAccess } from '../utils/jwt.js';
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return res.status(401).json({ error: 'Missing bearer token' });
  try { req.user = verifyAccess(token); next(); }
  catch { res.status(401).json({ error: 'Invalid or expired token' }); }
}
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}
