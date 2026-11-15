# 06｜两人并行开发与 Mock 联调规范

## 1. 并行开发目标

前端不等待后端接口完成；后端不等待前端页面完成。双方都以 `docs/05_API接口规范文档.md` 和 `api/openapi.yaml` 为唯一数据契约。

## 2. 并行工作方式

### 成员 A（后端）

1. 初始化 Express + TypeScript + Prisma 项目。
2. 根据数据库文档创建 Prisma schema 和迁移。
3. 按 API 契约实现 Auth、Categories、Posts、Files、Applications。
4. 先提供 `/health`、认证和列表接口，随后补齐写操作。
5. 提供 Seed 数据和可联调地址。

### 成员 B（前端）

1. 初始化 Vue + Vite + TypeScript 项目。
2. 根据交互文档完成路由、布局、设计 Token、通用组件。
3. 建立与 API 契约一致的 `types/` 类型。
4. 建立 `api/` 封装和 `mock/` 数据；页面先使用 Mock 跑通完整交互。
5. 在 API 实现后逐个模块切换真实接口。

## 3. Mock 约定

- Mock 数据结构必须与真实 API 的 `data` 完全一致。
- Mock 不得另造字段、枚举或状态名。
- 统一由 `VITE_USE_MOCK=true/false` 控制；页面组件不能在业务代码中写 `if (mock) ...` 分叉。
- `VITE_USE_MOCK=true` 时，API service 层返回 Promise，模拟 200–400ms 延迟；所有页面通过同一 API 函数访问。
- `VITE_USE_MOCK=false` 时，API service 调用 Axios；调用方无需修改。
- Mock 数据至少覆盖空列表、普通列表、图片缺失、OPEN、PROCESSING、RESOLVED、PENDING、REJECTED 等状态。
- Mock 不替代真实联调；11 月 22 日前必须完成首轮真实接口验证。

## 4. API 层统一结构（前端约定）

```ts
export interface ApiResponse<T> {
  code: number
  message: string
  data: T
  requestId: string
}

export interface PageResult<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}
```

`src/api/http.ts` 负责 Base URL、Authorization、响应解包、401 处理和错误映射。业务 API 模块只负责具体路径和类型，不重复实现拦截器。

## 5. 后端联调交付顺序

| 顺序 | 后端交付 | 前端对应页面 |
|---|---|---|
| 1 | `/health`、注册、登录、`/auth/me` | 登录、注册、导航栏用户状态 |
| 2 | 分类、公开信息列表、信息详情 | 首页、信息广场、详情 |
| 3 | 图片上传、创建/编辑信息 | 发布、编辑 |
| 4 | 提交申请、收到/提交申请列表 | 详情申请弹窗、个人中心 |
| 5 | 接受/拒绝、完成交接 | 收到的申请处理、状态刷新 |
| 6 | P1 管理和个人资料 | 管理员页面、资料编辑 |

## 6. 联调规则

每次联调需双方使用同一环境变量、同一 API 版本和 Seed 数据。发现问题应提供：

- 接口方法和完整路径；
- 请求参数/请求体；
- 实际 HTTP 状态码和响应 JSON；
- 期望结果；
- 复现步骤或截图；
- 当前分支/提交 SHA。

不接受“接口好像不对”这种无法定位的问题描述。

## 7. 每日集成节奏

- 每天开始：各自同步今日任务、依赖和阻塞。
- 每天 20:30（Asia/Shanghai）：10–15 分钟同步开发进度，检查接口是否变化、是否出现冲突。
- 每天结束：功能分支至少推送一次；未完成工作也要提交可编译的阶段代码，避免长时间本地独占。
- 任何已完成模块尽早提 PR，不要积累到最后一天。

## 8. 接口冻结

11 月 18 日冻结主路径、字段、响应和枚举；11 月 25 日冻结 P0 API。之后仅允许修复兼容性问题。变更必须先改文档和 Mock，再改实现。
