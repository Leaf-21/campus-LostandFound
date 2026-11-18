import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import type { ZodError } from 'zod';
import { badRequest } from '../common/exception/app-error.js';

type RequestPart = 'body' | 'query' | 'params';

// Zod 校验中间件：校验通过后用解析结果覆盖对应请求部分（含默认值）。
// 校验失败抛出 400 / 40001，fieldErrors 结构与 docs/05 §2.5 一致。
export function validate(part: RequestPart, schema: ZodType): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      next(mapZodError(result.error));
      return;
    }
    if (part === 'query') {
      // Express 5 的 req.query 是 getter，不能直接赋值；覆盖为解析后的普通对象。
      Object.defineProperty(req, 'query', {
        value: result.data,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    } else {
      req[part] = result.data as typeof req.body;
    }
    next();
  };
}

function mapZodError(error: ZodError): ReturnType<typeof badRequest> {
  const fieldErrors = error.issues.map((issue) => ({
    field: issue.path.join('.') || '(root)',
    reason: issue.message,
  }));
  return badRequest('请求参数不正确', { fieldErrors });
}
