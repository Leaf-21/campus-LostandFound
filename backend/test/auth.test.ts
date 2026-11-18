import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../src/app.js';
import { resetDb, seedCategories, DEMO_PASSWORD } from './helpers.js';

let app: Express;

beforeAll(async () => {
  app = createApp();
  await resetDb();
  await seedCategories();
});

afterAll(async () => {
  await resetDb();
});

describe('POST /auth/register', () => {
  it('注册成功返回 201 与最小用户信息，且不回传密码', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ account: 'newuser01', password: DEMO_PASSWORD, nickname: '新同学', email: 'new@example.com' });
    expect(res.status).toBe(201);
    expect(res.body.code).toBe(0);
    expect(res.body.data).toMatchObject({ account: 'newuser01', nickname: '新同学', role: 'USER' });
    expect(JSON.stringify(res.body)).not.toContain('password');
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
  });

  it('重复账号返回 409 / 40904', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ account: 'newuser01', password: DEMO_PASSWORD, nickname: '又一位' });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe(40904);
  });

  it('参数不合法返回 400 / 40001 且带 fieldErrors', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ account: 'ab', password: '123', nickname: '' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe(40001);
    const fields = (res.body.data.fieldErrors as { field: string }[]).map((f) => f.field);
    expect(fields).toEqual(expect.arrayContaining(['account', 'password', 'nickname']));
  });
});

describe('POST /auth/login', () => {
  it('登录成功返回 token 与用户信息', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ account: 'newuser01', password: DEMO_PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTypeOf('string');
    expect(res.body.data.tokenType).toBe('Bearer');
    expect(res.body.data.expiresIn).toBeGreaterThan(0);
    expect(res.body.data.user.account).toBe('newuser01');
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
  });

  it('密码错误与账号不存在返回同样的 401 / 40101（不泄露账号是否存在）', async () => {
    const wrongPw = await request(app)
      .post('/api/v1/auth/login')
      .send({ account: 'newuser01', password: 'WrongPass1' });
    const noUser = await request(app)
      .post('/api/v1/auth/login')
      .send({ account: 'ghost_user', password: DEMO_PASSWORD });
    expect(wrongPw.status).toBe(401);
    expect(noUser.status).toBe(401);
    expect(wrongPw.body.code).toBe(40101);
    expect(noUser.body.code).toBe(40101);
    expect(wrongPw.body.message).toBe(noUser.body.message);
  });
});

describe('GET /auth/me', () => {
  it('携带有效 token 返回本人完整信息', async () => {
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ account: 'newuser01', password: DEMO_PASSWORD });
    const token = login.body.data.accessToken;

    const res = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.account).toBe('newuser01');
    expect(res.body.data).toHaveProperty('phone');
    expect(res.body.data).toHaveProperty('email');
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
  });

  it('无 token 返回 401 / 40101', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe(40101);
  });

  it('坏 token 返回 401 / 40101', async () => {
    const res = await request(app).get('/api/v1/auth/me').set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe(40101);
  });

  it('非 Bearer 方案视为未登录', async () => {
    const res = await request(app).get('/api/v1/auth/me').set('Authorization', 'Basic abc');
    expect(res.status).toBe(401);
  });
});
