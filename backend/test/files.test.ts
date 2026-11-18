import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../src/app.js';
import { auth, registerAndLogin, resetDb, seedCategories, type TestUser } from './helpers.js';

let app: Express;
let user: TestUser;

/** 1x1 PNG（合法图片字节，用于验证通过白名单） */
const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

beforeAll(async () => {
  app = createApp();
  await resetDb();
  await seedCategories();
  user = await registerAndLogin(app, 'uploader01', '上传者');
});

afterAll(async () => {
  await resetDb();
});

describe('POST /files 上传图片', () => {
  it('上传 PNG 成功返回完整可访问 URL 与元数据', async () => {
    const res = await request(app)
      .post('/api/v1/files')
      .set(auth(user.token))
      .attach('file', PNG_1PX, { filename: 'card.png', contentType: 'image/png' });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      fileId: expect.any(String),
      url: expect.stringMatching(/^http:\/\/localhost:3000\/uploads\/.+\.png$/),
      fileName: 'card.png',
      size: PNG_1PX.length,
      contentType: 'image/png',
    });
  });

  it('上传的 URL 可直接通过静态目录访问', async () => {
    const up = await request(app)
      .post('/api/v1/files')
      .set(auth(user.token))
      .attach('file', PNG_1PX, { filename: 'view.png', contentType: 'image/png' });
    const pathName = new URL(up.body.data.url).pathname;
    const res = await request(app).get(pathName);
    expect(res.status).toBe(200);
  });

  it('不支持的格式（GIF）→ 415 / 40002', async () => {
    const res = await request(app)
      .post('/api/v1/files')
      .set(auth(user.token))
      .attach('file', Buffer.from('GIF89a'), { filename: 'a.gif', contentType: 'image/gif' });
    expect(res.status).toBe(415);
    expect(res.body.code).toBe(40002);
  });

  it('SVG 被拒绝（docs/00 §7.8）', async () => {
    const res = await request(app)
      .post('/api/v1/files')
      .set(auth(user.token))
      .attach('file', Buffer.from('<svg></svg>'), { filename: 'x.svg', contentType: 'image/svg+xml' });
    expect(res.status).toBe(415);
  });

  it('超过 5MB → 413', async () => {
    const big = Buffer.alloc(6 * 1024 * 1024, 1);
    const res = await request(app)
      .post('/api/v1/files')
      .set(auth(user.token))
      .attach('file', big, { filename: 'big.png', contentType: 'image/png' });
    expect(res.status).toBe(413);
    expect(res.body.code).toBe(40002);
  });

  it('未登录 → 401', async () => {
    const res = await request(app)
      .post('/api/v1/files')
      .attach('file', PNG_1PX, { filename: 'x.png', contentType: 'image/png' });
    expect(res.status).toBe(401);
  });

  it('没有文件 → 400', async () => {
    const res = await request(app).post('/api/v1/files').set(auth(user.token));
    expect(res.status).toBe(400);
    expect(res.body.code).toBe(40002);
  });
});
