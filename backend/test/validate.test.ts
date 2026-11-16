import { describe, expect, it } from 'vitest';
import express from 'express';
import request from 'supertest';
import { z } from 'zod';
import { requestId } from '../src/middleware/request-id.js';
import { validate } from '../src/middleware/validate.js';
import { errorHandler } from '../src/middleware/error-handler.js';
import { paginationQuerySchema } from '../src/common/pagination/pagination.js';
import { sendSuccess } from '../src/common/response/api-response.js';

function buildTestApp() {
  const app = express();
  app.use(requestId);
  app.use(express.json());
  app.get(
    '/paged',
    validate('query', paginationQuerySchema),
    (req, res) => sendSuccess(res, req.query),
  );
  app.post(
    '/echo',
    validate('body', z.object({ title: z.string().min(2, '标题至少 2 个字') })),
    (req, res) => sendSuccess(res, req.body),
  );
  app.use(errorHandler);
  return app;
}

describe('validate 中间件与分页默认值', () => {
  const app = buildTestApp();

  it('分页参数缺省时填充 page=1、pageSize=12', async () => {
    const res = await request(app).get('/paged');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ page: 1, pageSize: 12 });
  });

  it('分页参数解析字符串数字并限制 pageSize<=50', async () => {
    const ok = await request(app).get('/paged?page=2&pageSize=50');
    expect(ok.body.data).toEqual({ page: 2, pageSize: 50 });
    const bad = await request(app).get('/paged?pageSize=51');
    expect(bad.status).toBe(400);
    expect(bad.body.code).toBe(40001);
  });

  it('body 校验失败返回 fieldErrors 结构', async () => {
    const res = await request(app).post('/echo').send({ title: '短' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe(40001);
    expect(res.body.data.fieldErrors).toEqual([{ field: 'title', reason: '标题至少 2 个字' }]);
  });
});
