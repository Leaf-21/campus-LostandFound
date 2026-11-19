import { z } from 'zod';

/**
 * 资料编辑白名单（docs/05 §6）：只允许改昵称/头像/电话/邮箱。
 * account、role、passwordHash 不在 schema 中，即使传入也会被 Zod 剥离。
 */
export const updateMeSchema = z
  .object({
    nickname: z.string().trim().min(1, '昵称不能为空').max(20, '昵称最多 20 个字').optional(),
    avatarUrl: z.string().trim().url('头像地址格式不正确').max(500).nullable().optional(),
    phone: z.string().trim().max(30, '电话最多 30 位').nullable().optional(),
    email: z.string().trim().email('邮箱格式不正确').max(120).nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: '至少需要提供一个要修改的字段' });

export type UpdateMeInput = z.infer<typeof updateMeSchema>;
