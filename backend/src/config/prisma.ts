import { PrismaClient } from '@prisma/client';
import { env } from './env.js';

// 全局唯一 PrismaClient；数据模型接入后各 service 从这里引用（docs/02 §5）。
export const prisma = new PrismaClient({
  log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});
