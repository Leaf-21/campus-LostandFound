import { BusinessCode, type BusinessCodeValue } from './business-code.js';

// 可预期的业务异常：由 service/controller 抛出，全局错误中间件统一转成响应。
export class AppError extends Error {
  readonly status: number;
  readonly code: BusinessCodeValue;
  readonly data: unknown;

  constructor(status: number, code: BusinessCodeValue, message: string, data: unknown = null) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

export function badRequest(message = '请求参数不正确', data: unknown = null): AppError {
  return new AppError(400, BusinessCode.VALIDATION_FAILED, message, data);
}

export function unauthorized(message = '未登录或登录状态失效'): AppError {
  return new AppError(401, BusinessCode.UNAUTHORIZED, message);
}

export function forbidden(message = '无权操作该资源'): AppError {
  return new AppError(403, BusinessCode.FORBIDDEN, message);
}

export function notFound(message = '请求的资源不存在'): AppError {
  return new AppError(404, BusinessCode.NOT_FOUND, message);
}

export function conflict(code: BusinessCodeValue, message: string): AppError {
  return new AppError(409, code, message);
}
