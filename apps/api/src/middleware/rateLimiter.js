import { rateLimit } from 'express-rate-limit';

// Custom key generator: Track by email if provided, otherwise by IP
const authKeyGenerator = (req) => {
  if (req.body && req.body.email) {
    return req.body.email.toLowerCase(); 
  }
  return req.ip; 
};

// 1. Strict limiter for auth routes (Login, Register, Password Reset)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window to try 10 times
  max: 10, // 10 attempts allowed
  blockDuration: 30 * 60 * 1000, // If they fail, lock them out for 30 minutes
  keyGenerator: authKeyGenerator, // Track by Email (so it doesn't lock the whole campus)
  message: { error: 'Too many failed attempts. You are locked out for 30 minutes for security reasons.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 2. General limiter for normal app usage
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 1000, 
  message: { error: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});
