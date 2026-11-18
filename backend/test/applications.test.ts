import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../src/app.js';
import { auth, createPostAs, registerAndLogin, resetDb, seedCategories, type TestUser } from './helpers.js';

let app: Express;
let owner: TestUser;
let applicant: TestUser;
let other: TestUser;

const DETAILS = '物品是黑色手机，手机壳右下角有一道白色划痕，我可以补充锁屏照片进行核对。';

beforeAll(async () => {
  app = createApp();
  await resetDb();
  await seedCategories();
  owner = await registerAndLogin(app, 'owner2026', '发布者');
  applicant = await registerAndLogin(app, 'apply2026', '申请人');
  other = await registerAndLogin(app, 'other2026', '路人');
});

afterAll(async () => {
  await resetDb();
});

async function submit(appId: string, token: string) {
  return request(app).post(`/api/v1/posts/${appId}/applications`).set(auth(token)).send({ details: DETAILS });
}

describe('POST /posts/:id/applications 提交申请', () => {
  it('FOUND 信息自动生成 CLAIM', async () => {
    const post = await createPostAs(app, owner.token, { postType: 'FOUND' });
    const res = await submit(post.id, applicant.token);
    expect(res.status).toBe(201);
    expect(res.body.data.applicationType).toBe('CLAIM');
    expect(res.body.data.status).toBe('PENDING');
    expect(res.body.data.postTitle).toBe(post.title);
    expect(res.body.data.applicant.nickname).toBe('申请人');
  });

  it('LOST 信息自动生成 CLUE', async () => {
    const post = await createPostAs(app, owner.token, { postType: 'LOST' });
    const res = await submit(post.id, applicant.token);
    expect(res.status).toBe(201);
    expect(res.body.data.applicationType).toBe('CLUE');
  });

  it('不能申请自己发布的信息 → 403 / 40301', async () => {
    const post = await createPostAs(app, owner.token);
    const res = await submit(post.id, owner.token);
    expect(res.status).toBe(403);
    expect(res.body.code).toBe(40301);
  });

  it('重复有效申请 → 409 / 40902', async () => {
    const post = await createPostAs(app, owner.token);
    await submit(post.id, applicant.token);
    const res = await submit(post.id, applicant.token);
    expect(res.status).toBe(409);
    expect(res.body.code).toBe(40902);
  });

  it('说明过短 → 400 且指向 details', async () => {
    const post = await createPostAs(app, owner.token);
    const res = await request(app)
      .post(`/api/v1/posts/${post.id}/applications`)
      .set(auth(applicant.token))
      .send({ details: '太短' });
    expect(res.status).toBe(400);
    expect(res.body.data.fieldErrors[0].field).toBe('details');
  });

  it('未登录 → 401', async () => {
    const post = await createPostAs(app, owner.token);
    const res = await request(app).post(`/api/v1/posts/${post.id}/applications`).send({ details: DETAILS });
    expect(res.status).toBe(401);
  });

  it('信息不存在 → 404', async () => {
    const res = await submit('99999999-0000-4000-8000-000000000000', applicant.token);
    expect(res.status).toBe(404);
  });
});

describe('GET /posts/:id/applications 收到的申请', () => {
  it('返回数组，PENDING 优先（K1 契约）', async () => {
    const post = await createPostAs(app, owner.token);
    await submit(post.id, applicant.token);

    const res = await request(app).get(`/api/v1/posts/${post.id}/applications`).set(auth(owner.token));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].status).toBe('PENDING');
  });

  it('非发布者查看 → 403', async () => {
    const post = await createPostAs(app, owner.token);
    const res = await request(app).get(`/api/v1/posts/${post.id}/applications`).set(auth(other.token));
    expect(res.status).toBe(403);
    expect(res.body.code).toBe(40301);
  });
});

describe('GET /users/me/applications 我的申请', () => {
  it('role=SUBMITTED 只返回我提交的', async () => {
    const res = await request(app).get('/api/v1/users/me/applications?role=SUBMITTED').set(auth(applicant.token));
    expect(res.status).toBe(200);
    expect(res.body.data.items.every((a: { applicant: { nickname: string } }) => a.applicant.nickname === '申请人')).toBe(true);
  });

  it('role=RECEIVED 只返回我发布信息收到的', async () => {
    const res = await request(app).get('/api/v1/users/me/applications?role=RECEIVED&pageSize=50').set(auth(owner.token));
    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBeGreaterThan(0);
  });

  it('缺少 role → 400', async () => {
    const res = await request(app).get('/api/v1/users/me/applications').set(auth(owner.token));
    expect(res.status).toBe(400);
  });
});

describe('POST /applications/:id/decision 接受与拒绝', () => {
  it('接受后：申请 ACCEPTED、其余 PENDING 自动 REJECTED、帖子 PROCESSING（单事务）', async () => {
    const post = await createPostAs(app, owner.token);
    const first = (await submit(post.id, applicant.token)).body.data;
    const second = (await submit(post.id, other.token)).body.data;

    const res = await request(app)
      .post(`/api/v1/applications/${first.id}/decision`)
      .set(auth(owner.token))
      .send({ decision: 'ACCEPTED', reviewNote: '请到 3 号楼 501 领取' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ACCEPTED');
    expect(res.body.data.reviewNote).toBe('请到 3 号楼 501 领取');

    const postRes = await request(app).get(`/api/v1/posts/${post.id}`).set(auth(owner.token));
    expect(postRes.body.data.status).toBe('PROCESSING');

    const listRes = await request(app).get(`/api/v1/posts/${post.id}/applications`).set(auth(owner.token));
    const secondAfter = listRes.body.data.find((a: { id: string }) => a.id === second.id);
    expect(secondAfter.status).toBe('REJECTED');
    expect(secondAfter.reviewNote).toBe('该信息已由其他申请处理');
  });

  it('拒绝后帖子保持 OPEN', async () => {
    const post = await createPostAs(app, owner.token);
    const appRow = (await submit(post.id, other.token)).body.data;

    const res = await request(app)
      .post(`/api/v1/applications/${appRow.id}/decision`)
      .set(auth(owner.token))
      .send({ decision: 'REJECTED', reviewNote: '信息不匹配' });
    expect(res.body.data.status).toBe('REJECTED');

    const postRes = await request(app).get(`/api/v1/posts/${post.id}`);
    expect(postRes.body.data.status).toBe('OPEN');
  });

  it('非发布者处理 → 403', async () => {
    const post = await createPostAs(app, owner.token);
    const appRow = (await submit(post.id, applicant.token)).body.data;
    const res = await request(app)
      .post(`/api/v1/applications/${appRow.id}/decision`)
      .set(auth(other.token))
      .send({ decision: 'ACCEPTED' });
    expect(res.status).toBe(403);
  });

  it('重复处理同一申请 → 409（防重复点击）', async () => {
    const post = await createPostAs(app, owner.token);
    const appRow = (await submit(post.id, applicant.token)).body.data;
    await request(app)
      .post(`/api/v1/applications/${appRow.id}/decision`)
      .set(auth(owner.token))
      .send({ decision: 'ACCEPTED' });
    const again = await request(app)
      .post(`/api/v1/applications/${appRow.id}/decision`)
      .set(auth(owner.token))
      .send({ decision: 'ACCEPTED' });
    expect(again.status).toBe(409);
    expect(again.body.code).toBe(40901);
  });

  it('decision 非法值 → 400', async () => {
    const post = await createPostAs(app, owner.token);
    const appRow = (await submit(post.id, applicant.token)).body.data;
    const res = await request(app)
      .post(`/api/v1/applications/${appRow.id}/decision`)
      .set(auth(owner.token))
      .send({ decision: 'MAYBE' });
    expect(res.status).toBe(400);
  });
});

describe('POST /applications/:id/complete 完成交接', () => {
  it('完成后：申请 COMPLETED、帖子 RESOLVED（单事务）', async () => {
    const post = await createPostAs(app, owner.token);
    const appRow = (await submit(post.id, applicant.token)).body.data;
    await request(app)
      .post(`/api/v1/applications/${appRow.id}/decision`)
      .set(auth(owner.token))
      .send({ decision: 'ACCEPTED' });

    const res = await request(app)
      .post(`/api/v1/applications/${appRow.id}/complete`)
      .set(auth(owner.token));
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('COMPLETED');

    const postRes = await request(app).get(`/api/v1/posts/${post.id}`);
    expect(postRes.body.data.status).toBe('RESOLVED');
  });

  it('未接受的申请不能完成 → 409', async () => {
    const post = await createPostAs(app, owner.token);
    const appRow = (await submit(post.id, applicant.token)).body.data;
    const res = await request(app)
      .post(`/api/v1/applications/${appRow.id}/complete`)
      .set(auth(owner.token));
    expect(res.status).toBe(409);
  });

  it('已完成的信息不能再提交新申请 → 409', async () => {
    const post = await createPostAs(app, owner.token);
    const appRow = (await submit(post.id, applicant.token)).body.data;
    await request(app).post(`/api/v1/applications/${appRow.id}/decision`).set(auth(owner.token)).send({ decision: 'ACCEPTED' });
    await request(app).post(`/api/v1/applications/${appRow.id}/complete`).set(auth(owner.token));

    const res = await submit(post.id, other.token);
    expect(res.status).toBe(409);
  });
});

describe('POST /applications/:id/cancel 撤回（P1）', () => {
  it('申请人可撤回 PENDING 申请', async () => {
    const post = await createPostAs(app, owner.token);
    const appRow = (await submit(post.id, applicant.token)).body.data;
    const res = await request(app)
      .post(`/api/v1/applications/${appRow.id}/cancel`)
      .set(auth(applicant.token));
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('CANCELLED');
  });

  it('他人不能撤回 → 403', async () => {
    const post = await createPostAs(app, owner.token);
    const appRow = (await submit(post.id, applicant.token)).body.data;
    const res = await request(app)
      .post(`/api/v1/applications/${appRow.id}/cancel`)
      .set(auth(other.token));
    expect(res.status).toBe(403);
  });
});

describe('GET /applications/:id 申请详情权限', () => {
  it('申请人、发布者可读，第三方 403', async () => {
    const post = await createPostAs(app, owner.token);
    const appRow = (await submit(post.id, applicant.token)).body.data;

    const asApplicant = await request(app).get(`/api/v1/applications/${appRow.id}`).set(auth(applicant.token));
    const asOwner = await request(app).get(`/api/v1/applications/${appRow.id}`).set(auth(owner.token));
    const asOther = await request(app).get(`/api/v1/applications/${appRow.id}`).set(auth(other.token));

    expect(asApplicant.status).toBe(200);
    expect(asOwner.status).toBe(200);
    expect(asOther.status).toBe(403);
  });
});
