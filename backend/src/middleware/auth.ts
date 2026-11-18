import type { RequestHandler } from 'express';
import { prisma } from '../config/prisma.js';
import { forbidden, unauthorized } from '../common/exception/app-error.js';
import { verifyAccessToken } from '../utils/jwt.js';
import type { AuthUser } from '../types/express.js';

function extractToken(header: string | undefined): string | null {
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (!scheme || !token || scheme.toLowerCase() !== 'bearer') return null;
  return token.trim();
}

async function loadUser(token: string): Promise<AuthUser | null> {
  const payload = verifyAccessToken(token);
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, account: true, role: true },
  });
  return user ?? null;
}

/** 强制登录：缺失/失效 token → 401/40101 */
export const requireAuth: RequestHandler = (req, _res, next) => {
  const token = extractToken(req.headers.authorization);
  if (!token) {
    next(unauthorized());
    return;
  }
  loadUser(token)
    .then((user) => {
      if (!user) {
        next(unauthorized());
        return;
      }
      req.user = user;
      next();
    })
    .catch(next);
};

/** 可选登录：无 token 或 token 失效都不阻断，仅不设置 req.user */
export const optionalAuth: RequestHandler = (req, _res, next) => {
  const token = extractToken(req.headers.authorization);
  if (!token) {
    next();
    return;
  }
  loadUser(token)
    .then((user) => {
      if (user) req.user = user;
      next();
    })
    .catch(() => {
      // 公开接口遇到坏 token 视为游客，不报 401
      next();
    });
};

/** 管理员：必须在 requireAuth 之后使用 */
export const requireAdmin: RequestHandler = (req, _res, next) => {
  if (!req.user) {
    next(unauthorized());
    return;
  }
  if (req.user.role !== 'ADMIN') {
    next(forbidden('需要管理员权限'));
    return;
  }
  next();
};
