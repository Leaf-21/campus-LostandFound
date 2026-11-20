import type { Application, Category, Post, PostType, User, UserSummary } from '@/types'

/** Mock 用户（含明文密码，仅 Mock 内存使用；真实后端绝不返回密码） */
export interface MockUser extends User {
  password: string
}

/** 固定 6 个分类（与 docs/05 一致） */
export const categories: Category[] = [
  { id: '10000000-0000-4000-8000-000000000001', name: '数码产品', sort: 1 },
  { id: '10000000-0000-4000-8000-000000000002', name: '证件卡类', sort: 2 },
  { id: '10000000-0000-4000-8000-000000000003', name: '书籍文具', sort: 3 },
  { id: '10000000-0000-4000-8000-000000000004', name: '生活用品', sort: 4 },
  { id: '10000000-0000-4000-8000-000000000005', name: '衣物配饰', sort: 5 },
  { id: '10000000-0000-4000-8000-000000000006', name: '其他', sort: 6 }
]

export const users: MockUser[] = [
  {
    id: '00000000-0000-4000-8000-000000000201',
    account: 'student2026',
    password: 'Passw0rd!',
    nickname: '小林',
    avatarUrl: null,
    phone: '13800002016',
    email: 'xiaolin@example.com',
    role: 'USER',
    createdAt: '2026-11-16T09:00:00+08:00'
  },
  {
    id: '00000000-0000-4000-8000-000000000202',
    account: 'azhe2026',
    password: 'Passw0rd!',
    nickname: '阿哲',
    avatarUrl: null,
    phone: null,
    email: null,
    role: 'USER',
    createdAt: '2026-11-16T09:10:00+08:00'
  },
  {
    id: '00000000-0000-4000-8000-000000000203',
    account: 'orange2026',
    password: 'Passw0rd!',
    nickname: '橙子学姐',
    avatarUrl: null,
    phone: null,
    email: null,
    role: 'USER',
    createdAt: '2026-11-16T09:20:00+08:00'
  },
  {
    id: '00000000-0000-4000-8000-000000000204',
    account: 'xiaobei2026',
    password: 'Passw0rd!',
    nickname: '小北',
    avatarUrl: null,
    phone: null,
    email: null,
    role: 'USER',
    createdAt: '2026-11-16T09:30:00+08:00'
  },
  {
    id: '00000000-0000-4000-8000-000000000205',
    account: 'anan2026',
    password: 'Passw0rd!',
    nickname: '安安',
    avatarUrl: null,
    phone: null,
    email: null,
    role: 'USER',
    createdAt: '2026-11-16T09:40:00+08:00'
  }
]

/** 当前登录用户（Mock 内存态，刷新页面后回落到演示账号 users[0]） */
export let currentUserId: string | null = null

export function setCurrentUserId(id: string | null) {
  currentUserId = id
}

export function getCurrentMockUser(): MockUser | null {
  if (currentUserId) return users.find((u) => u.id === currentUserId) ?? null
  return null
}

export function summaryOf(u: Pick<MockUser, 'id' | 'nickname' | 'avatarUrl'>): UserSummary {
  return { id: u.id, nickname: u.nickname, avatarUrl: u.avatarUrl }
}

// 演示图片：与物品一一对应的本地图片，由后端 /uploads/demo/ 提供
// 与 backend/prisma/seed.ts 保持完全一致
const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1').replace(/\/api\/v1\/?$/, '')
function img(name: string): string {
  return `${API_ORIGIN}/uploads/demo/${name}.jpg`
}

type SeedPost = [
  postType: PostType,
  title: string,
  categoryIdx: number,
  description: string,
  location: string,
  occurredAt: string,
  status: Post['status'],
  publisherIdx: number,
  images: string[],
  reward: string | null,
  createdAt: string
]

function buildPost(id: string, seed: SeedPost): Post {
  const [postType, title, categoryIdx, description, location, occurredAt, status, publisherIdx, images, reward, createdAt] = seed
  return {
    id,
    postType,
    title,
    description,
    categoryId: categories[categoryIdx].id,
    categoryName: categories[categoryIdx].name,
    images,
    location,
    occurredAt,
    reward,
    status,
    publisher: summaryOf(users[publisherIdx]),
    applicationCount: 0,
    createdAt,
    updatedAt: createdAt
  }
}

/** 种子信息：覆盖 OPEN/PROCESSING/RESOLVED/CLOSED、有图/无图、LOST/FOUND 全状态 */
export const posts: Post[] = [
  buildPost('30000000-0000-4000-8000-000000000001', [
    'LOST', '丢失校园卡一张（绿色卡套）', 1,
    '今天下午在图书馆三楼自习区丢了一张校园卡，绿色卡套，卡上有"2026 级"字样。捡到的同学请联系我，非常感谢！',
    '图书馆三楼自习区', '2026-11-16T15:20:00+08:00', 'OPEN', 1, [img('post-01-card-green')], null,
    '2026-11-16T15:35:00+08:00'
  ]),
  buildPost('30000000-0000-4000-8000-000000000002', [
    'LOST', '蓝色保温杯（500ml）', 3,
    '中午在二食堂一楼吃完饭忘记拿了，蓝色保温杯，杯身贴了一张小猫贴纸，是我女朋友送的，对我很重要。',
    '二食堂一楼靠窗座位', '2026-11-17T12:10:00+08:00', 'OPEN', 2, [img('post-02-cup-blue')], '找到重谢',
    '2026-11-17T12:40:00+08:00'
  ]),
  buildPost('30000000-0000-4000-8000-000000000003', [
    'LOST', '白色无线耳机（AirPods Pro）', 0,
    '昨晚在操场夜跑时耳机盒从口袋滑落，白色耳机配浅蓝色保护壳。定位显示最后在操场看台附近。',
    '操场跑道旁', '2026-11-17T18:40:00+08:00', 'OPEN', 3, [img('post-03-earbuds')], null,
    '2026-11-17T19:05:00+08:00'
  ]),
  buildPost('30000000-0000-4000-8000-000000000004', [
    'FOUND', '捡到学生证一张（李雨桐）', 1,
    '今早在教学楼 A 区大厅捡到一张学生证，姓名李雨桐，信息学院。请失主看到后联系我核实身份领取。',
    '教学楼A区大厅', '2026-11-18T08:15:00+08:00', 'OPEN', 4, [img('post-04-student-card')], null,
    '2026-11-18T08:40:00+08:00'
  ]),
  buildPost('30000000-0000-4000-8000-000000000005', [
    'FOUND', '捡到一串钥匙（带玩偶挂件）', 3,
    '篮球场看台捡到一串钥匙，上面挂着一个绿色小恐龙玩偶，一共 4 把钥匙。暂存在我这里，请失主描述挂件特征认领。',
    '篮球场看台', '2026-11-18T09:05:00+08:00', 'OPEN', 1, [img('post-05-keys')], null,
    '2026-11-18T09:30:00+08:00'
  ]),
  buildPost('30000000-0000-4000-8000-000000000006', [
    'FOUND', '捡到黑色折叠雨伞', 3,
    '昨天傍晚在校门口快递站门口捡到一把黑色折叠伞，伞柄有轻微划痕。已有人认领处理中。',
    '校门口快递站', '2026-11-17T17:30:00+08:00', 'PROCESSING', 2, [img('post-06-umbrella')], null,
    '2026-11-17T18:00:00+08:00'
  ]),
  buildPost('30000000-0000-4000-8000-000000000007', [
    'LOST', '深灰色笔记本电脑包', 0,
    '昨天在图书馆一楼存包处附近丢失一个深灰色电脑包，内有笔记本电脑和学习资料，电脑里有课程作业，非常着急！',
    '图书馆一楼存包处', '2026-11-17T20:00:00+08:00', 'PROCESSING', 0, [img('post-07-laptop-bag')], '必有重谢',
    '2026-11-17T20:20:00+08:00'
  ]),
  buildPost('30000000-0000-4000-8000-000000000008', [
    'LOST', '高等数学教材（下册）', 2,
    '上周在三教 302 上课后忘拿了高数下册教材，封面写有我的名字。已经找回来了，谢谢提供线索的同学！',
    '三教302教室', '2026-11-16T10:00:00+08:00', 'RESOLVED', 3, [img('post-08-textbook')], null,
    '2026-11-16T10:30:00+08:00'
  ]),
  buildPost('30000000-0000-4000-8000-000000000009', [
    'FOUND', '捡到校园卡一张（王浩）', 1,
    '食堂二楼捡到一张校园卡，失主王浩。已经联系上失主并归还，感谢平台！',
    '食堂二楼', '2026-11-16T12:30:00+08:00', 'RESOLVED', 4, [img('post-09-card-wanghao')], null,
    '2026-11-16T13:00:00+08:00'
  ]),
  buildPost('30000000-0000-4000-8000-000000000010', [
    'LOST', '白色帆布鞋（39 码）', 4,
    '今天早上在体育馆更衣室换衣服时丢了一只白色帆布鞋（左脚，39 码），鞋面画了一朵小花。',
    '体育馆更衣室', '2026-11-18T07:50:00+08:00', 'OPEN', 0, [img('post-10-sneakers')], null,
    '2026-11-18T08:10:00+08:00'
  ]),
  buildPost('30000000-0000-4000-8000-000000000011', [
    'FOUND', '捡到灰色保温水杯', 3,
    '图书馆二楼饮水处捡到一个灰色保温杯，杯底有一道划痕。请失主描述细节后认领。',
    '图书馆二楼饮水处', '2026-11-18T10:20:00+08:00', 'OPEN', 0, [img('post-11-thermos-gray')], null,
    '2026-11-18T10:45:00+08:00'
  ]),
  buildPost('30000000-0000-4000-8000-000000000012', [
    'LOST', '手机（黑色手机壳带贴纸）', 0,
    '昨天下午在操场看台拍照后手机不见了，黑色手机壳，背面贴了一张卡通贴纸。手机里有重要聊天记录。',
    '操场看台', '2026-11-17T16:45:00+08:00', 'OPEN', 3, [img('post-12-phone')], null,
    '2026-11-17T17:10:00+08:00'
  ]),
  buildPost('30000000-0000-4000-8000-000000000013', [
    'FOUND', '捡到科学计算器', 2,
    '实验楼 B 栋 205 教室捡到一台科学计算器，屏幕一角有贴纸。请失主描述贴纸内容认领。',
    '实验楼B栋205', '2026-11-18T11:00:00+08:00', 'OPEN', 2, [img('post-13-calculator')], null,
    '2026-11-18T11:20:00+08:00'
  ]),
  buildPost('30000000-0000-4000-8000-000000000014', [
    'FOUND', '捡到羽毛球拍（单支）', 3,
    '体育馆羽毛球场捡到一支羽毛球拍，已无人认领，信息暂时关闭。',
    '体育馆羽毛球场', '2026-11-15T19:30:00+08:00', 'CLOSED', 1, [], null,
    '2026-11-15T20:00:00+08:00'
  ]),
  buildPost('30000000-0000-4000-8000-000000000015', [
    'FOUND', '捡到蓝色 U 盘（32G）', 0,
    '机房三楼 307 捡到一个蓝色 U 盘，32G，接口处有磨损。已有人申请认领，正在处理中。',
    '机房三楼307', '2026-11-18T09:40:00+08:00', 'PROCESSING', 0, [img('post-15-usb')], null,
    '2026-11-18T10:00:00+08:00'
  ])
]

function buildApplication(
  id: string,
  postIdx: number,
  applicationType: Application['applicationType'],
  applicantIdx: number,
  details: string,
  status: Application['status'],
  reviewNote: string | null,
  createdAt: string
): Application {
  return {
    id,
    postId: posts[postIdx].id,
    postTitle: posts[postIdx].title,
    applicationType,
    details,
    status,
    applicant: summaryOf(users[applicantIdx]),
    reviewNote,
    createdAt,
    updatedAt: createdAt
  }
}

/** 种子申请：覆盖 PENDING/ACCEPTED/REJECTED/COMPLETED 全状态 */
export const applications: Application[] = [
  // post7 我的寻物（电脑包）：收到 2 条待处理线索
  buildApplication('40000000-0000-4000-8000-000000000001', 6, 'CLUE', 1,
    '我昨天下午 4 点左右在图书馆一楼存包处旁边的长椅上见过一个深灰色电脑包，后来就没注意了，建议回去看看或者问一下管理员。',
    'PENDING', null, '2026-11-17T21:05:00+08:00'),
  buildApplication('40000000-0000-4000-8000-000000000002', 6, 'CLUE', 3,
    '我室友说昨晚看到有人把一个深灰色电脑包交到了图书馆服务台，你们可以去服务台问问。',
    'PENDING', null, '2026-11-17T22:12:00+08:00'),
  // post11 我的招领（水杯）：收到 1 条待处理认领
  buildApplication('40000000-0000-4000-8000-000000000003', 10, 'CLAIM', 4,
    '灰色保温杯是我的！杯底有一道划痕，是上周在实验室蹭的，杯盖内侧还贴着一张卡通小贴纸。请问怎么联系您领取？',
    'PENDING', null, '2026-11-18T11:10:00+08:00'),
  // post15 我的招领（U 盘）：已接受，待确认完成
  buildApplication('40000000-0000-4000-8000-000000000004', 14, 'CLAIM', 3,
    '蓝色 32G U 盘应该是我的，接口处有磨损，里面存的是我的课程设计和几张照片，可以核对内容。',
    'ACCEPTED', '已确认特征，请到 3 号楼 501 找我领取。', '2026-11-18T10:30:00+08:00'),
  // post12 小北的寻物（手机）：我提交的待处理线索
  buildApplication('40000000-0000-4000-8000-000000000005', 11, 'CLUE', 0,
    '我昨天下午 4 点半左右在操场看台附近看到有人捡起一部黑色手机，往体育馆方向走去了，建议去体育馆失物招领处问问。',
    'PENDING', null, '2026-11-17T17:50:00+08:00'),
  // post13 橙子学姐的招领（计算器）：我被拒绝的认领
  buildApplication('40000000-0000-4000-8000-000000000006', 12, 'CLAIM', 0,
    '我上周在实验楼 B 栋丢了一台科学计算器，屏幕右上角贴了一张小贴纸。',
    'REJECTED', '抱歉，你描述的计算器型号对不上，这个不是你的。', '2026-11-18T11:40:00+08:00'),
  // post6 橙子学姐的招领（雨伞）：我已被接受的认领
  buildApplication('40000000-0000-4000-8000-000000000007', 5, 'CLAIM', 0,
    '黑色折叠伞是我的，伞柄上有一道划痕，是上次雨天在校门口磕的。谢谢您！',
    'ACCEPTED', '好的，雨伞暂存在 4 号宿舍楼下宿管处，随时来取。', '2026-11-17T18:40:00+08:00'),
  // post2 橙子学姐的寻物（保温杯）：我提交的待处理线索
  buildApplication('40000000-0000-4000-8000-000000000008', 1, 'CLUE', 0,
    '我昨天中午在二食堂一楼靠窗的位置看到过一个蓝色保温杯，后来被清洁阿姨收走了，可以问问食堂保洁。',
    'PENDING', null, '2026-11-17T13:15:00+08:00'),
  // post8 小北的寻物（教材）：我已完成的历史线索
  buildApplication('40000000-0000-4000-8000-000000000009', 7, 'CLUE', 0,
    '我在三教 302 讲台下面的抽屉里看到过一本高数下册，可以去看看。',
    'COMPLETED', '谢谢你的线索，书已经找回来了！', '2026-11-16T11:00:00+08:00')
]
