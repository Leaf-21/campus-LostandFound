import type { Request, RequestHandler, Response } from 'express';

type AsyncHandler = (req: Request, res: Response) => Promise<unknown>;

// Express 5 原生转发 async 异常；此包装保留显式 next(err)，便于统一风格。
export function asyncHandler(handler: AsyncHandler): RequestHandler {
  return (req, res, next) => {
    handler(req, res).catch(next);
  };
}
