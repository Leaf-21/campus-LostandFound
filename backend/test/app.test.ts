import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

describe('GET /health', () => {
  it('返回统一成功结构和 UP 状态', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(0);
    expect(res.body.message).toBe('success');
    expect(res.body.data.status).toBe('UP');
    expect(typeof res.body.data.uptimeSeconds).toBe('number');
    expect(res.body.requestId).toMatch(/^req-/);
    expect(res.headers['x-request-id']).toBe(res.body.requestId);
  });
});

describe('CORS', () => {
  it('允许配置的前端来源', async () => {
    const res = await request(app).get('/health').set('Origin', 'http://localhost:5173');
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  it('不向未配置来源返回放行头', async () => {
    const res = await request(app).get('/health').set('Origin', 'http://evil.example.com');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('预检请求放行 Authorization 头', async () => {
    const res = await request(app)
      .options('/api/v1/auth/login')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'authorization,content-type');
    expect(res.status).toBeLessThan(300);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(res.headers['access-control-allow-headers']).toMatch(/Authorization/i);
  });
});

describe('统一错误处理', () => {
  it('未知路径返回 404 / 40401', async () => {
    const res = await request(app).get('/api/v1/definitely-not-exists');
    expect(res.status).toBe(404);
    expect(res.body.code).toBe(40401);
    expect(res.body.data).toBeNull();
    expect(res.body.requestId).toMatch(/^req-/);
  });

  it('非法 JSON 请求体返回 400 / 40001', async () => {
    const res = await request(app)
      .post('/api/v1/echo-not-exists')
      .set('Content-Type', 'application/json')
      .send('{"broken":');
    expect(res.status).toBe(400);
    expect(res.body.code).toBe(40001);
  });
});
