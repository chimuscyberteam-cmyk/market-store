import { rateLimit } from 'express-rate-limit';

// 1. Strict limiter for auth routes
export const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes window to try 5 times
  max: 5, // Limit each IP to 5 attempts per windowMs
  blockDuration: 30 * 60 * 1000, // If they hit the limit, lock them out for 30 minutes
  message: { error: 'Too many failed attempts. You are locked out for 30 minutes for security reasons.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 2. General limiter for normal app usage
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: { error: 'Too many requests from this network. Please wait a few minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
