import { http } from './http'
import { mockCreatePost, mockGetMyPosts, mockGetPostDetail, mockGetPosts, mockUpdatePost, useMock } from '@/mock'
import type { PageResult, Post, PostCreateInput, PostDetail, PostQuery, PostStatus, PostUpdateInput } from '@/types'

/** 信息广场：搜索、筛选、分页（公开） */
export function getPosts(query: PostQuery = {}): Promise<PageResult<Post>> {
  if (useMock()) return mockGetPosts(query)
  return http.get<PageResult<Post>>('/posts', { params: query })
}

/** 信息详情（公开，登录时附带当前用户关系） */
export function getPostDetail(id: string): Promise<PostDetail> {
  if (useMock()) return mockGetPostDetail(id)
  return http.get<PostDetail>(`/posts/${id}`)
}

/** 发布寻物/招领信息 */
export function createPost(input: PostCreateInput): Promise<Post> {
  if (useMock()) return mockCreatePost(input)
  return http.post<Post>('/posts', input)
}

/** 编辑本人 OPEN 状态的信息 */
export function updatePost(id: string, input: PostUpdateInput): Promise<Post> {
  if (useMock()) return mockUpdatePost(id, input)
  return http.patch<Post>(`/posts/${id}`, input)
}

/** 我的发布 */
export function getMyPosts(
  query: { status?: PostStatus; page?: number; pageSize?: number } = {}
): Promise<PageResult<Post>> {
  if (useMock()) return mockGetMyPosts(query)
  return http.get<PageResult<Post>>('/users/me/posts', { params: query })
}
