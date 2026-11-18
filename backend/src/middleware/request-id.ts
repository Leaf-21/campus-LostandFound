import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';

// 为每个请求生成追踪 ID，写入 res.locals 与响应头，统一响应体回传。
export const requestId: RequestHandler = (req, res, next) => {
  const id = `req-${randomUUID()}`;
  res.locals.requestId = id;
  res.setHeader('X-Request-Id', id);
  next();
};
