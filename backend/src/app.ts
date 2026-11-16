import express, { type Express } from 'express';
import cors from 'cors';
import { corsOrigins, uploadDirAbs } from './config/env.js';
import { requestId } from './middleware/request-id.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { healthRouter } from './modules/health/health.routes.js';
import { apiRouter } from './modules/api.router.js';
import { env } from './config/env.js';

export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(requestId);

  // CORS 仅允许配置的前端来源（docs/10 §7）。
  app.use(
    cors({
      origin: corsOrigins,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      exposedHeaders: ['X-Request-Id'],
    }),
  );

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));

  // 上传图片静态访问（docs/10 §5）。
  app.use('/uploads', express.static(uploadDirAbs));

  app.use(healthRouter);
  app.use(env.API_PREFIX, apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
