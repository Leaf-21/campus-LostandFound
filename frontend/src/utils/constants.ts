import type { ApplicationStatus, ApplicationType, PostStatus, PostType } from '@/types'

/** 信息类型中文（完整） */
export const POST_TYPE_LABEL: Record<PostType, string> = {
  LOST: '寻物启事',
  FOUND: '失物招领'
}

/** 信息类型中文（短，用于标签） */
export const POST_TYPE_SHORT: Record<PostType, string> = {
  LOST: '寻物',
  FOUND: '招领'
}

/** 信息状态中文（随信息类型变化语义） */
export function postStatusLabel(status: PostStatus, postType?: PostType): string {
  switch (status) {
    case 'OPEN':
      return postType === 'FOUND' ? '等待认领' : '正在寻找'
    case 'PROCESSING':
      return '处理中'
    case 'RESOLVED':
      return postType === 'FOUND' ? '已归还' : '已找回'
    case 'CLOSED':
      return '已关闭'
    case 'HIDDEN':
      return '已隐藏'
  }
}

/** 申请类型中文 */
export const APPLICATION_TYPE_LABEL: Record<ApplicationType, string> = {
  CLAIM: '认领申请',
  CLUE: '线索提供'
}

/** 申请状态中文 */
export const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
  PENDING: '待处理',
  ACCEPTED: '已接受',
  REJECTED: '已拒绝',
  CANCELLED: '已撤回',
  COMPLETED: '已完成'
}

/** 状态配色（颜色仅作辅助，均配合文字标签使用） */
export const STATUS_COLOR: Record<string, string> = {
  OPEN: 'var(--color-primary)',
  PROCESSING: 'var(--color-warning)',
  RESOLVED: 'var(--color-success)',
  CLOSED: 'var(--color-text-secondary)',
  HIDDEN: 'var(--color-danger)',
  PENDING: 'var(--color-accent)',
  ACCEPTED: 'var(--color-success)',
  REJECTED: 'var(--color-danger)',
  CANCELLED: 'var(--color-text-secondary)',
  COMPLETED: 'var(--color-info)'
}

/** 类型配色 */
export const POST_TYPE_COLOR: Record<PostType, string> = {
  LOST: 'var(--color-primary)',
  FOUND: 'var(--color-accent)'
}

/** 信息状态在不可申请时的解释文案 */
export function postStatusExplanation(status: PostStatus, postType?: PostType): string {
  switch (status) {
    case 'PROCESSING':
      return '该信息已有申请被发布者确认，正在处理中，暂时不能提交新的申请。'
    case 'RESOLVED':
      return postType === 'FOUND'
        ? '该物品已完成归还，感谢大家的关注。'
        : '该物品已找回，感谢大家的关注。'
    case 'CLOSED':
      return '发布者已关闭该信息，如有疑问可联系发布者。'
    case 'HIDDEN':
      return '该信息已被管理员隐藏。'
    default:
      return ''
  }
}

/** 各状态对应的中文短标签（用于 Chip 等） */
export const SORT_LABEL: Record<string, string> = {
  LATEST: '最新发布',
  OLDEST: '最早发布'
}
