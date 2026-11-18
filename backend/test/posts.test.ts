import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../src/app.js';
import { auth, createPostAs, registerAndLogin, resetDb, seedCategories, type TestUser } from './helpers.js';

let app: Express;
let alice: TestUser;
let bob: TestUser;

beforeAll(async () => {
  app = createApp();
  await resetDb();
  await seedCategories();
  alice = await registerAndLogin(app, 'alice2026', '小林');
  bob = await registerAndLogin(app, 'bob2026', '小周');
});

afterAll(async () => {
  await resetDb();
});

describe('GET /categories', () => {
  it('返回 {id,name,sort}，不含 code/isActive', async () => {
    const res = await request(app).get('/api/v1/categories');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0]).toEqual({
      id: expect.any(String),
      name: expect.any(String),
      sort: expect.any(Number),
    });
    expect(res.body.data[0]).not.toHaveProperty('code');
    expect(Object.keys(res.body.data[0]).sort()).toEqual(['id', 'name', 'sort']);
  });
});

describe('POST /posts', () => {
  it('发布成功返回 201，状态固定 OPEN，时间带 +08:00 偏移', async () => {
    const post = await createPostAs(app, alice.token);
    expect(post.status).toBe('OPEN');
    expect(post.categoryName).toBe('证件卡类');
    expect(post.publisher.nickname).toBe('小林');
    expect(post.publisher).not.toHaveProperty('phone');
    expect(post.createdAt).toMatch(/\+08:00$/);
    expect(post.images).toEqual([]);
    expect(post.applicationCount).toBe(0);
  });

  it('带图片发布时按顺序返回 images', async () => {
    const post = await createPostAs(app, alice.token, {
      images: ['https://example.com/a.png', 'https://example.com/b.png'],
    });
    expect(post.images).toEqual(['https://example.com/a.png', 'https://example.com/b.png']);
  });

  it('未登录发布返回 401', async () => {
    const res = await request(app).post('/api/v1/posts').send({});
    expect(res.status).toBe(401);
  });

  it('标题过短返回 400 且 fieldErrors 指向 title', async () => {
    const res = await request(app)
      .post('/api/v1/posts')
      .set(auth(alice.token))
      .send({
        postType: 'FOUND',
        title: '短',
        description: '这是一段足够长的描述内容用于通过校验。',
        categoryId: '10000000-0000-4000-8000-000000000002',
        location: '图书馆',
        occurredAt: '2026-11-16T09:20:00+08:00',
      });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe(40001);
    expect(res.body.data.fieldErrors[0].field).toBe('title');
  });

  it('图片超过 5 张返回 400', async () => {
    const res = await request(app)
      .post('/api/v1/posts')
      .set(auth(alice.token))
      .send({
        postType: 'FOUND',
        title: '捡到东西',
        description: '这是一段足够长的描述内容用于通过校验。',
        categoryId: '10000000-0000-4000-8000-000000000002',
        location: '图书馆',
        occurredAt: '2026-11-16T09:20:00+08:00',
        images: ['1', '2', '3', '4', '5', '6'],
      });
    expect(res.status).toBe(400);
  });

  it('发生时间在未来返回 400', async () => {
    const res = await request(app)
      .post('/api/v1/posts')
      .set(auth(alice.token))
      .send({
        postType: 'FOUND',
        title: '捡到东西',
        description: '这是一段足够长的描述内容用于通过校验。',
        categoryId: '10000000-0000-4000-8000-000000000002',
        location: '图书馆',
        occurredAt: '2099-01-01T00:00:00+08:00',
      });
    expect(res.status).toBe(400);
    expect(res.body.data.fieldErrors[0].field).toBe('occurredAt');
  });

  it('分类不存在返回 400', async () => {
    const res = await request(app)
      .post('/api/v1/posts')
      .set(auth(alice.token))
      .send({
        postType: 'FOUND',
        title: '捡到东西',
        description: '这是一段足够长的描述内容用于通过校验。',
        categoryId: '99999999-0000-4000-8000-000000000000',
        location: '图书馆',
        occurredAt: '2026-11-16T09:20:00+08:00',
      });
    expect(res.status).toBe(400);
  });
});

describe('GET /posts 列表与筛选', () => {
  beforeAll(async () => {
    await createPostAs(app, alice.token, { postType: 'LOST', title: '丢失校园卡一张' });
    await createPostAs(app, alice.token, { postType: 'FOUND', title: '捡到蓝色雨伞', location: '二食堂' });
  });

  it('默认只返回 OPEN 与 PROCESSING', async () => {
    const res = await request(app).get('/api/v1/posts?pageSize=50');
    expect(res.status).toBe(200);
    const statuses = new Set(res.body.data.items.map((p: { status: string }) => p.status));
    expect([...statuses].every((s) => s === 'OPEN' || s === 'PROCESSING')).toBe(true);
  });

  it('按 postType 筛选', async () => {
    const res = await request(app).get('/api/v1/posts?postType=LOST&pageSize=50');
    expect(res.body.data.items.every((p: { postType: string }) => p.postType === 'LOST')).toBe(true);
  });

  it('关键词匹配标题', async () => {
    const res = await request(app).get('/api/v1/posts?keyword=雨伞');
    expect(res.body.data.items.length).toBeGreaterThan(0);
    expect(res.body.data.items[0].title).toContain('雨伞');
  });

  it('地点关键词筛选', async () => {
    const res = await request(app).get('/api/v1/posts?location=二食堂');
    expect(res.body.data.items.every((p: { location: string }) => p.location.includes('二食堂'))).toBe(true);
  });

  it('分页返回 page/pageSize/total/totalPages', async () => {
    const res = await request(app).get('/api/v1/posts?page=1&pageSize=2');
    expect(res.body.data).toMatchObject({ page: 1, pageSize: 2 });
    expect(res.body.data.items.length).toBeLessThanOrEqual(2);
    expect(res.body.data.totalPages).toBe(Math.ceil(res.body.data.total / 2));
  });

  it('pageSize 超过 50 返回 400', async () => {
    const res = await request(app).get('/api/v1/posts?pageSize=51');
    expect(res.status).toBe(400);
  });

  it('排序 OLDEST 与 LATEST 顺序相反', async () => {
    const latest = await request(app).get('/api/v1/posts?pageSize=50&sort=LATEST');
    const oldest = await request(app).get('/api/v1/posts?pageSize=50&sort=OLDEST');
    const latestIds = latest.body.data.items.map((p: { id: string }) => p.id);
    const oldestIds = oldest.body.data.items.map((p: { id: string }) => p.id);
    expect(latestIds).toEqual([...oldestIds].reverse());
  });

  it('status=HIDDEN 不返回隐藏信息而是回落到默认可见集合', async () => {
    const res = await request(app).get('/api/v1/posts?status=HIDDEN&pageSize=50');
    expect(res.status).toBe(200);
    const statuses = new Set(res.body.data.items.map((p: { status: string }) => p.status));
    expect(statuses.has('HIDDEN')).toBe(false);
  });
});

describe('GET /posts/:id 详情', () => {
  it('游客访问返回 currentUserRelation=null', async () => {
    const post = await createPostAs(app, alice.token);
    const res = await request(app).get(`/api/v1/posts/${post.id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.currentUserRelation).toBeNull();
  });

  it('发布者访问时 isPublisher=true', async () => {
    const post = await createPostAs(app, alice.token);
    const res = await request(app).get(`/api/v1/posts/${post.id}`).set(auth(alice.token));
    expect(res.body.data.currentUserRelation.isPublisher).toBe(true);
    expect(res.body.data.currentUserRelation.myApplicationStatus).toBeNull();
  });

  it('不存在的信息返回 404 / 40401', async () => {
    const res = await request(app).get('/api/v1/posts/99999999-0000-4000-8000-000000000000');
    expect(res.status).toBe(404);
    expect(res.body.code).toBe(40401);
  });
});

describe('PATCH /posts/:id 编辑', () => {
  it('本人可编辑 OPEN 信息', async () => {
    const post = await createPostAs(app, alice.token);
    const res = await request(app)
      .patch(`/api/v1/posts/${post.id}`)
      .set(auth(alice.token))
      .send({ title: '修改后的标题长度合规', location: '新地点' });
    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('修改后的标题长度合规');
    expect(res.body.data.location).toBe('新地点');
  });

  it('他人编辑返回 403 / 40301', async () => {
    const post = await createPostAs(app, alice.token);
    const res = await request(app)
      .patch(`/api/v1/posts/${post.id}`)
      .set(auth(bob.token))
      .send({ title: '想改别人的帖子' });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe(40301);
  });

  it('编辑时传 images 为整组替换', async () => {
    const post = await createPostAs(app, alice.token, {
      images: ['https://example.com/1.png', 'https://example.com/2.png'],
    });
    const res = await request(app)
      .patch(`/api/v1/posts/${post.id}`)
      .set(auth(alice.token))
      .send({ images: ['https://example.com/new.png'] });
    expect(res.status).toBe(200);
    expect(res.body.data.images).toEqual(['https://example.com/new.png']);
  });

  it('空 body 返回 400', async () => {
    const post = await createPostAs(app, alice.token);
    const res = await request(app).patch(`/api/v1/posts/${post.id}`).set(auth(alice.token)).send({});
    expect(res.status).toBe(400);
  });
});

describe('GET /users/me/posts 我的发布', () => {
  it('只返回本人发布的信息', async () => {
    const res = await request(app).get('/api/v1/users/me/posts').set(auth(bob.token));
    expect(res.status).toBe(200);
    expect(res.body.data.items.every((p: { publisher: { nickname: string } }) => p.publisher.nickname === '小周')).toBe(true);
  });

  it('未登录返回 401', async () => {
    const res = await request(app).get('/api/v1/users/me/posts');
    expect(res.status).toBe(401);
  });
});
