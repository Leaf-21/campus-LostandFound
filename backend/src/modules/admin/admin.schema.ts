import { z } from 'zod';
import { paginationQuerySchema } from '../../common/pagination/pagination.js';

const postTypeEnum = z.enum(['LOST', 'FOUND']);
// 管理员可取任意状态，含 HIDDEN（与公开列表不同，docs/05 §10.1）
const postStatusEnum = z.enum(['OPEN', 'PROCESSING', 'RESOLVED', 'CLOSED', 'HIDDEN']);

export const listAdminPostsQuerySchema = z
  .object({
    keyword: z.string().trim().max(100).optional(),
    postType: postTypeEnum.optional(),
    status: postStatusEnum.optional(),
  })
  .merge(paginationQuerySchema);

export const hidePostSchema = z.object({
  reason: z.string().trim().max(200, '隐藏原因最多 200 字').optional(),
});

export const restorePostSchema = z.object({
  reason: z.string().trim().max(200, '恢复原因最多 200 字').optional(),
});

export const adminPostIdParamSchema = z.object({
  postId: z.string().trim().min(1, '信息 ID 不能为空'),
});

export type ListAdminPostsQuery = z.infer<typeof listAdminPostsQuerySchema>;
