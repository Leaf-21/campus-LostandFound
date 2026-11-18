import { z } from 'zod';
import { paginationQuerySchema } from '../../common/pagination/pagination.js';

const applicationStatusEnum = z.enum(['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'COMPLETED']);

export const createApplicationSchema = z.object({
  details: z.string().trim().min(10, '申请说明需 10–500 字').max(500, '申请说明需 10–500 字'),
});

export const applicationIdParamSchema = z.object({
  applicationId: z.string().trim().min(1, '申请 ID 不能为空'),
});

export const postIdParamSchema = z.object({ postId: z.string().trim().min(1, '信息 ID 不能为空') });

/** 帖子收到的申请：status 可选过滤；不分页（与前端 mock 一致，docs K1） */
export const listPostApplicationsQuerySchema = z.object({
  status: applicationStatusEnum.optional(),
});

export const myApplicationsQuerySchema = z
  .object({
    role: z.enum(['SUBMITTED', 'RECEIVED']),
    status: applicationStatusEnum.optional(),
  })
  .merge(paginationQuerySchema);

export const decisionSchema = z.object({
  decision: z.enum(['ACCEPTED', 'REJECTED']),
  reviewNote: z.string().trim().max(200, '处理备注最多 200 字').optional(),
});
