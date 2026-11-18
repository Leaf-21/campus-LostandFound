import { createApp } from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/prisma.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`[backend] API 已启动: http://localhost:${env.PORT}${env.API_PREFIX}`);
  console.log(`[backend] 健康检查: http://localhost:${env.PORT}/health`);
  console.log(`[backend] 环境: ${env.NODE_ENV}，允许的前端来源: ${env.CORS_ORIGIN}`);
});

async function shutdown(signal: string): Promise<void> {
  console.log(`[backend] 收到 ${signal}，开始优雅退出`);
  server.close(() => {
    void prisma.$disconnect().finally(() => process.exit(0));
  });
  // 兜底：10 秒内未完成则强制退出。
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
