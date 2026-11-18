import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { unauthorized } from '../common/exception/app-error.js';

export interface JwtPayloadShape {
  sub: string;
  role: string;
}

/** 把 "2h" / "7200" 之类的配置解析成秒，用于返回给前端的 expiresIn */
export function expiresInSeconds(): number {
  const raw = env.JWT_EXPIRES_IN.trim();
  const match = /^(\d+)\s*([smhd])?$/i.exec(raw);
  if (!match) return 7200;
  const value = Number(match[1]);
  const unit = (match[2] ?? 's').toLowerCase();
  const factor = unit === 'm' ? 60 : unit === 'h' ? 3600 : unit === 'd' ? 86400 : 1;
  return value * factor;
}

export function signAccessToken(payload: JwtPayloadShape): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: expiresInSeconds() });
}

export function verifyAccessToken(token: string): JwtPayloadShape {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (typeof decoded === 'string' || !decoded.sub) {
      throw new Error('invalid payload');
    }
    return { sub: String(decoded.sub), role: String((decoded as { role?: string }).role ?? 'USER') };
  } catch {
    throw unauthorized('登录状态已失效，请重新登录');
  }
}
