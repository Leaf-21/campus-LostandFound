import { z } from 'zod';

export const registerSchema = z.object({
  account: z
    .string()
    .trim()
    .min(4, '账号长度需 4–30 位')
    .max(30, '账号长度需 4–30 位')
    .regex(/^[A-Za-z0-9_]+$/, '账号只能包含字母、数字和下划线'),
  password: z.string().min(8, '密码长度需 8–32 位').max(32, '密码长度需 8–32 位'),
  nickname: z.string().trim().min(1, '昵称不能为空').max(20, '昵称最多 20 个字'),
  email: z.string().trim().email('邮箱格式不正确').max(120).optional(),
});

export const loginSchema = z.object({
  account: z.string().trim().min(1, '请输入账号'),
  password: z.string().min(1, '请输入密码'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
