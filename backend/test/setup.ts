// 测试环境：使用独立测试库，避免污染开发数据
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'mysql://root@127.0.0.1:3307/campus_lost_found_test';
process.env.JWT_SECRET = 'test_jwt_secret_at_least_32_characters_long_ok';
process.env.PORT = '3101';
process.env.CORS_ORIGIN = 'http://localhost:5173';
process.env.ADMIN_ACCOUNT = 'admin';
process.env.ADMIN_PASSWORD = 'Admin@2026';
process.env.DEMO_USER_PASSWORD = 'Passw0rd!';
process.env.PUBLIC_BASE_URL = 'http://localhost:3000';

// 确保测试库结构最新（幂等）
execSync('npx prisma migrate deploy', { cwd: root, stdio: 'ignore', env: process.env });
