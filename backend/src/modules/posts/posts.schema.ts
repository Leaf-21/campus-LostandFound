import { z } from 'zod';
import { paginationQuerySchema } from '../../common/pagination/pagination.js';

const postTypeEnum = z.enum(['LOST', 'FOUND']);
const postStatusEnum = z.enum(['OPEN', 'PROCESSING', 'RESOLVED', 'CLOSED', 'HIDDEN']);

export const listPostsQuerySchema = z
  .object({
    postType: postTypeEnum.optional(),
    keyword: z.string().trim().max(100).optional(),
    categoryId: z.string().trim().max(36).optional(),
    location: z.string().trim().max(100).optional(),
    status: postStatusEnum.optional(),
    sort: z.enum(['LATEST', 'OLDEST']).default('LATEST'),
  })
  .merge(paginationQuerySchema);

const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/;

export const createPostSchema = z.object({
  postType: postTypeEnum,
  title: z.string().trim().min(2, '标题需 2–50 字').max(50, '标题需 2–50 字'),
  description: z.string().trim().min(10, '描述需 10–1000 字').max(1000, '描述需 10–1000 字'),
  categoryId: z.string().trim().min(1, '请选择分类'),
  images: z.array(z.string().trim().min(1)).max(5, '最多上传 5 张图片').optional(),
  location: z.string().trim().min(2, '地点需 2–100 字').max(100, '地点需 2–100 字'),
  occurredAt: z.string().regex(ISO_DATETIME, '发生时间格式不正确'),
  reward: z.string().trim().max(100, '酬谢说明最多 100 字').nullish(),
});

export const updatePostSchema = z
  .object({
    title: z.string().trim().min(2, '标题需 2–50 字').max(50, '标题需 2–50 字').optional(),
    description: z.string().trim().min(10, '描述需 10–1000 字').max(1000, '描述需 10–1000 字').optional(),
    categoryId: z.string().trim().min(1).optional(),
    images: z.array(z.string().trim().min(1)).max(5, '最多上传 5 张图片').optional(),
    location: z.string().trim().min(2, '地点需 2–100 字').max(100, '地点需 2–100 字').optional(),
    occurredAt: z.string().regex(ISO_DATETIME, '发生时间格式不正确').optional(),
    reward: z.string().trim().max(100, '酬谢说明最多 100 字').nullish(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: '至少需要提供一个要修改的字段' });

export const myPostsQuerySchema = z
  .object({
    postType: postTypeEnum.optional(),
    status: postStatusEnum.optional(),
  })
  .merge(paginationQuerySchema);

export const postIdParamSchema = z.object({ postId: z.string().trim().min(1, '信息 ID 不能为空') });

export type ListPostsQuery = z.infer<typeof listPostsQuerySchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type MyPostsQuery = z.infer<typeof myPostsQuerySchema>;
