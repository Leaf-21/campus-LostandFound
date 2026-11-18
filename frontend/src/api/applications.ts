import { http } from './http'
import {
  mockCancelApplication,
  mockCompleteApplication,
  mockCreateApplication,
  mockDecideApplication,
  mockGetMyApplications,
  mockGetPostApplications,
  useMock
} from '@/mock'
import type { Application, ApplicationQuery, DecisionInput, PageResult } from '@/types'

/** 提交认领/线索申请（服务端按 Post.postType 自动设置申请类型） */
export function createApplication(postId: string, body: { details: string }): Promise<Application> {
  if (useMock()) return mockCreateApplication(postId, body)
  return http.post<Application>(`/posts/${postId}/applications`, body)
}

/** 发布者查看某条信息收到的申请（不分页，待处理优先） */
export function getPostApplications(postId: string): Promise<Application[]> {
  if (useMock()) return mockGetPostApplications(postId)
  return http.get<Application[]>(`/posts/${postId}/applications`)
}

/** 我提交的申请 / 我收到的申请 */
export function getMyApplications(query: ApplicationQuery): Promise<PageResult<Application>> {
  if (useMock()) return mockGetMyApplications(query)
  return http.get<PageResult<Application>>('/users/me/applications', { params: query })
}

/** 发布者接受或拒绝申请 */
export function decideApplication(id: string, input: DecisionInput): Promise<Application> {
  if (useMock()) return mockDecideApplication(id, input)
  return http.post<Application>(`/applications/${id}/decision`, input)
}

/** 发布者确认交接完成 */
export function completeApplication(id: string): Promise<Application> {
  if (useMock()) return mockCompleteApplication(id)
  return http.post<Application>(`/applications/${id}/complete`)
}

/** 撤回本人待处理申请（P1） */
export function cancelApplication(id: string): Promise<Application> {
  if (useMock()) return mockCancelApplication(id)
  return http.post<Application>(`/applications/${id}/cancel`)
}
