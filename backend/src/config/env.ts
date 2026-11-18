import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { z } from 'zod';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
// 从 backend 根目录加载 .env（src/config 与 dist/config 均向上两级）。
dotenv.config({ path: path.resolve(currentDir, '../../.env'), quiet: true });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  API_PREFIX: z
    .string()
    .regex(/^\/[A-Za-z0-9/_-]*$/, 'API_PREFIX 必须是以 / 开头的路径')
    .default('/api/v1'),
  DATABASE_URL: z.string().min(1).default('mysql://root:change_me@127.0.0.1:3306/campus_lost_found'),
  JWT_SECRET: z.string().min(1).default('replace_with_at_least_32_random_characters'),
  JWT_EXPIRES_IN: z.string().min(1).default('2h'),
  CORS_ORIGIN: z.string().min(1).default('http://localhost:5173'),
  UPLOAD_DIR: z.string().min(1).default('uploads'),
  MAX_FILE_SIZE_MB: z.coerce.number().int().min(1).max(50).default(5),
  ADMIN_ACCOUNT: z.string().min(1).default('admin'),
  ADMIN_PASSWORD: z.string().min(1).default('change_this_before_seed'),
  DEMO_USER_PASSWORD: z.string().min(1).default('Passw0rd!'),
  PUBLIC_BASE_URL: z.string().url().default('http://localhost:3000'),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    throw new Error(`环境变量配置不合法，请检查 backend/.env：\n${details}`);
  }
  const env = parsed.data;
  if (env.NODE_ENV === 'production') {
    const insecure: string[] = [];
    if (env.JWT_SECRET.length < 32 || env.JWT_SECRET.includes('replace_with')) {
      insecure.push('JWT_SECRET 必须替换为至少 32 位随机字符串');
    }
    if (env.ADMIN_PASSWORD === 'change_this_before_seed') {
      insecure.push('ADMIN_PASSWORD 必须替换为独立安全值');
    }
    if (env.DATABASE_URL.includes('change_me')) {
      insecure.push('DATABASE_URL 必须替换为真实数据库凭据');
    }
    if (insecure.length > 0) {
      throw new Error(`生产环境禁止使用示例密钥：\n  - ${insecure.join('\n  - ')}`);
    }
  }
  return env;
}

export const env: Env = loadEnv();

export const corsOrigins: string[] = env.CORS_ORIGIN.split(',')
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);

export const uploadDirAbs: string = path.resolve(currentDir, '../..', env.UPLOAD_DIR);

export const publicBaseUrl: string = env.PUBLIC_BASE_URL.replace(/\/+$/, '');
