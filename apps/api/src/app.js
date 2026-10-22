import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { authLimiter, generalLimiter } from './middleware/rateLimiter.js';

import authRoutes from './routes/auth.routes.js';
import categoryRoutes from './routes/categories.routes.js';
import itemRoutes from './routes/items.routes.js';
import orderRoutes from './routes/orders.routes.js';
import chatRoutes from './routes/chat.routes.js';
import adminRoutes from './routes/admin.routes.js';
import userRoutes from './routes/users.routes.js';
import { notFound, errorHandler } from './middleware/error.js';

export function createApp() {
  const app = express();
  app.set('trust proxy', 1); // Trust Cloudflare/Render proxy for real IP address
  
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => res.json({ ok: true }));

  // 1. Apply STRICT limiter ONLY to auth routes (login, register)
  app.use('/api/auth', authLimiter, authRoutes);

  // 2. Apply GENERAL limiter to all other normal routes
  app.use('/api/categories', generalLimiter, categoryRoutes);
  app.use('/api/items', generalLimiter, itemRoutes);
  app.use('/api/orders', generalLimiter, orderRoutes);
  app.use('/api/chat', generalLimiter, chatRoutes);
  app.use('/api/admin', generalLimiter, adminRoutes);
  app.use('/api/users', generalLimiter, userRoutes);

  app.use(notFound);
  app.use(errorHandler);
  
  return app;
}
