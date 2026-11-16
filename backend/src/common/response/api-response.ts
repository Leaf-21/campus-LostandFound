import type { Response } from 'express';

// 统一响应结构（docs/05 §2.4–2.5）：{ code, message, data, requestId }
export interface ApiResponseBody<T> {
  code: number;
  message: string;
  data: T | null;
  requestId: string;
}

export function sendSuccess<T>(
  res: Response,
  data: T | null,
  options: { status?: number; message?: string } = {},
): void {
  const body: ApiResponseBody<T> = {
    code: 0,
    message: options.message ?? 'success',
    data,
    requestId: res.locals.requestId as string,
  };
  res.status(options.status ?? 200).json(body);
}

export function sendError(
  res: Response,
  status: number,
  code: number,
  message: string,
  data: unknown = null,
): void {
  const body: ApiResponseBody<unknown> = {
    code,
    message,
    data,
    requestId: res.locals.requestId as string,
  };
  res.status(status).json(body);
}
