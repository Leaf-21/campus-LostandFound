import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import {
  auth,
  createPostAs,
  registerAndLogin,
  registerAndLoginAsAdmin,
  resetDb,
  seedCategories,
  type TestUser,
} from './helpers.js';

let app: Express;
let admin: TestUser;
let owner: TestUser;
let normal: TestUser;

beforeAll(async () => {
  app = createApp();
  await resetDb();
  await seedCategories();
  admin = await registerAndLoginAsAdmin(app);
  owner = await registerAndLogin(app, 'owner_p1', '发布者');
  normal = await registerAndLogin(app, 'normal_p1', '普通用户');
});

afterAll(async () => {
  await resetDb();
});

describe('管理员接口权限（docs/08 §3）', () => {
  it('未登录访问 /admin/posts → 401 / 40101', async () => {
    const res = await request(app).get('/api/v1/admin/posts');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe(40101);
  });

  it('普通用户访问 /admin/posts → 403 / 40301', async () => {
    const res = await request(app).get('/api/v1/admin/posts').set(auth(normal.token));
    expect(res.status).toBe(403);
    expect(res.body.code).toBe(40301);
  });

  it('普通用户隐藏信息 → 403', async () => {
    const post = await createPostAs(app, owner.token);
    const res = await request(app)
      .post(`/api/v1/admin/posts/${post.id}/hide`)
      .set(auth(normal.token))
      .send({ reason: '越权尝试' });
    expect(res.status).toBe(403);
  });

  it('普通用户恢复信息 → 403', async () => {
    const post = await createPostAs(app, owner.token);
    const res = await request(app)
      .post(`/api/v1/admin/posts/${post.id}/restore`)
      .set(auth(normal.token))
      .send({});
    expect(res.status).toBe(403);
  });
});

describe('GET /admin/posts 管理端列表', () => {
  it('管理员可分页查看', async () => {
    const res = await request(app).get('/api/v1/admin/posts?page=1&pageSize=10').set(auth(admin.token));
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ page: 1, pageSize: 10 });
    expect(Array.isArray(res.body.data.items)).toBe(true);
  });

  it('返回 previousStatus 字段（供前端判断能否恢复）', async () => {
    const res = await request(app).get('/api/v1/admin/posts?pageSize=1').set(auth(admin.token));
    expect(res.body.data.items[0]).toHaveProperty('previousStatus');
  });

  it('可按 status=HIDDEN 筛出隐藏信息（公开列表做不到）', async () => {
    const post = await createPostAs(app, owner.token);
    await request(app)
      .post(`/api/v1/admin/posts/${post.id}/hide`)
      .set(auth(admin.token))
      .send({ reason: '违规内容' });

    const res = await request(app).get('/api/v1/admin/posts?status=HIDDEN&pageSize=50').set(auth(admin.token));
    expect(res.status).toBe(200);
    expect(res.body.data.items.every((p: { status: string }) => p.status === 'HIDDEN')).toBe(true);
    expect(res.body.data.items.some((p: { id: string }) => p.id === post.id)).toBe(true);
  });

  it('可按 postType 与 keyword 筛选', async () => {
    await createPostAs(app, owner.token, { postType: 'LOST', title: '管理员筛选专用丢失耳机' });
    const byType = await request(app).get('/api/v1/admin/posts?postType=LOST&pageSize=50').set(auth(admin.token));
    expect(byType.body.data.items.every((p: { postType: string }) => p.postType === 'LOST')).toBe(true);

    const byKeyword = await request(app).get('/api/v1/admin/posts?keyword=' + encodeURIComponent('筛选专用')).set(auth(admin.token));
    expect(byKeyword.body.data.items.length).toBeGreaterThan(0);
  });

  it('pageSize 超过 50 → 400', async () => {
    const res = await request(app).get('/api/v1/admin/posts?pageSize=51').set(auth(admin.token));
    expect(res.status).toBe(400);
  });
});

describe('POST /admin/posts/:id/hide 隐藏', () => {
  it('隐藏成功：状态变 HIDDEN，保存 previousStatus，写审计日志', async () => {
    const post = await createPostAs(app, owner.token);
    const res = await request(app)
      .post(`/api/v1/admin/posts/${post.id}/hide`)
      .set(auth(admin.token))
      .send({ reason: '包含不适当内容' });

    expect(res.status).toBe(200);
    expect(res.body.data.post.status).toBe('HIDDEN');
    expect(res.body.data.post.previousStatus).toBe('OPEN');
    expect(res.body.data.action).toMatchObject({ action: 'HIDE', reason: '包含不适当内容' });

    // 审计日志落库
    const logs = await prisma.adminAction.findMany({ where: { targetId: post.id } });
    expect(logs.length).toBe(1);
    const log = logs[0]!;
    expect(log.action).toBe('HIDE');
    expect(log.adminId).toBe(admin.id);
  });

  it('隐藏后公开列表不可见、公开详情 404', async () => {
    const post = await createPostAs(app, owner.token);
    await request(app).post(`/api/v1/admin/posts/${post.id}/hide`).set(auth(admin.token)).send({});

    const list = await request(app).get('/api/v1/posts?pageSize=50');
    expect(list.body.data.items.some((p: { id: string }) => p.id === post.id)).toBe(false);

    const detail = await request(app).get(`/api/v1/posts/${post.id}`);
    expect(detail.status).toBe(404);
    expect(detail.body.code).toBe(40401);
  });

  it('重复隐藏 → 409 / 40901', async () => {
    const post = await createPostAs(app, owner.token);
    await request(app).post(`/api/v1/admin/posts/${post.id}/hide`).set(auth(admin.token)).send({});
    const again = await request(app).post(`/api/v1/admin/posts/${post.id}/hide`).set(auth(admin.token)).send({});
    expect(again.status).toBe(409);
    expect(again.body.code).toBe(40901);
  });

  it('隐藏不存在的信息 → 404', async () => {
    const res = await request(app)
      .post('/api/v1/admin/posts/99999999-0000-4000-8000-000000000000/hide')
      .set(auth(admin.token))
      .send({});
    expect(res.status).toBe(404);
  });

  it('reason 超过 200 字 → 400', async () => {
    const post = await createPostAs(app, owner.token);
    const res = await request(app)
      .post(`/api/v1/admin/posts/${post.id}/hide`)
      .set(auth(admin.token))
      .send({ reason: 'x'.repeat(201) });
    expect(res.status).toBe(400);
  });
});

describe('POST /admin/posts/:id/restore 恢复', () => {
  it('恢复 OPEN 帖：还原为 OPEN 并清空 previousStatus', async () => {
    const post = await createPostAs(app, owner.token);
    await request(app).post(`/api/v1/admin/posts/${post.id}/hide`).set(auth(admin.token)).send({});
    const res = await request(app)
      .post(`/api/v1/admin/posts/${post.id}/restore`)
      .set(auth(admin.token))
      .send({ reason: '申诉通过' });

    expect(res.status).toBe(200);
    expect(res.body.data.post.status).toBe('OPEN');
    expect(res.body.data.post.previousStatus).toBeNull();
    expect(res.body.data.action.action).toBe('RESTORE');
  });

  it('恢复 RESOLVED 帖必须精确还原为 RESOLVED（不能变 OPEN）', async () => {
    // 直接造一条 RESOLVED 帖，避免走完整申请流程
    const post = await createPostAs(app, owner.token);
    await prisma.post.update({ where: { id: post.id }, data: { status: 'RESOLVED' } });

    await request(app).post(`/api/v1/admin/posts/${post.id}/hide`).set(auth(admin.token)).send({});
    const res = await request(app).post(`/api/v1/admin/posts/${post.id}/restore`).set(auth(admin.token)).send({});

    expect(res.status).toBe(200);
    expect(res.body.data.post.status).toBe('RESOLVED');
  });

  it('恢复后公开可见且详情可访问', async () => {
    const post = await createPostAs(app, owner.token);
    await request(app).post(`/api/v1/admin/posts/${post.id}/hide`).set(auth(admin.token)).send({});
    await request(app).post(`/api/v1/admin/posts/${post.id}/restore`).set(auth(admin.token)).send({});

    const detail = await request(app).get(`/api/v1/posts/${post.id}`);
    expect(detail.status).toBe(200);
  });

  it('恢复未被隐藏的信息 → 409 / 40901', async () => {
    const post = await createPostAs(app, owner.token);
    const res = await request(app).post(`/api/v1/admin/posts/${post.id}/restore`).set(auth(admin.token)).send({});
    expect(res.status).toBe(409);
    expect(res.body.code).toBe(40901);
  });

  it('隐藏与恢复全过程各写一条日志', async () => {
    const post = await createPostAs(app, owner.token);
    await request(app).post(`/api/v1/admin/posts/${post.id}/hide`).set(auth(admin.token)).send({ reason: '待核实' });
    await request(app).post(`/api/v1/admin/posts/${post.id}/restore`).set(auth(admin.token)).send({ reason: '已核实' });

    const logs = await prisma.adminAction.findMany({ where: { targetId: post.id }, orderBy: { createdAt: 'asc' } });
    expect(logs.map((l) => l.action)).toEqual(['HIDE', 'RESTORE']);
  });
});

describe('隐藏信息对业务的影响', () => {
  it('隐藏后不能再提交申请 → 404（对普通用户等同不存在，不泄露隐藏状态）', async () => {
    const post = await createPostAs(app, owner.token);
    await request(app).post(`/api/v1/admin/posts/${post.id}/hide`).set(auth(admin.token)).send({});

    const res = await request(app)
      .post(`/api/v1/posts/${post.id}/applications`)
      .set(auth(normal.token))
      .send({ details: '这是一段足够长度的申请说明，用于验证隐藏信息不可申请。' });
    // 设计取舍：隐藏信息对普通用户应表现为「不存在」而非「已关闭」，
    // 否则会泄露管理员操作痕迹（apply on HIDDEN -> 404/40401 in applications.service）
    expect(res.status).toBe(404);
    expect(res.body.code).toBe(40401);
  });

  it('GET /admin/posts/:id/actions 返回该帖操作日志', async () => {
    const post = await createPostAs(app, owner.token);
    await request(app).post(`/api/v1/admin/posts/${post.id}/hide`).set(auth(admin.token)).send({ reason: '日志查询测试' });

    const res = await request(app).get(`/api/v1/admin/posts/${post.id}/actions`).set(auth(admin.token));
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].action).toBe('HIDE');
  });
});
