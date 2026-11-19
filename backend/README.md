# 后端（成员 A）

校园失物招领平台后端：Node.js 26 LTS + Express 5 + TypeScript + Prisma + MySQL 8.4。

## 环境要求

- Node.js 26 LTS（仓库根 `.nvmrc` 固定为 `26`），npm 随 Node 安装。
- MySQL 8.x（本机 8.2 / 文档指定 8.4 LTS 均可）。

> **本项目使用 3307 端口的独立 MySQL 实例**（数据目录 `D:\dsh_project\.tools\mysqldata-lf`），
> 与系统默认 3306 实例并存、互不影响。该实例**不设开机自启**，每次开发前手动启动：
>
> ```powershell
> powershell -ExecutionPolicy Bypass -File D:\dsh_project\.tools\start-mysql-lf.ps1
> ```

## 快速启动

```bash
cd backend
npm ci
cp .env.example .env   # Windows PowerShell: Copy-Item .env.example .env
# .env.example 默认已指向 3307；按需改 JWT_SECRET、ADMIN_PASSWORD
npm run prisma:generate
npx prisma migrate deploy   # 或 npm run prisma:migrate（开发态）
npm run prisma:seed         # 6 分类 + 管理员 + 5 演示用户 + 15 帖 + 9 申请
npm run dev                 # http://localhost:3000
```

首次初始化数据库（若库不存在）：

```bash
mysql -uroot -P3307 -h127.0.0.1 -e "CREATE DATABASE IF NOT EXISTS campus_lost_found CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; CREATE DATABASE IF NOT EXISTS campus_lost_found_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

验证：

```bash
curl http://localhost:3000/health          # {"code":0,..."status":"UP"}
curl http://localhost:3000/api/v1/posts    # 信息广场（默认 OPEN + PROCESSING）
```

**演示账号**（密码取 `.env` 的 `DEMO_USER_PASSWORD`，默认 `Passw0rd!`）：

| 账号 | 昵称 | 用途 |
|---|---|---|
| `student2026` | 小林 | 主演示账号（有发布、有收到的申请、有待处理线索） |
| `azhe2026` | 阿哲 | 第二演示账号（用于「B 申请 A 的帖子」） |
| `orange2026` / `xiaobei2026` / `anan2026` | 橙子学姐 / 小北 / 安安 | 数据集丰富度 |
| `admin` | 平台管理员 | 密码取 `ADMIN_PASSWORD`；可访问 `/api/v1/admin/*` |

## 已实现接口（P0 全量 + P1 管理员）

| 模块 | 接口 |
|---|---|
| 健康检查 | `GET /health` |
| 认证 | `POST /api/v1/auth/register`、`POST /api/v1/auth/login`、`GET /api/v1/auth/me` |
| 资料 | `PATCH /api/v1/users/me`（昵称/头像/电话/邮箱；account、role 不可改） |
| 分类 | `GET /api/v1/categories` |
| 信息 | `GET /api/v1/posts`（搜索/筛选/排序/分页）、`GET /api/v1/posts/{id}`、`POST /api/v1/posts`、`PATCH /api/v1/posts/{id}`、`POST /api/v1/posts/{id}/close`（P1） |
| 我的发布 | `GET /api/v1/users/me/posts` |
| 上传 | `POST /api/v1/files`（JPG/PNG/WEBP，≤5MB） |
| 申请 | `POST /api/v1/posts/{id}/applications`、`GET /api/v1/posts/{id}/applications`、`GET /api/v1/users/me/applications`、`GET /api/v1/applications/{id}` |
| 申请处理 | `POST /api/v1/applications/{id}/decision`、`POST /api/v1/applications/{id}/complete`、`POST /api/v1/applications/{id}/cancel`（P1） |
| **管理（P1）** | `GET /api/v1/admin/posts`（含 HIDDEN）、`POST /api/v1/admin/posts/{id}/hide`、`POST /api/v1/admin/posts/{id}/restore`、`GET /api/v1/admin/posts/{id}/actions` |

> 管理员接口全部要求 `ADMIN` 角色；普通用户访问返回 403/40301，未登录 401/40101。
> 隐藏信息会保存原状态到 `posts.previous_status`，恢复时精确还原（RESOLVED 帖不会变成 OPEN），并写入 `admin_actions` 审计日志。
> 前端管理页面未实现（docs/09 §6 列为可砍 P1），接口可直接用 REST 客户端调用。

## 前端联调

前端 `frontend/.env`：

```ini
VITE_USE_MOCK=false
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

页面代码无需改动（docs/06：Mock 与真实分支只在 API service 层）。CORS 已按 `CORS_ORIGIN` 放行 `http://localhost:5173`。

## 脚本

| 命令 | 说明 |
|---|---|
| `npm run dev` | tsx watch 开发启动 |
| `npm run build` / `npm run start` | 编译到 `dist/` 并以产物运行 |
| `npm run typecheck` / `npm run lint` | 类型检查 / ESLint |
| `npm test` | Vitest + supertest 集成测试（**103 个用例**，使用独立测试库） |
| `npm run prisma:generate` | 生成 Prisma Client |
| `npm run prisma:migrate` / `prisma:deploy` | 开发迁移 / 生产迁移 |
| `npm run prisma:seed` | 写入演示数据（幂等 upsert，可重复执行） |

提交前必须通过：`npm run lint && npm run typecheck && npm test && npm run build`。

## 测试

```bash
# 1) 准备测试库（只需一次，3307 实例）
mysql -uroot -P3307 -h127.0.0.1 -e "CREATE DATABASE IF NOT EXISTS campus_lost_found_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
# 2) 在 .env 里配置 TEST_DATABASE_URL 指向测试库（.env.example 已给出 3307 示例）
# 3) 运行
npm test
```

测试会自行执行 `prisma migrate deploy`，每个文件前清表，互不干扰。

当前测试分布：

| 文件 | 用例数 | 覆盖 |
|---|---|---|
| `test/auth.test.ts` | 9 | 注册/登录/me、账号重复、错误密码、坏 token |
| `test/posts.test.ts` | 25 | 列表筛选排序分页、详情、发布、编辑 |
| `test/applications.test.ts` | 23 | 申请、接受/拒绝/完成事务、撤回、权限 |
| `test/files.test.ts` | 7 | 上传成功、格式/大小拒绝、未登录 |
| `test/admin.test.ts` | 21 | 管理员权限、列表含 HIDDEN、隐藏/恢复状态还原、审计日志 |
| `test/users.test.ts` | 9 | 资料编辑白名单、字段校验、account/role 不可改 |
| `test/app.test.ts` + `validate.test.ts` | 9 | 健康检查、CORS、统一错误、Zod 校验 |
| **合计** | **103** | |

## 部署

生产部署（Docker 或裸机）见 **[docs/14_部署与交付说明.md](../docs/14_部署与交付说明.md)**。

Docker 快速开始：

```bash
cp .env.docker.example .env.docker   # 填写真实密钥
docker compose --env-file .env.docker up -d --build
docker compose --env-file .env.docker exec backend npx prisma migrate deploy
docker compose --env-file .env.docker exec backend npm run prisma:seed
```

## 目录结构

```text
backend/
├── Dockerfile                 # 多阶段生产镜像
├── .dockerignore
├── prisma/
│   ├── schema.prisma          # 5 实体 + UploadedFile + AdminAction，枚举/索引/外键齐全
│   ├── migrations/            # 2 个版本化迁移（init + add_admin_actions）
│   └── seed.ts                # 与前端 mock 完全对齐的演示数据
├── src/
│   ├── config/                # env（Zod 校验）、prisma
│   ├── common/
│   │   ├── response/          # 统一 { code, message, data, requestId }
│   │   ├── exception/         # AppError、业务错误码表
│   │   ├── pagination/        # page/pageSize 与 PageResult
│   │   └── serializer/        # DB → API 形状（时间 +08:00、隐私字段裁剪）
│   ├── middleware/            # requestId、错误处理、Zod 校验、auth（必选/可选/管理员）
│   ├── modules/
│   │   ├── health/ auth/ categories/ posts/ applications/ files/
│   │   ├── admin/             # P1：管理端列表、隐藏/恢复、审计日志
│   │   └── users/             # P1：PATCH /users/me 资料编辑
│   ├── utils/                 # asyncHandler、jwt、password、time、params
│   ├── types/                 # express.d.ts（req.user）
│   ├── app.ts                 # Express 组装（可测试）
│   └── server.ts              # 监听与优雅退出
├── test/                      # 73 个集成测试
└── uploads/                   # 本地图片目录，真实文件不提交
```

分层：`routes`（路径 + 中间件 + Zod）→ `service`（业务规则 + Prisma 事务）→ `serializer`（出参）。controller 不直接写 Prisma。

## 关键业务规则（与 docs/04、05、13 一致）

- 状态机：`OPEN --接受--> PROCESSING --完成--> RESOLVED`；`OPEN --关闭--> CLOSED`（P1）。
- 接受申请在**单事务**内完成：目标 `ACCEPTED` → 同帖其余 `PENDING` 自动 `REJECTED`（备注「该信息已由其他申请处理」）→ 帖子 `PROCESSING`。
- 完成交接在**单事务**内：申请 `COMPLETED` + `completedAt` → 帖子 `RESOLVED` + `resolvedAt`。
- `FOUND` 只能 `CLAIM`、`LOST` 只能 `CLUE`，由服务端按 `postType` 自动设置，前端不传。
- 不能申请自己的帖（403/40301）；同用户同帖只能有一条 `PENDING`/`ACCEPTED`（409/40902）。
- `HIDDEN` 永不公开展示：列表回落默认可见集合，详情返回 404。
- 时间出参统一 ISO 8601 `+08:00`（`utils/time.ts` 单点实现）；DB 按 UTC 存。
- 隐私：列表/详情只出 `{id, nickname, avatarUrl}`；`phone/email` 仅 `/auth/me` 返回本人。

## 约定

- 所有业务接口挂载在 `/api/v1`；健康检查 `/health`；图片静态资源 `/uploads`。
- 接口契约以 `docs/05_API接口规范文档.md` 与 `api/openapi.yaml` 为准；契约变更须先改文档再改代码（docs/00 §8）。
- 错误统一走全局中间件：业务异常抛 `AppError`，参数校验用 Zod + `validate`。
- `.env` 不提交；生产启动会拒绝示例 JWT_SECRET / 管理员密码 / 数据库密码。
