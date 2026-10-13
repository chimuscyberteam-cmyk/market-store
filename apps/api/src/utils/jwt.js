import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
export const signAccess  = (p) => jwt.sign(p, env.JWT_ACCESS_SECRET,  { expiresIn: env.JWT_ACCESS_TTL });
export const signRefresh = (p) => jwt.sign(p, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_TTL });
export const verifyAccess  = (t) => jwt.verify(t, env.JWT_ACCESS_SECRET);
export const verifyRefresh = (t) => jwt.verify(t, env.JWT_REFRESH_SECRET);
