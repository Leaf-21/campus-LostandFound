import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { auth, registerAndLogin, resetDb, seedCategories, type TestUser } from './helpers.js';

let app: Express;
let user: TestUser;

beforeAll(async () => {
  app = createApp();
  await resetDb();
  await seedCategories();
  user = await registerAndLogin(app, 'profile_p1', '资料测试员');
});

afterAll(async () => {
  await resetDb();
});

describe('PATCH /users/me 修改个人资料', () => {
  it('修改昵称成功并回传最新用户信息', async () => {
    const res = await request(app)
      .patch('/api/v1/users/me')
      .set(auth(user.token))
      .send({ nickname: '新昵称测试' });
    expect(res.status).toBe(200);
    expect(res.body.data.nickname).toBe('新昵称测试');
    expect(res.body.data.account).toBe('profile_p1');
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
  });

  it('可同时修改头像/电话/邮箱', async () => {
    const res = await request(app)
      .patch('/api/v1/users/me')
      .set(auth(user.token))
      .send({
        avatarUrl: 'https://example.com/avatar.png',
        phone: '13800001111',
        email: 'new@example.com',
      });
    expect(res.status).toBe(200);
    expect(res.body.data.avatarUrl).toBe('https://example.com/avatar.png');
    expect(res.body.data.phone).toBe('13800001111');
    expect(res.body.data.email).toBe('new@example.com');
  });

  it('支持把可选字段置为 null', async () => {
    const res = await request(app)
      .patch('/api/v1/users/me')
      .set(auth(user.token))
      .send({ phone: null, email: null });
    expect(res.status).toBe(200);
    expect(res.body.data.phone).toBeNull();
    expect(res.body.data.email).toBeNull();
  });

  it('account 与 role 不可修改（传入被忽略）', async () => {
    const res = await request(app)
      .patch('/api/v1/users/me')
      .set(auth(user.token))
      .send({ nickname: '改昵称', account: 'hacked_account', role: 'ADMIN' });
    expect(res.status).toBe(200);
    expect(res.body.data.account).toBe('profile_p1');
    expect(res.body.data.role).toBe('USER');
  });

  it('空 body → 400', async () => {
    const res = await request(app).patch('/api/v1/users/me').set(auth(user.token)).send({});
    expect(res.status).toBe(400);
    expect(res.body.code).toBe(40001);
  });

  it('昵称超长（>20）→ 400 且指向 nickname', async () => {
    const res = await request(app)
      .patch('/api/v1/users/me')
      .set(auth(user.token))
      .send({ nickname: 'x'.repeat(21) });
    expect(res.status).toBe(400);
    expect(res.body.data.fieldErrors[0].field).toBe('nickname');
  });

  it('非法邮箱 → 400', async () => {
    const res = await request(app).patch('/api/v1/users/me').set(auth(user.token)).send({ email: 'not-an-email' });
    expect(res.status).toBe(400);
  });

  it('未登录 → 401 / 40101', async () => {
    const res = await request(app).patch('/api/v1/users/me').send({ nickname: '游客改昵称' });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe(40101);
  });

  it('资料修改持久化到数据库', async () => {
    await request(app).patch('/api/v1/users/me').set(auth(user.token)).send({ nickname: '持久化验证' });
    const row = await prisma.user.findUnique({ where: { id: user.id }, select: { nickname: true } });
    expect(row?.nickname).toBe('持久化验证');
  });
});
