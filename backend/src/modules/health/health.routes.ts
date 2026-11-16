import { Router } from 'express';
import { env } from '../../config/env.js';
import { sendSuccess } from '../../common/response/api-response.js';

const startedAt = Date.now();

// 健康检查（docs/10 §2）：GET /health，不依赖数据库，服务进程存活即返回成功。
export const healthRouter = Router();

healthRouter.get('/health', (_req, res) => {
  sendSuccess(res, {
    status: 'UP',
    service: 'campus-lost-found-backend',
    environment: env.NODE_ENV,
    uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
    timestamp: new Date().toISOString(),
  });
});
