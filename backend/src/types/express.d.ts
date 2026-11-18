import type { Role } from '@prisma/client';

// 认证中间件注入的当前用户（仅放必要字段，避免把密码哈希带进 req）
export interface AuthUser {
  id: string;
  account: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
