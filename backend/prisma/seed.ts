// Seed：分类、管理员、演示用户、帖子与申请
// 数据与 frontend/src/mock/db.ts 完全对齐（相同 UUID / 标题 / 状态 / 时间），
// 保证前端从 Mock 切到真实后端时演示效果一致。全部 upsert，可重复执行。

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD ?? 'Passw0rd!';
const ADMIN_ACCOUNT = process.env.ADMIN_ACCOUNT ?? 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'Admin@2026';

const CATEGORIES = [
  { id: '10000000-0000-4000-8000-000000000001', code: 'DIGITAL', name: '数码产品', sortOrder: 1 },
  { id: '10000000-0000-4000-8000-000000000002', code: 'CARD', name: '证件卡类', sortOrder: 2 },
  { id: '10000000-0000-4000-8000-000000000003', code: 'BOOK', name: '书籍文具', sortOrder: 3 },
  { id: '10000000-0000-4000-8000-000000000004', code: 'DAILY', name: '生活用品', sortOrder: 4 },
  { id: '10000000-0000-4000-8000-000000000005', code: 'CLOTHING', name: '衣物配饰', sortOrder: 5 },
  { id: '10000000-0000-4000-8000-000000000006', code: 'OTHER', name: '其他', sortOrder: 6 },
];

type SeedUser = { id: string; account: string; nickname: string; phone: string | null; email: string | null; role: 'USER' | 'ADMIN'; createdAt: string };
const USERS: SeedUser[] = [
  { id: '00000000-0000-4000-8000-000000000201', account: 'student2026', nickname: '小林', phone: '13800002016', email: 'xiaolin@example.com', role: 'USER', createdAt: '2026-11-16T09:00:00+08:00' },
  { id: '00000000-0000-4000-8000-000000000202', account: 'azhe2026', nickname: '阿哲', phone: null, email: null, role: 'USER', createdAt: '2026-11-16T09:10:00+08:00' },
  { id: '00000000-0000-4000-8000-000000000203', account: 'orange2026', nickname: '橙子学姐', phone: null, email: null, role: 'USER', createdAt: '2026-11-16T09:20:00+08:00' },
  { id: '00000000-0000-4000-8000-000000000204', account: 'xiaobei2026', nickname: '小北', phone: null, email: null, role: 'USER', createdAt: '2026-11-16T09:30:00+08:00' },
  { id: '00000000-0000-4000-8000-000000000205', account: 'anan2026', nickname: '安安', phone: null, email: null, role: 'USER', createdAt: '2026-11-16T09:40:00+08:00' },
  { id: '00000000-0000-4000-8000-000000000101', account: ADMIN_ACCOUNT, nickname: '平台管理员', phone: null, email: null, role: 'ADMIN', createdAt: '2026-11-15T09:00:00+08:00' },
];

type SeedPost = {
  id: string; postType: 'LOST' | 'FOUND'; title: string; categoryIdx: number; description: string;
  location: string; occurredAt: string; status: 'OPEN' | 'PROCESSING' | 'RESOLVED' | 'CLOSED' | 'HIDDEN';
  publisherIdx: number; images: string[]; reward: string | null; createdAt: string; resolvedAt?: string | null;
};

// 演示图片：与物品一一对应的本地图片，位于 backend/uploads/demo/
// 由 /uploads 静态服务提供，URL 用 PUBLIC_BASE_URL 拼绝对地址（与上传接口一致）
const PUBLIC_BASE_URL = (process.env.PUBLIC_BASE_URL ?? 'http://localhost:3000').replace(/\/+$/, '');
const img = (name: string): string => `${PUBLIC_BASE_URL}/uploads/demo/${name}.jpg`;

const POSTS: SeedPost[] = [
  { id: '30000000-0000-4000-8000-000000000001', postType: 'LOST', title: '丢失校园卡一张（深色卡面）', categoryIdx: 1, description: '今天下午在图书馆三楼自习区丢了一张校园卡，深色卡面印有校徽。捡到的同学请联系我，非常感谢！', location: '图书馆三楼自习区', occurredAt: '2026-11-16T15:20:00+08:00', status: 'OPEN', publisherIdx: 1, images: [img('post-01-card-green')], reward: null, createdAt: '2026-11-16T15:35:00+08:00' },
  { id: '30000000-0000-4000-8000-000000000002', postType: 'LOST', title: '蓝色保温杯（500ml）', categoryIdx: 3, description: '中午在二食堂一楼吃完饭忘记拿了，蓝色保温杯，杯身贴了一张小猫贴纸，是我女朋友送的，对我很重要。', location: '二食堂一楼靠窗座位', occurredAt: '2026-11-17T12:10:00+08:00', status: 'OPEN', publisherIdx: 2, images: [img('post-02-cup-blue')], reward: '找到重谢', createdAt: '2026-11-17T12:40:00+08:00' },
  { id: '30000000-0000-4000-8000-000000000003', postType: 'LOST', title: '白色无线耳机（AirPods Pro）', categoryIdx: 0, description: '昨晚在操场夜跑时耳机盒从口袋滑落，白色耳机配浅蓝色保护壳。定位显示最后在操场看台附近。', location: '操场跑道旁', occurredAt: '2026-11-17T18:40:00+08:00', status: 'OPEN', publisherIdx: 3, images: [img('post-03-earbuds')], reward: null, createdAt: '2026-11-17T19:05:00+08:00' },
  { id: '30000000-0000-4000-8000-000000000004', postType: 'FOUND', title: '捡到学生证一张（李雨桐）', categoryIdx: 1, description: '今早在教学楼 A 区大厅捡到一张学生证，姓名李雨桐，信息学院。请失主看到后联系我核实身份领取。', location: '教学楼A区大厅', occurredAt: '2026-11-18T08:15:00+08:00', status: 'OPEN', publisherIdx: 4, images: [img('post-04-student-card')], reward: null, createdAt: '2026-11-18T08:40:00+08:00' },
  { id: '30000000-0000-4000-8000-000000000005', postType: 'FOUND', title: '捡到一串钥匙（带玩偶挂件）', categoryIdx: 3, description: '篮球场看台捡到一串钥匙，上面挂着一个绿色小恐龙玩偶，一共 4 把钥匙。暂存在我这里，请失主描述挂件特征认领。', location: '篮球场看台', occurredAt: '2026-11-18T09:05:00+08:00', status: 'OPEN', publisherIdx: 1, images: [img('post-05-keys')], reward: null, createdAt: '2026-11-18T09:30:00+08:00' },
  { id: '30000000-0000-4000-8000-000000000006', postType: 'FOUND', title: '捡到黑色折叠雨伞', categoryIdx: 3, description: '昨天傍晚在校门口快递站门口捡到一把黑色折叠伞，伞柄有轻微划痕。已有人认领处理中。', location: '校门口快递站', occurredAt: '2026-11-17T17:30:00+08:00', status: 'PROCESSING', publisherIdx: 2, images: [img('post-06-umbrella')], reward: null, createdAt: '2026-11-17T18:00:00+08:00' },
  { id: '30000000-0000-4000-8000-000000000007', postType: 'LOST', title: '深灰色笔记本电脑包', categoryIdx: 0, description: '昨天在图书馆一楼存包处附近丢失一个深灰色电脑包，内有笔记本电脑和学习资料，电脑里有课程作业，非常着急！', location: '图书馆一楼存包处', occurredAt: '2026-11-17T20:00:00+08:00', status: 'PROCESSING', publisherIdx: 0, images: [img('post-07-laptop-bag')], reward: '必有重谢', createdAt: '2026-11-17T20:20:00+08:00' },
  { id: '30000000-0000-4000-8000-000000000008', postType: 'LOST', title: '高等数学教材（上册）', categoryIdx: 2, description: '上周在三教 302 上课后忘拿了高数上册教材（同济第八版），封面写有我的名字。已经找回来了，谢谢提供线索的同学！', location: '三教302教室', occurredAt: '2026-11-16T10:00:00+08:00', status: 'RESOLVED', publisherIdx: 3, images: [img('post-08-textbook')], reward: null, createdAt: '2026-11-16T10:30:00+08:00', resolvedAt: '2026-11-16T18:00:00+08:00' },
  { id: '30000000-0000-4000-8000-000000000009', postType: 'FOUND', title: '捡到校园卡一张（王浩）', categoryIdx: 1, description: '食堂二楼捡到一张校园卡，失主王浩。已经联系上失主并归还，感谢平台！', location: '食堂二楼', occurredAt: '2026-11-16T12:30:00+08:00', status: 'RESOLVED', publisherIdx: 4, images: [img('post-09-card-wanghao')], reward: null, createdAt: '2026-11-16T13:00:00+08:00', resolvedAt: '2026-11-16T20:00:00+08:00' },
  { id: '30000000-0000-4000-8000-000000000010', postType: 'LOST', title: '白色帆布鞋（39 码）', categoryIdx: 4, description: '今天早上在体育馆更衣室换衣服时丢了一只白色帆布鞋（左脚，39 码），鞋面画了一朵小花。', location: '体育馆更衣室', occurredAt: '2026-11-18T07:50:00+08:00', status: 'OPEN', publisherIdx: 0, images: [img('post-10-sneakers')], reward: null, createdAt: '2026-11-18T08:10:00+08:00' },
  { id: '30000000-0000-4000-8000-000000000011', postType: 'FOUND', title: '捡到灰色保温水杯', categoryIdx: 3, description: '图书馆二楼饮水处捡到一个灰色保温杯，杯底有一道划痕。请失主描述细节后认领。', location: '图书馆二楼饮水处', occurredAt: '2026-11-18T10:20:00+08:00', status: 'OPEN', publisherIdx: 0, images: [img('post-11-thermos-gray')], reward: null, createdAt: '2026-11-18T10:45:00+08:00' },
  { id: '30000000-0000-4000-8000-000000000012', postType: 'LOST', title: '手机（黑色手机壳带贴纸）', categoryIdx: 0, description: '昨天下午在操场看台拍照后手机不见了，黑色手机壳，背面贴了一张卡通贴纸。手机里有重要聊天记录。', location: '操场看台', occurredAt: '2026-11-17T16:45:00+08:00', status: 'OPEN', publisherIdx: 3, images: [img('post-12-phone')], reward: null, createdAt: '2026-11-17T17:10:00+08:00' },
  { id: '30000000-0000-4000-8000-000000000013', postType: 'FOUND', title: '捡到科学计算器', categoryIdx: 2, description: '实验楼 B 栋 205 教室捡到一台科学计算器，屏幕一角有贴纸。请失主描述贴纸内容认领。', location: '实验楼B栋205', occurredAt: '2026-11-18T11:00:00+08:00', status: 'OPEN', publisherIdx: 2, images: [img('post-13-calculator')], reward: null, createdAt: '2026-11-18T11:20:00+08:00' },
  { id: '30000000-0000-4000-8000-000000000014', postType: 'FOUND', title: '捡到羽毛球拍（两支）', categoryIdx: 3, description: '体育馆羽毛球场捡到两支羽毛球拍，已无人认领，信息暂时关闭。', location: '体育馆羽毛球场', occurredAt: '2026-11-15T19:30:00+08:00', status: 'CLOSED', publisherIdx: 1, images: [img('post-14')], reward: null, createdAt: '2026-11-15T20:00:00+08:00' },
  { id: '30000000-0000-4000-8000-000000000015', postType: 'FOUND', title: '捡到蓝色 U 盘（32G）', categoryIdx: 0, description: '机房三楼 307 捡到一个蓝色 U 盘，32G，接口处有磨损。已有人申请认领，正在处理中。', location: '机房三楼307', occurredAt: '2026-11-18T09:40:00+08:00', status: 'PROCESSING', publisherIdx: 0, images: [img('post-15-usb')], reward: null, createdAt: '2026-11-18T10:00:00+08:00' },
];

type SeedApp = {
  id: string; postIdx: number; applicationType: 'CLAIM' | 'CLUE'; applicantIdx: number;
  details: string; status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';
  reviewNote: string | null; createdAt: string; reviewedAt?: string | null; completedAt?: string | null;
};

const APPLICATIONS: SeedApp[] = [
  { id: '40000000-0000-4000-8000-000000000001', postIdx: 6, applicationType: 'CLUE', applicantIdx: 1, details: '我昨天下午 4 点左右在图书馆一楼存包处旁边的长椅上见过一个深灰色电脑包，后来就没注意了，建议回去看看或者问一下管理员。', status: 'PENDING', reviewNote: null, createdAt: '2026-11-17T21:05:00+08:00' },
  { id: '40000000-0000-4000-8000-000000000002', postIdx: 6, applicationType: 'CLUE', applicantIdx: 3, details: '我室友说昨晚看到有人把一个深灰色电脑包交到了图书馆服务台，你们可以去服务台问问。', status: 'PENDING', reviewNote: null, createdAt: '2026-11-17T22:12:00+08:00' },
  { id: '40000000-0000-4000-8000-000000000003', postIdx: 10, applicationType: 'CLAIM', applicantIdx: 4, details: '灰色保温杯是我的！杯底有一道划痕，是上周在实验室蹭的，杯盖内侧还贴着一张卡通小贴纸。请问怎么联系您领取？', status: 'PENDING', reviewNote: null, createdAt: '2026-11-18T11:10:00+08:00' },
  { id: '40000000-0000-4000-8000-000000000004', postIdx: 14, applicationType: 'CLAIM', applicantIdx: 3, details: '蓝色 32G U 盘应该是我的，接口处有磨损，里面存的是我的课程设计和几张照片，可以核对内容。', status: 'ACCEPTED', reviewNote: '已确认特征，请到 3 号楼 501 找我领取。', createdAt: '2026-11-18T10:30:00+08:00', reviewedAt: '2026-11-18T10:40:00+08:00' },
  { id: '40000000-0000-4000-8000-000000000005', postIdx: 11, applicationType: 'CLUE', applicantIdx: 0, details: '我昨天下午 4 点半左右在操场看台附近看到有人捡起一部黑色手机，往体育馆方向走去了，建议去体育馆失物招领处问问。', status: 'PENDING', reviewNote: null, createdAt: '2026-11-17T17:50:00+08:00' },
  { id: '40000000-0000-4000-8000-000000000006', postIdx: 12, applicationType: 'CLAIM', applicantIdx: 0, details: '我上周在实验楼 B 栋丢了一台科学计算器，屏幕右上角贴了一张小贴纸。', status: 'REJECTED', reviewNote: '抱歉，你描述的计算器型号对不上，这个不是你的。', createdAt: '2026-11-18T11:40:00+08:00', reviewedAt: '2026-11-18T11:45:00+08:00' },
  { id: '40000000-0000-4000-8000-000000000007', postIdx: 5, applicationType: 'CLAIM', applicantIdx: 0, details: '黑色折叠伞是我的，伞柄上有一道划痕，是上次雨天在校门口磕的。谢谢您！', status: 'ACCEPTED', reviewNote: '好的，雨伞暂存在 4 号宿舍楼下宿管处，随时来取。', createdAt: '2026-11-17T18:40:00+08:00', reviewedAt: '2026-11-17T19:00:00+08:00' },
  { id: '40000000-0000-4000-8000-000000000008', postIdx: 1, applicationType: 'CLUE', applicantIdx: 0, details: '我昨天中午在二食堂一楼靠窗的位置看到过一个蓝色保温杯，后来被清洁阿姨收走了，可以问问食堂保洁。', status: 'PENDING', reviewNote: null, createdAt: '2026-11-17T13:15:00+08:00' },
  { id: '40000000-0000-4000-8000-000000000009', postIdx: 7, applicationType: 'CLUE', applicantIdx: 0, details: '我在三教 302 讲台下面的抽屉里看到过一本高数下册，可以去看看。', status: 'COMPLETED', reviewNote: '谢谢你的线索，书已经找回来了！', createdAt: '2026-11-16T11:00:00+08:00', reviewedAt: '2026-11-16T12:00:00+08:00', completedAt: '2026-11-16T18:00:00+08:00' },
];

async function main(): Promise<void> {
  console.log('[seed] 开始写入演示数据…');

  for (const c of CATEGORIES) {
    await prisma.category.upsert({ where: { id: c.id }, update: c, create: c });
  }
  console.log(`[seed] 分类 ${CATEGORIES.length} 条`);

  const demoHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  for (const u of USERS) {
    const passwordHash = u.role === 'ADMIN' ? adminHash : demoHash;
    await prisma.user.upsert({
      where: { id: u.id },
      update: { account: u.account, nickname: u.nickname, phone: u.phone, email: u.email, role: u.role },
      create: { ...u, passwordHash },
    });
  }
  console.log(`[seed] 用户 ${USERS.length} 个（管理员 1 + 演示 5）`);

  for (const p of POSTS) {
    const { images, categoryIdx, publisherIdx, ...rest } = p;
    const category = CATEGORIES[categoryIdx]!;
    const publisher = USERS[publisherIdx]!;
    const data = {
      ...rest,
      categoryId: category.id,
      publisherId: publisher.id,
      occurredAt: new Date(p.occurredAt),
      createdAt: new Date(p.createdAt),
      resolvedAt: p.resolvedAt ? new Date(p.resolvedAt) : null,
    };
    await prisma.post.upsert({ where: { id: p.id }, update: data, create: { ...data, id: p.id } });
    await prisma.postImage.deleteMany({ where: { postId: p.id } });
    if (images.length > 0) {
      await prisma.postImage.createMany({
        data: images.map((url, i) => ({ postId: p.id, url, sortOrder: i })),
      });
    }
  }
  console.log(`[seed] 信息 ${POSTS.length} 条（含图片 ${POSTS.reduce((s, p) => s + p.images.length, 0)} 张）`);

  for (const a of APPLICATIONS) {
    const { postIdx, applicantIdx, ...rest } = a;
    const targetPost = POSTS[postIdx]!;
    const applicant = USERS[applicantIdx]!;
    const data = {
      ...rest,
      postId: targetPost.id,
      applicantId: applicant.id,
      createdAt: new Date(a.createdAt),
      reviewedAt: a.reviewedAt ? new Date(a.reviewedAt) : null,
      completedAt: a.completedAt ? new Date(a.completedAt) : null,
    };
    await prisma.application.upsert({ where: { id: a.id }, update: data, create: { ...data, id: a.id } });
  }
  console.log(`[seed] 申请 ${APPLICATIONS.length} 条`);
  console.log('[seed] 完成。演示账号：student2026 / ' + DEMO_PASSWORD + '，管理员：' + ADMIN_ACCOUNT);
}

main()
  .catch((e) => {
    console.error('[seed] 失败：', e);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
