# 07｜GitHub 协作与代码规范

## 1. 仓库规则

- 仓库唯一主分支：`main`，必须始终保持可运行、可演示。
- 两人禁止直接向 `main` 推送提交。
- 所有改动走 Pull Request（PR）；两人互相检查对方提交。
- 不需要额外长期维护 `develop` 分支，避免 14 天项目增加分支合并成本。
- PR 使用 Squash and merge，保持主分支历史清晰。

## 2. 分支命名

```text
feat/frontend-home
feat/frontend-post-list
feat/backend-auth
feat/backend-posts
fix/frontend-filter-reset
fix/backend-application-transaction
docs/api-contract
chore/project-init
```

一个分支只处理一个相对集中的任务，避免一个 PR 同时包含 UI、数据库迁移和无关文档。

## 3. 提交信息格式

采用 Conventional Commit 风格：

```text
feat: add lost post publishing form
fix: prevent duplicate claim applications
docs: define application status flow
style: refine post card spacing
refactor: extract post query service
test: cover post visibility rules
chore: configure prisma and lint scripts
```

提交信息使用英文动词短语；PR 描述使用中文即可。

## 4. PR 必填项

- 修改目的和对应 Issue。
- 修改范围（前端/后端/数据库/文档）。
- 本地验证命令和结果。
- 页面改动附前后截图或短录屏。
- API 改动说明请求/响应是否变化，并确认接口文档已同步。
- 数据库改动附 Prisma migration/迁移说明。

## 5. 合并门槛

合并前必须满足：

1. 项目可以安装依赖并成功构建。
2. 无明显 TypeScript 类型错误。
3. P0 业务逻辑修改有相应测试或明确手工验证记录。
4. API 变更与文档一致。
5. 不包含 `.env`、密码、Token、临时文件、真实用户隐私数据。
6. 由另一名成员完成至少一次代码/页面检查并评论“通过”后合并。课程项目两人无法满足平台强制审批策略时，采用人工互审，不绕过互审流程。

## 6. 代码规范

### 前端

- Vue 组件使用 PascalCase 文件名，如 `PostCard.vue`。
- 页面放 `views/`，通用组件放 `components/`。
- API 请求集中在 `src/api/`，禁止在 View 中散落 URL。
- 统一 `camelCase`；组件 Props/Emits 明确声明类型。
- 不在页面中重复写状态枚举的中文映射。

### 后端

- 文件名使用 kebab-case 或项目初始化后统一的命名规则；保持一致。
- 路由、控制器、服务分层；业务规则写在 service。
- 所有输入服务端校验；任何前端校验都不能替代服务端校验。
- 所有错误由全局中间件映射为统一响应。
- Prisma migration 必须与 schema 同步提交。

## 7. `.gitignore` 必须排除

```gitignore
node_modules/
.env
.env.*
!.env.example
dist/
coverage/
backend/uploads/**
!backend/uploads/.gitkeep
*.log
.DS_Store
Thumbs.db
.vscode/
.idea/
```

## 8. 代码冲突处理

- 同一文件由单人主责，另一人尽量通过接口/组件边界协作。
- 冲突由最后修改该模块的人发起 10 分钟同步讨论。
- 不允许直接采用某一方版本而丢弃另一方功能；合并后运行 lint/typecheck/build。
- 数据库 schema、API 类型和状态枚举属于高冲突文件，任何修改必须先同步。

## 9. Issues 标签

`P0`、`P1`、`frontend`、`backend`、`design`、`api`、`database`、`test`、`docs`、`blocked`。Issue 标题使用动词开头，例如“实现信息广场分类筛选”。
