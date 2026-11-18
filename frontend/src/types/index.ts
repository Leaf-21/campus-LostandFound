/**
 * 与 docs/05_API接口规范文档.md 保持一致的数据类型定义。
 * 所有字段、枚举值均以 API 契约为唯一依据，不得臆造。
 */

/** 统一响应结构 */
export interface ApiResponse<T> {
  code: number
  message: string
  data: T
  requestId: string
}

/** 分页结果 */
export interface PageResult<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

/** 信息类型：寻物 / 招领 */
export type PostType = 'LOST' | 'FOUND'

/** 信息状态 */
export type PostStatus = 'OPEN' | 'PROCESSING' | 'RESOLVED' | 'CLOSED' | 'HIDDEN'

/** 申请类型：认领 / 线索 */
export type ApplicationType = 'CLAIM' | 'CLUE'

/** 申请状态 */
export type ApplicationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED'

/** 排序方式 */
export type SortOrder = 'LATEST' | 'OLDEST'

/** 用户角色 */
export type UserRole = 'USER' | 'ADMIN'

/** 我的申请列表口径：我提交的 / 我收到的 */
export type ApplicationListRole = 'SUBMITTED' | 'RECEIVED'

/** 申请处理决定 */
export type Decision = 'ACCEPTED' | 'REJECTED'

/** 用户（本人可见完整信息） */
export interface User {
  id: string
  account: string
  nickname: string
  avatarUrl: string | null
  phone?: string | null
  email?: string | null
  role: UserRole
  createdAt?: string
}

/** 用户公开摘要（列表、详情中出现的发布者/申请人信息） */
export interface UserSummary {
  id: string
  nickname: string
  avatarUrl: string | null
}

/** 物品分类 */
export interface Category {
  id: string
  name: string
  sort: number
}

/** 失物/招领信息 */
export interface Post {
  id: string
  postType: PostType
  title: string
  description: string
  categoryId: string
  categoryName: string
  images: string[]
  location: string
  occurredAt: string
  reward: string | null
  status: PostStatus
  publisher: UserSummary
  applicationCount: number
  createdAt: string
  updatedAt: string
}

/** 信息详情（登录时附加当前用户与该信息的关系） */
export interface PostDetail extends Post {
  currentUserRelation?: {
    isPublisher: boolean
    myApplicationStatus: ApplicationStatus | null
  } | null
}

/** 申请 */
export interface Application {
  id: string
  postId: string
  postTitle: string
  applicationType: ApplicationType
  details: string
  status: ApplicationStatus
  applicant: UserSummary
  reviewNote: string | null
  createdAt: string
  updatedAt: string
}

/* ---------- 请求体 ---------- */

export interface LoginInput {
  account: string
  password: string
}

export interface LoginResult {
  accessToken: string
  tokenType: string
  expiresIn: number
  user: User
}

export interface RegisterInput {
  account: string
  password: string
  nickname: string
  email?: string
}

export interface RegisterResult {
  id: string
  account: string
  nickname: string
  role: UserRole
}

export interface FileInfo {
  fileId: string
  url: string
  fileName: string
  size: number
  contentType: string
}

export interface PostCreateInput {
  postType: PostType
  title: string
  description: string
  categoryId: string
  images?: string[]
  location: string
  occurredAt: string
  reward?: string | null
}

export interface PostUpdateInput {
  title?: string
  description?: string
  categoryId?: string
  images?: string[]
  location?: string
  occurredAt?: string
  reward?: string | null
}

/** 信息列表查询参数 */
export interface PostQuery {
  postType?: PostType
  keyword?: string
  categoryId?: string
  location?: string
  status?: PostStatus
  sort?: SortOrder
  page?: number
  pageSize?: number
}

export interface ApplicationQuery {
  role: ApplicationListRole
  status?: ApplicationStatus
  page?: number
  pageSize?: number
}

export interface DecisionInput {
  decision: Decision
  reviewNote?: string
}
