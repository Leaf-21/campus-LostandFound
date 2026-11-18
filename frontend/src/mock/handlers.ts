import { ApiError, tokenStore } from '@/api/http'
import type {
  Application,
  ApplicationQuery,
  Category,
  DecisionInput,
  FileInfo,
  LoginInput,
  LoginResult,
  PageResult,
  Post,
  PostCreateInput,
  PostDetail,
  PostQuery,
  PostUpdateInput,
  RegisterInput,
  RegisterResult,
  User
} from '@/types'
import {
  applications,
  categories,
  getCurrentMockUser,
  posts,
  setCurrentUserId,
  summaryOf,
  users,
  type MockUser
} from './db'
import { delay, mockId, nowIso, paginate, requireAuth } from './helpers'

/* ---------- 内部工具 ---------- */

/** 申请数量随数据实时计算 */
function withCount(post: Post): Post {
  return { ...post, applicationCount: applications.filter((a) => a.postId === post.id).length }
}

/** 当前登录用户；token 存在但内存态丢失（页面刷新）时回落演示账号 */
function current(): MockUser {
  requireAuth()
  return getCurrentMockUser() ?? users[0]
}

function toPublicUser(u: MockUser): User {
  return {
    id: u.id,
    account: u.account,
    nickname: u.nickname,
    avatarUrl: u.avatarUrl,
    phone: u.phone ?? null,
    email: u.email ?? null,
    role: u.role,
    createdAt: u.createdAt
  }
}

function findPost(id: string): Post {
  const post = posts.find((p) => p.id === id)
  if (!post) throw new ApiError('信息不存在或已被删除', 404, 40401)
  return post
}

function findApplication(id: string): Application {
  const app = applications.find((a) => a.id === id)
  if (!app) throw new ApiError('申请不存在或已被删除', 404, 40401)
  return app
}

function touch(app: Application) {
  app.updatedAt = nowIso()
}

/* ---------- 认证 ---------- */

export async function mockRegister(payload: RegisterInput): Promise<RegisterResult> {
  await delay()
  if (users.some((u) => u.account === payload.account)) {
    throw new ApiError('该账号已被注册，换一个试试', 409, 40904)
  }
  const user: MockUser = {
    id: mockId('usr-'),
    account: payload.account,
    password: payload.password,
    nickname: payload.nickname,
    avatarUrl: null,
    phone: null,
    email: payload.email ?? null,
    role: 'USER',
    createdAt: nowIso()
  }
  users.push(user)
  return { id: user.id, account: user.account, nickname: user.nickname, role: user.role }
}

export async function mockLogin(payload: LoginInput): Promise<LoginResult> {
  await delay()
  const user = users.find((u) => u.account === payload.account && u.password === payload.password)
  if (!user) {
    // 与契约一致：不区分账号还是密码错误
    throw new ApiError('账号或密码错误', 401, 40101)
  }
  setCurrentUserId(user.id)
  tokenStore.set('mock-token')
  return { accessToken: 'mock-token', tokenType: 'Bearer', expiresIn: 7200, user: toPublicUser(user) }
}

export async function mockGetMe(): Promise<User> {
  await delay()
  return toPublicUser(current())
}

/* ---------- 分类与文件 ---------- */

export async function mockGetCategories(): Promise<Category[]> {
  await delay()
  return [...categories]
}

export async function mockUploadFile(file: File): Promise<FileInfo> {
  await delay()
  return {
    fileId: mockId('file-'),
    url: URL.createObjectURL(file),
    fileName: file.name,
    size: file.size,
    contentType: file.type || 'image/png'
  }
}

/* ---------- 信息 ---------- */

export async function mockGetPosts(query: PostQuery = {}): Promise<PageResult<Post>> {
  await delay()
  let list = posts.map(withCount)
  if (query.postType) list = list.filter((p) => p.postType === query.postType)
  if (query.status) {
    list = list.filter((p) => p.status === query.status)
  } else {
    // 默认信息广场只展示 OPEN 与 PROCESSING（docs/05）
    list = list.filter((p) => p.status === 'OPEN' || p.status === 'PROCESSING')
  }
  if (query.categoryId) list = list.filter((p) => p.categoryId === query.categoryId)
  if (query.keyword) {
    const k = query.keyword.toLowerCase()
    list = list.filter(
      (p) =>
        p.title.toLowerCase().includes(k) ||
        p.description.toLowerCase().includes(k) ||
        p.location.toLowerCase().includes(k)
    )
  }
  if (query.location) {
    const l = query.location.toLowerCase()
    list = list.filter((p) => p.location.toLowerCase().includes(l))
  }
  list = [...list].sort((a, b) =>
    query.sort === 'OLDEST' ? a.createdAt.localeCompare(b.createdAt) : b.createdAt.localeCompare(a.createdAt)
  )
  return paginate(list, query.page ?? 1, query.pageSize ?? 12)
}

export async function mockGetPostDetail(id: string): Promise<PostDetail> {
  await delay()
  const post = withCount(findPost(id))
  const detail: PostDetail = { ...post, currentUserRelation: null }
  if (tokenStore.get()) {
    const me = current()
    // 取该用户最新一条申请（重复提交时旧的 REJECTED 不应覆盖新的 PENDING 状态展示）
    const mine = applications
      .filter((a) => a.postId === id && a.applicant.id === me.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    const myApp = mine[0]
    detail.currentUserRelation = {
      isPublisher: post.publisher.id === me.id,
      myApplicationStatus: myApp?.status ?? null
    }
  }
  return detail
}

export async function mockCreatePost(input: PostCreateInput): Promise<Post> {
  await delay()
  const me = current()
  const cat = categories.find((c) => c.id === input.categoryId)
  const now = nowIso()
  const post: Post = {
    id: mockId('post-'),
    postType: input.postType,
    title: input.title,
    description: input.description,
    categoryId: input.categoryId,
    categoryName: cat?.name ?? '其他',
    images: input.images ?? [],
    location: input.location,
    occurredAt: input.occurredAt,
    reward: input.reward ?? null,
    status: 'OPEN',
    publisher: summaryOf(me),
    applicationCount: 0,
    createdAt: now,
    updatedAt: now
  }
  posts.unshift(post)
  return withCount(post)
}

export async function mockUpdatePost(id: string, input: PostUpdateInput): Promise<Post> {
  await delay()
  const me = current()
  const post = findPost(id)
  if (post.publisher.id !== me.id) {
    throw new ApiError('只能编辑本人发布的信息', 403, 40301)
  }
  if (post.status !== 'OPEN') {
    throw new ApiError('仅「正在寻找 / 等待认领」状态的信息可以编辑', 409, 40901)
  }
  const patch: Partial<Post> = {}
  ;(Object.keys(input) as (keyof PostUpdateInput)[]).forEach((key) => {
    const value = input[key]
    if (value !== undefined) (patch as Record<string, unknown>)[key] = value
  })
  Object.assign(post, patch, { updatedAt: nowIso() })
  return withCount(post)
}

export async function mockGetMyPosts(
  query: { status?: Post['status']; page?: number; pageSize?: number } = {}
): Promise<PageResult<Post>> {
  await delay()
  const me = current()
  let list = posts.filter((p) => p.publisher.id === me.id)
  if (query.status) list = list.filter((p) => p.status === query.status)
  list = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return paginate(list.map(withCount), query.page ?? 1, query.pageSize ?? 12)
}

/* ---------- 申请 ---------- */

export async function mockGetPostApplications(postId: string): Promise<Application[]> {
  await delay()
  const me = current()
  const post = findPost(postId)
  if (post.publisher.id !== me.id) {
    throw new ApiError('只有发布者可以查看收到的申请', 403, 40301)
  }
  const list = applications.filter((a) => a.postId === postId)
  // 待处理优先
  return [...list].sort((a, b) => {
    const ra = a.status === 'PENDING' ? 0 : 1
    const rb = b.status === 'PENDING' ? 0 : 1
    return ra !== rb ? ra - rb : b.createdAt.localeCompare(a.createdAt)
  })
}

export async function mockCreateApplication(
  postId: string,
  body: { details: string }
): Promise<Application> {
  await delay()
  const me = current()
  const post = findPost(postId)
  if (post.publisher.id === me.id) {
    throw new ApiError('不能对自己发布的信息提交申请', 403, 40301)
  }
  if (post.status !== 'OPEN') {
    throw new ApiError('当前状态不允许提交申请', 409, 40901)
  }
  const exists = applications.some(
    (a) => a.postId === postId && a.applicant.id === me.id && (a.status === 'PENDING' || a.status === 'ACCEPTED')
  )
  if (exists) {
    throw new ApiError('您已经提交过申请，请等待发布者处理', 409, 40902)
  }
  const now = nowIso()
  const app: Application = {
    id: mockId('app-'),
    postId: post.id,
    postTitle: post.title,
    applicationType: post.postType === 'FOUND' ? 'CLAIM' : 'CLUE',
    details: body.details,
    status: 'PENDING',
    applicant: summaryOf(me),
    reviewNote: null,
    createdAt: now,
    updatedAt: now
  }
  applications.push(app)
  return app
}

export async function mockGetMyApplications(query: ApplicationQuery): Promise<PageResult<Application>> {
  await delay()
  const me = current()
  let list =
    query.role === 'SUBMITTED'
      ? applications.filter((a) => a.applicant.id === me.id)
      : applications.filter((a) => posts.find((p) => p.id === a.postId)?.publisher.id === me.id)
  if (query.status) list = list.filter((a) => a.status === query.status)
  list = [...list].sort((a, b) => {
    if (query.role === 'RECEIVED') {
      const ra = a.status === 'PENDING' ? 0 : 1
      const rb = b.status === 'PENDING' ? 0 : 1
      if (ra !== rb) return ra - rb
    }
    return b.createdAt.localeCompare(a.createdAt)
  })
  return paginate(list, query.page ?? 1, query.pageSize ?? 12)
}

export async function mockDecideApplication(id: string, input: DecisionInput): Promise<Application> {
  await delay()
  const me = current()
  const app = findApplication(id)
  const post = findPost(app.postId)
  if (post.publisher.id !== me.id) {
    throw new ApiError('只有发布者可以处理申请', 403, 40301)
  }
  if (app.status !== 'PENDING') {
    throw new ApiError('该申请已处理，请刷新后查看', 409, 40901)
  }
  if (input.decision === 'ACCEPTED') {
    app.status = 'ACCEPTED'
    post.status = 'PROCESSING'
    // 其余待处理申请自动拒绝（docs/05 业务规则）
    applications.forEach((other) => {
      if (other.postId === app.postId && other.id !== app.id && other.status === 'PENDING') {
        other.status = 'REJECTED'
        other.reviewNote = '该信息已由其他申请处理'
        touch(other)
      }
    })
  } else {
    app.status = 'REJECTED'
  }
  app.reviewNote = input.reviewNote || null
  touch(app)
  post.updatedAt = nowIso()
  return { ...app }
}

export async function mockCompleteApplication(id: string): Promise<Application> {
  await delay()
  const me = current()
  const app = findApplication(id)
  const post = findPost(app.postId)
  if (post.publisher.id !== me.id) {
    throw new ApiError('只有发布者可以确认完成', 403, 40301)
  }
  if (app.status !== 'ACCEPTED') {
    throw new ApiError('只有已接受的申请可以确认完成', 409, 40901)
  }
  app.status = 'COMPLETED'
  post.status = 'RESOLVED'
  touch(app)
  post.updatedAt = nowIso()
  return { ...app }
}

export async function mockCancelApplication(id: string): Promise<Application> {
  await delay()
  const me = current()
  const app = findApplication(id)
  if (app.applicant.id !== me.id) {
    throw new ApiError('只能撤回本人提交的申请', 403, 40301)
  }
  if (app.status !== 'PENDING') {
    throw new ApiError('仅待处理的申请可以撤回', 409, 40901)
  }
  app.status = 'CANCELLED'
  touch(app)
  return { ...app }
}
