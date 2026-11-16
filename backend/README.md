# 后端（成员 A）

校园失物招领平台后端：Node.js 26 LTS + Express 5 + TypeScript + Prisma + MySQL 8.4。

## 环境要求

- Node.js 26 LTS（仓库根 `.nvmrc` 固定为 `26`），npm 随 Node 安装。
- MySQL 8.4 LTS（11/18 接入数据模型后需要；当前骨架启动不依赖数据库）。

## 快速启动

```bash
cd backend
npm ci
cp .env.example .env   # Windows PowerShell: Copy-Item .env.example .env
npm run dev            # http://localhost:3000
```

验证健康检查：

```bash
curl http://localhost:3000/health
```

期望返回 `code=0`、`data.status="UP"` 的统一响应结构。

## 脚本

| 命令 | 说明 |
|---|---|
| `npm run dev` | tsx watch 开发启动（改代码自动重启） |
| `npm run build` | TypeScript 编译到 `dist/` |
| `npm run start` | 运行编译产物（生产/部署用，先 build） |
| `npm run typecheck` | 严格模式类型检查 |
| `npm run lint` | ESLint 检查 |
| `npm test` | Vitest 单元/接口测试 |
| `npm run prisma:generate` | 生成 Prisma Client |
| `npm run prisma:migrate` | 开发环境迁移（11/18 起可用） |
| `npm run prisma:deploy` | 生产环境迁移 |
| `npm run prisma:seed` | Seed（当前为占位，11/18 实现） |

提交前必须通过：`npm run lint && npm run typecheck && npm test && npm run build`。

## 目录结构

```text
backend/
├── prisma/
│   ├── schema.prisma      # 数据模型（11/18 按 docs/04 补全）
│   └── seed.ts            # Seed 占位（11/18 实现）
├── src/
│   ├── config/            # 环境变量（Zod 校验）、PrismaClient
│   ├── common/
│   │   ├── response/      # 统一 { code, message, data, requestId }
│   │   ├── exception/     # AppError、业务错误码
│   │   └── pagination/    # page/pageSize 与 PageResult
│   ├── middleware/        # requestId、CORS 之外的通用中间件、错误处理、Zod 校验
│   ├── modules/           # health + auth/users/categories/posts/applications/files/admin（按排期实现）
│   ├── utils/
│   ├── app.ts             # Express 组装（可测试）
│   └── server.ts          # 监听与优雅退出
├── test/                  # Vitest + supertest
└── uploads/               # 本地图片目录，真实文件不提交
```

## 约定

- 所有业务接口挂载在 `/api/v1`；健康检查在 `/health`；图片静态资源在 `/uploads`。
- 接口契约以 `docs/05_API接口规范文档.md` 与 `api/openapi.yaml` 为准，字段/枚举不得私自变更。
- 错误统一走全局中间件映射；业务异常抛 `AppError`，参数校验用 Zod + `validate` 中间件。
- `.env` 不提交；生产启动会拒绝示例 JWT_SECRET / 管理员密码 / 数据库密码。
