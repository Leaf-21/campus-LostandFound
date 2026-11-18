import request from 'supertest';
import type { Express } from 'express';
import { prisma } from '../src/config/prisma.js';

export const DEMO_PASSWORD = 'Passw0rd!';
export const DEMO_ACCOUNT = 'student2026';
export const DEMO_ACCOUNT_2 = 'azhe2026';

/** 清空业务表（保留分类），保证每个测试文件从确定状态开始 */
export async function resetDb(): Promise<void> {
  await prisma.application.deleteMany();
  await prisma.postImage.deleteMany();
  await prisma.post.deleteMany();
  await prisma.uploadedFile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.category.deleteMany();
}

export async function seedCategories(): Promise<void> {
  const rows = [
    { id: '10000000-0000-4000-8000-000000000001', code: 'DIGITAL', name: '数码产品', sortOrder: 1 },
    { id: '10000000-0000-4000-8000-000000000002', code: 'CARD', name: '证件卡类', sortOrder: 2 },
    { id: '10000000-0000-4000-8000-000000000003', code: 'BOOK', name: '书籍文具', sortOrder: 3 },
  ];
  await prisma.category.createMany({ data: rows });
}

export interface TestUser {
  id: string;
  account: string;
  token: string;
}

/** 通过真实注册/登录接口拿到 token，避免测试里伪造 JWT */
export async function registerAndLogin(app: Express, account: string, nickname: string): Promise<TestUser> {
  const registerRes = await request(app)
    .post('/api/v1/auth/register')
    .send({ account, password: DEMO_PASSWORD, nickname });
  if (registerRes.status !== 201) {
    throw new Error(`注册失败: ${registerRes.status} ${JSON.stringify(registerRes.body)}`);
  }
  const loginRes = await request(app).post('/api/v1/auth/login').send({ account, password: DEMO_PASSWORD });
  if (loginRes.status !== 200) {
    throw new Error(`登录失败: ${loginRes.status} ${JSON.stringify(loginRes.body)}`);
  }
  return { id: registerRes.body.data.id, account, token: loginRes.body.data.accessToken };
}

export function auth(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}

export async function createPostAs(app: Express, token: string, overrides: Record<string, unknown> = {}) {
  const res = await request(app)
    .post('/api/v1/posts')
    .set(auth(token))
    .send({
      postType: 'FOUND',
      title: '在图书馆一楼拾获校园卡',
      description: '在图书馆一楼自助借还机附近拾获一张校园卡，请失主描述卡套特征认领。',
      categoryId: '10000000-0000-4000-8000-000000000002',
      location: '图书馆一楼',
      occurredAt: '2026-11-16T09:20:00+08:00',
      ...overrides,
    });
  if (res.status !== 201) {
    throw new Error(`发布失败: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.data;
}
