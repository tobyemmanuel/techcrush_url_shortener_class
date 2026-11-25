import express from 'express';
import { registerMiddleware } from './config/middleware.js';
import { errorHandler, notFound } from './middlewares/errorMiddleware.js';
import { apiLimiter } from './middlewares/rateLimiter.js';
import apiRoutes from './routes/index.js';
import redirectRoutes from './routes/redirectRoutes.js';
import { sendSuccess } from './utils/response.js';

const app = express();

registerMiddleware(app);

app.get('/health', (req, res) =>
  sendSuccess(res, { message: 'OK', data: { uptimeSeconds: Math.round(process.uptime()) } }),
);

app.use('/api/v1', apiLimiter, apiRoutes);

// Must come after /api and /health, because it matches any single path segment.
app.use(redirectRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
