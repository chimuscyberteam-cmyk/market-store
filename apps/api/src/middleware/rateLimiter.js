import { rateLimit } from 'express-rate-limit';

// Custom key generator: Track by email if provided, otherwise by IP
const authKeyGenerator = (req) => {
  if (req.body && req.body.email) {
    return req.body.email.toLowerCase(); // Track the specific account being attacked
  }
  return req.ip; // Fallback to IP if no email is provided
};

// 1. Strict limiter for auth routes (Login, Register, Password Reset)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts
  blockDuration: 15 * 60 * 1000, // 15 minute lockout
  keyGenerator: authKeyGenerator, // <--- This is the fix
  message: { error: 'Too many failed attempts for this account. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 2. General limiter for normal app usage (Still tracks by IP to stop scrapers)
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 1000, 
  message: { error: 'Too many requests from this network. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});
