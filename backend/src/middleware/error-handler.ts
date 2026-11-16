import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { AppError } from '../common/exception/app-error.js';
import { BusinessCode } from '../common/exception/business-code.js';
import { sendError } from '../common/response/api-response.js';

// 未匹配路由：统一 404 / 40401。
export const notFoundHandler: RequestHandler = (req, res) => {
  sendError(res, 404, BusinessCode.NOT_FOUND, `接口不存在：${req.method} ${req.path}`);
};

interface BodyParserError extends Error {
  status?: number;
  statusCode?: number;
  type?: string;
}

// 全局错误处理：所有错误在这里映射为统一失败响应（docs/02 §5）。
export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof AppError) {
    sendError(res, err.status, err.code, err.message, err.data);
    return;
  }

  if (err instanceof ZodError) {
    const fieldErrors = err.issues.map((issue) => ({
      field: issue.path.join('.') || '(root)',
      reason: issue.message,
    }));
    sendError(res, 400, BusinessCode.VALIDATION_FAILED, '请求参数不正确', { fieldErrors });
    return;
  }

  const parserError = err as BodyParserError;
  const parserStatus = parserError.status ?? parserError.statusCode;
  if (parserError.type === 'entity.parse.failed' || parserStatus === 400) {
    sendError(res, 400, BusinessCode.VALIDATION_FAILED, '请求体不是合法的 JSON');
    return;
  }
  if (parserError.type === 'entity.too.large' || parserStatus === 413) {
    sendError(res, 413, BusinessCode.FILE_INVALID, '请求体过大');
    return;
  }

  // 未知异常：记录日志（不含 Token/密码），对外只返回统一 500。
  console.error(`[${res.locals.requestId as string}] 未处理异常:`, err);
  const message = env.NODE_ENV === 'production' ? '系统内部错误' : '系统内部错误（开发环境详情见服务端日志）';
  sendError(res, 500, BusinessCode.INTERNAL_ERROR, message);
};
