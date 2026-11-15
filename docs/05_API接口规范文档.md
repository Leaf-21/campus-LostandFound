# 校园失物招领平台 API 接口规范文档

- 文档版本：V1.0
- 适用项目：校园失物招领平台
- 开发周期：2026-11-16 至 2026-11-29
- 目标：支持前端与后端两名成员并行开发，减少接口理解差异和联调返工
- 接口风格：RESTful API，JSON 数据交换
- 规范状态：开发前确认；如需修改，双方先同步并更新本文件
- 机器可读契约：仓库根目录 `api/openapi.yaml`（与本文件保持同步）
- API ID：实际返回 UUID 字符串；文档示例使用固定 UUID，前端必须将 ID 作为不透明字符串处理

---

## 1. 文档目的与协作约定

本文件是前后端共同遵循的接口契约。前端依据本文件开发页面、请求封装和 Mock 数据；后端依据本文件实现控制器、业务逻辑和数据访问。双方不得在未沟通的情况下自行修改字段名称、字段类型、路径、枚举值或状态流转规则。

### 1.1 两人职责

| 角色 | 主要职责 | 对接口规范的责任 |
|---|---|---|
| 成员 A：后端负责人 | 服务端、数据库、业务逻辑、鉴权、接口实现 | 实现接口、校验权限和参数、维护响应结构、提供联调环境 |
| 成员 B：前端负责人 | 页面、组件、交互、请求封装、前端状态管理 | 按规范调用接口、制作 Mock 数据、处理加载/空/错误状态、反馈接口问题 |
| 双方共同 | 需求和业务规则确认、联调、测试、验收 | 共同确认字段含义、状态流转和接口变更 |

### 1.2 接口变更规则

1. 新增或修改接口前，提出方先在群聊或 Issue 说明变更原因、影响页面、字段变化和计划完成时间。
2. 双方确认后，先更新本文件，再修改前后端代码。
3. 不允许只改前端字段或只改后端响应而不通知对方。
4. 删除字段、修改字段类型、改变枚举值、改变状态含义均视为破坏性变更，必须双方确认。
5. 每个接口至少提供一个成功响应示例；涉及业务失败时，应补充失败场景。
6. 联调发现问题时，使用统一格式记录：接口路径、请求参数、实际响应、预期响应、复现步骤。

---

## 2. 全局约定

### 2.1 基础地址与版本

开发环境 API 基础地址固定为：

```text
http://localhost:3000/api/v1
```

所有业务接口均以 `/api/v1` 为前缀。部署环境地址在部署前由双方共同更新。

### 2.2 请求格式

- 普通请求：`Content-Type: application/json`
- 文件上传：`Content-Type: multipart/form-data`
- 字符编码：UTF-8
- 时间格式：ISO 8601，例如 `2026-11-16T10:30:00+08:00`
- 主键：统一使用字符串类型的 `id`，前端不应假定其为数字。
- 可选字段未提供时可以省略；不应在同一个字段上混用 `null`、空字符串和不同数据类型。

### 2.3 身份认证

登录成功后，后端返回访问令牌。除注册、登录和分类查询等公开接口外，请求头统一携带：

```http
Authorization: Bearer <accessToken>
```

令牌失效或缺失时返回 HTTP `401`。前端收到 `401` 后清理本地登录状态并引导用户重新登录。

### 2.4 统一成功响应

```json
{
  "code": 0,
  "message": "success",
  "data": {},
  "requestId": "req-xxxxxxxx"
}
```

约定：

- `code`：业务码，`0` 表示成功。
- `message`：可用于展示的简短提示。
- `data`：业务数据；无返回数据时为 `null`。
- `requestId`：请求追踪标识，可用于排查问题。

### 2.5 统一失败响应

```json
{
  "code": 40001,
  "message": "请求参数不正确",
  "data": {
    "fieldErrors": [
      { "field": "title", "reason": "标题不能为空" }
    ]
  },
  "requestId": "req-xxxxxxxx"
}
```

### 2.6 HTTP 状态码与业务码

| HTTP 状态码 | 使用场景 |
|---|---|
| 200 | 查询、修改、业务操作成功 |
| 201 | 新建资源成功 |
| 400 | 参数格式错误或校验失败 |
| 401 | 未登录、令牌缺失或过期 |
| 403 | 已登录但无权执行操作 |
| 404 | 资源不存在或不可访问 |
| 409 | 状态冲突，例如重复申请或状态不允许变更 |
| 413 | 上传文件过大 |
| 415 | 文件类型不支持 |
| 500 | 服务端异常 |

| 业务码 | 含义 |
|---|---|
| 0 | 成功 |
| 40001 | 参数校验失败 |
| 40002 | 文件类型或文件大小不符合要求 |
| 40101 | 未登录或登录状态失效 |
| 40301 | 无权操作该资源 |
| 40401 | 用户、信息或申请不存在 |
| 40901 | 资源状态不允许当前操作 |
| 40902 | 已经提交过申请 |
| 40903 | 该信息已经被其他申请人确认 |
| 40904 | 登录账号已注册 |
| 50000 | 系统内部错误 |

### 2.7 分页格式

列表接口统一使用：

```json
{
  "items": [],
  "page": 1,
  "pageSize": 12,
  "total": 0,
  "totalPages": 0
}
```

查询参数统一为 `page` 和 `pageSize`：

- `page` 从 1 开始，默认 1。
- `pageSize` 默认 12，最大 50。
- 无结果时 `items` 返回空数组，不返回 `null`。

---

## 3. 核心业务模型与枚举

### 3.1 信息类型 `postType`

| 枚举值 | 含义 | 页面展示建议 |
|---|---|---|
| `LOST` | 寻物：用户丢失物品，希望他人提供线索 | 寻物启事 |
| `FOUND` | 招领：用户拾获物品，希望失主认领 | 失物招领 |

### 3.2 信息状态 `postStatus`

| 枚举值 | 含义 | 是否在默认信息广场展示 |
|---|---|---|
| `OPEN` | 正在寻找线索或等待认领 | 是 |
| `PROCESSING` | 已有申请被确认，正在联系或归还 | 是，可标注处理中 |
| `RESOLVED` | 已找回或已归还 | 默认否，可通过筛选查看 |
| `CLOSED` | 发布者主动关闭 | 默认否 |
| `HIDDEN` | 管理员隐藏 | 否 |

### 3.3 申请类型与状态

统一使用 `application` 表示对某条信息提供认领或线索：

| 字段/枚举 | 含义 |
|---|---|
| `applicationType = CLAIM` | 对 `FOUND` 招领信息提交认领申请 |
| `applicationType = CLUE` | 对 `LOST` 寻物信息提供线索 |
| `PENDING` | 待发布者处理 |
| `ACCEPTED` | 发布者确认该申请有效 |
| `REJECTED` | 发布者拒绝该申请 |
| `CANCELLED` | 申请人主动撤回 |
| `COMPLETED` | 双方已完成物品交接或线索处理 |

### 3.4 业务状态流转

**信息状态：**

```text
OPEN ──确认一条申请──> PROCESSING ──发布者确认完成──> RESOLVED
  └──────────────────发布者主动关闭──────────────> CLOSED
```

**申请状态：**

```text
PENDING ──发布者接受──> ACCEPTED ──发布者确认完成──> COMPLETED
    ├────发布者拒绝──> REJECTED
    └────申请人撤回──> CANCELLED
```

约束：

1. `LOST` 信息只能提交 `CLUE` 申请；`FOUND` 信息只能提交 `CLAIM` 申请。
2. 用户不能对自己发布的信息提交申请。
3. 同一用户对同一条信息只能存在一条有效申请；已撤回或被拒绝后是否允许重新申请，首版统一规定为**允许重新申请**，但同一时刻只能有一条 `PENDING` 或 `ACCEPTED` 申请。
4. 一条信息最多只能有一条 `ACCEPTED` 申请。
5. 发布者接受申请后，信息进入 `PROCESSING`；其他未处理的 `PENDING` 申请自动变为 `REJECTED`，拒绝原因可填写“该信息已由其他申请处理”。
6. 只有信息发布者可以接受/拒绝申请、确认完成或主动关闭信息。
7. 管理员可以隐藏违规信息，但不能伪造用户的认领或完成操作。

---

## 4. 数据对象字段规范

### 4.1 用户 `User`

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | string | 用户 ID |
| `account` | string | 登录账号，注册时唯一 |
| `nickname` | string | 昵称 |
| `avatarUrl` | string \| null | 头像 URL |
| `phone` | string \| null | 联系电话；仅本人或具备权限的业务场景可见 |
| `email` | string \| null | 邮箱 |
| `role` | `USER` \| `ADMIN` | 用户角色 |
| `createdAt` | string | 创建时间 |

**安全要求：** 用户密码不得出现在任何响应中；公开信息列表不得返回发布者手机号、邮箱等隐私字段。申请处理需要联系方式时，首版优先通过站内申请内容沟通；如需展示联系方式，必须由发布者主动授权。

### 4.2 失物信息 `Post`

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `id` | string | 响应必有 | 信息 ID |
| `postType` | `LOST` \| `FOUND` | 是 | 寻物或招领 |
| `title` | string | 是 | 标题，2–50 字 |
| `description` | string | 是 | 详细描述，10–1000 字 |
| `categoryId` | string | 是 | 分类 ID |
| `categoryName` | string | 响应必有 | 分类名称 |
| `images` | string[] | 否 | 图片 URL 数组，最多 5 张 |
| `location` | string | 是 | 丢失或拾获地点 |
| `occurredAt` | string | 是 | 丢失或拾获时间 |
| `reward` | string \| null | 否 | 酬谢说明，非必填，不作为交易承诺 |
| `status` | PostStatus | 响应必有 | 信息状态 |
| `publisher` | UserSummary | 响应必有 | 发布者公开信息 |
| `applicationCount` | number | 响应必有 | 申请数量 |
| `createdAt` | string | 响应必有 | 发布时间 |
| `updatedAt` | string | 响应必有 | 更新时间 |

`UserSummary`：

```json
{
  "id": "00000000-0000-4000-8000-000000000101",
  "nickname": "校园用户",
  "avatarUrl": null
}
```

### 4.3 申请 `Application`

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `id` | string | 响应必有 | 申请 ID |
| `postId` | string | 响应必有 | 对应信息 ID |
| `postTitle` | string | 响应必有 | 对应信息标题，列表展示使用 |
| `applicationType` | `CLAIM` \| `CLUE` | 响应必有 | 认领或线索 |
| `details` | string | 是 | 认领证明或线索描述，10–500 字 |
| `status` | ApplicationStatus | 响应必有 | 申请状态 |
| `applicant` | UserSummary | 响应必有 | 申请人公开信息 |
| `reviewNote` | string \| null | 响应必有 | 发布者处理说明 |
| `createdAt` | string | 响应必有 | 申请时间 |
| `updatedAt` | string | 响应必有 | 更新时间 |

---

## 5. 接口清单

所有路径均相对于基础地址 `/api/v1`。

### 5.1 接口优先级

| 优先级 | 含义 | 接口范围 |
|---|---|---|
| P0 | 首版必须完成，直接支撑主流程和评分演示 | 注册登录、分类、信息列表/详情/发布/修改、图片上传、申请提交/处理、个人中心 |
| P1 | 有时间则完成，增强项目完整度 | 管理员隐藏信息、用户资料修改、管理列表 |

### 5.2 接口总表

| 模块 | 方法 | 路径 | 功能 | 优先级 |
|---|---|---|---|---|
| 认证 | POST | `/auth/register` | 用户注册 | P0 |
| 认证 | POST | `/auth/login` | 用户登录 | P0 |
| 认证 | GET | `/auth/me` | 获取当前用户 | P0 |
| 用户 | PATCH | `/users/me` | 修改个人资料 | P1 |
| 分类 | GET | `/categories` | 获取物品分类 | P0 |
| 文件 | POST | `/files` | 上传图片 | P0 |
| 信息 | GET | `/posts` | 信息广场、搜索、筛选、分页 | P0 |
| 信息 | GET | `/posts/{postId}` | 信息详情 | P0 |
| 信息 | POST | `/posts` | 发布寻物/招领信息 | P0 |
| 信息 | PATCH | `/posts/{postId}` | 修改本人发布的信息 | P0 |
| 信息 | POST | `/posts/{postId}/close` | 关闭本人发布的信息 | P1 |
| 信息 | GET | `/users/me/posts` | 我的发布 | P0 |
| 申请 | POST | `/posts/{postId}/applications` | 提交认领/线索申请 | P0 |
| 申请 | GET | `/posts/{postId}/applications` | 查看某条信息收到的申请 | P0 |
| 申请 | GET | `/users/me/applications` | 我的申请/收到的申请 | P0 |
| 申请 | GET | `/applications/{applicationId}` | 申请详情 | P1 |
| 申请 | POST | `/applications/{applicationId}/decision` | 接受或拒绝申请 | P0 |
| 申请 | POST | `/applications/{applicationId}/cancel` | 撤回本人申请 | P1 |
| 申请 | POST | `/applications/{applicationId}/complete` | 确认交接完成 | P0 |
| 管理 | GET | `/admin/posts` | 管理员查看信息 | P1 |
| 管理 | POST | `/admin/posts/{postId}/hide` | 隐藏违规信息 | P1 |
| 管理 | POST | `/admin/posts/{postId}/restore` | 恢复被隐藏信息 | P1 |

---

## 6. 认证与用户接口

### 6.1 用户注册

`POST /auth/register`（公开）

请求体：

```json
{
  "account": "student2026",
  "password": "Passw0rd!",
  "nickname": "小林",
  "email": "student@example.com"
}
```

字段要求：

| 字段 | 类型 | 必填 | 规则 |
|---|---|---:|---|
| `account` | string | 是 | 4–30 位，唯一；支持字母、数字和下划线 |
| `password` | string | 是 | 8–32 位；后端加密存储 |
| `nickname` | string | 是 | 1–20 字 |
| `email` | string | 否 | 合法邮箱格式 |

成功响应：HTTP `201`

```json
{
  "code": 0,
  "message": "注册成功",
  "data": {
    "id": "00000000-0000-4000-8000-000000000101",
    "account": "student2026",
    "nickname": "小林",
    "role": "USER"
  },
  "requestId": "req-register-001"
}
```

失败场景：账号已存在返回 `409` / `40904`（账号已注册）；参数不合法返回 `400` / `40001`。

### 6.2 用户登录

`POST /auth/login`（公开）

请求体：

```json
{
  "account": "student2026",
  "password": "Passw0rd!"
}
```

成功响应：

```json
{
  "code": 0,
  "message": "登录成功",
  "data": {
    "accessToken": "<token>",
    "tokenType": "Bearer",
    "expiresIn": 7200,
    "user": {
      "id": "00000000-0000-4000-8000-000000000101",
      "account": "student2026",
      "nickname": "小林",
      "avatarUrl": null,
      "role": "USER"
    }
  },
  "requestId": "req-login-001"
}
```

账号或密码错误统一返回 `401`，提示“账号或密码错误”，不要透露具体是哪一项错误。

### 6.3 获取当前用户

`GET /auth/me`（需要登录）

成功响应 `data`：

```json
{
  "id": "00000000-0000-4000-8000-000000000101",
  "account": "student2026",
  "nickname": "小林",
  "avatarUrl": null,
  "phone": null,
  "email": "student@example.com",
  "role": "USER",
  "createdAt": "2026-11-16T10:00:00+08:00"
}
```

### 6.4 修改个人资料

`PATCH /users/me`（需要登录，P1）

请求体示例：

```json
{
  "nickname": "林同学",
  "avatarUrl": "https://example.com/uploads/avatar.png",
  "phone": "13800000000"
}
```

只更新请求体中出现的字段。成功后返回更新后的用户对象。`account`、`role` 不允许用户自行修改。

---

## 7. 分类与文件接口

### 7.1 获取物品分类

`GET /categories`（公开）

成功响应 `data`：

```json
[
  { "id": "10000000-0000-4000-8000-000000000001", "name": "数码产品", "sort": 1 },
  { "id": "10000000-0000-4000-8000-000000000002", "name": "证件卡类", "sort": 2 },
  { "id": "10000000-0000-4000-8000-000000000003", "name": "书籍文具", "sort": 3 },
  { "id": "10000000-0000-4000-8000-000000000004", "name": "生活用品", "sort": 4 },
  { "id": "10000000-0000-4000-8000-000000000005", "name": "衣物配饰", "sort": 5 },
  { "id": "10000000-0000-4000-8000-000000000006", "name": "其他", "sort": 6 }
]
```

### 7.2 上传图片

`POST /files`（需要登录，`multipart/form-data`）

表单字段：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `file` | File | 是 | 图片文件，首版支持 JPG、JPEG、PNG、WEBP，单张最大 5 MB |

成功响应：

```json
{
  "code": 0,
  "message": "上传成功",
  "data": {
    "fileId": "20000000-0000-4000-8000-000000000001",
    "url": "https://example.com/uploads/20000000-0000-4000-8000-000000000001.png",
    "fileName": "phone.png",
    "size": 245760,
    "contentType": "image/png"
  },
  "requestId": "req-file-001"
}
```

前端约定：先在页面显示本地预览，上传成功后将响应中的 `url` 放入信息发布请求的 `images` 数组；发布信息时不得传本地 `blob:` 地址。

---

## 8. 失物信息接口

### 8.1 信息广场、搜索与筛选

`GET /posts`（公开）

查询参数：

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---:|---|---|
| `postType` | `LOST` \| `FOUND` | 否 | 不限 | 信息类型 |
| `keyword` | string | 否 | - | 匹配标题和描述，忽略首尾空格 |
| `categoryId` | string | 否 | - | 分类 ID |
| `location` | string | 否 | - | 地点关键词 |
| `status` | PostStatus | 否 | 默认包含 `OPEN`、`PROCESSING` | 传入时仅传一个状态；不传时默认返回可处理信息 |
| `sort` | `LATEST` \| `OLDEST` | 否 | `LATEST` | 排序方式 |
| `page` | integer | 否 | 1 | 页码 |
| `pageSize` | integer | 否 | 12 | 每页数量，最大 50 |

请求示例：

```http
GET /api/v1/posts?postType=FOUND&keyword=校园卡&categoryId=10000000-0000-4000-8000-000000000002&page=1&pageSize=12
```

成功响应 `data`：

```json
{
  "items": [
    {
      "id": "30000000-0000-4000-8000-000000000001",
      "postType": "FOUND",
      "title": "在图书馆一楼拾获校园卡",
      "description": "在图书馆一楼自助借还机附近拾获一张校园卡。",
      "categoryId": "10000000-0000-4000-8000-000000000002",
      "categoryName": "证件卡类",
      "images": ["https://example.com/uploads/card.png"],
      "location": "图书馆一楼",
      "occurredAt": "2026-11-16T09:20:00+08:00",
      "reward": null,
      "status": "OPEN",
      "publisher": {
        "id": "00000000-0000-4000-8000-000000000102",
        "nickname": "热心同学",
        "avatarUrl": null
      },
      "applicationCount": 0,
      "createdAt": "2026-11-16T10:00:00+08:00",
      "updatedAt": "2026-11-16T10:00:00+08:00"
    }
  ],
  "page": 1,
  "pageSize": 12,
  "total": 1,
  "totalPages": 1
}
```

交互约定：前端更改筛选条件后重置 `page=1`；关键字搜索建议由用户点击搜索或输入停止后触发；无结果时展示空状态和清除筛选入口。

### 8.2 信息详情

`GET /posts/{postId}`（公开）

成功响应 `data` 返回完整 `Post` 对象。若当前用户已登录，可额外返回：

```json
{
  "currentUserRelation": {
    "isPublisher": false,
    "myApplicationStatus": null
  }
}
```

未登录时 `currentUserRelation` 可为 `null`。前端根据该字段决定显示“编辑/管理申请”“申请认领/提供线索”或“登录后操作”。

### 8.3 发布信息

`POST /posts`（需要登录）

请求体：

```json
{
  "postType": "FOUND",
  "title": "在图书馆一楼拾获校园卡",
  "description": "在图书馆一楼自助借还机附近拾获一张校园卡，失主可描述卡套特征进行认领。",
  "categoryId": "10000000-0000-4000-8000-000000000002",
  "images": ["https://example.com/uploads/card.png"],
  "location": "图书馆一楼自助借还机附近",
  "occurredAt": "2026-11-16T09:20:00+08:00",
  "reward": null
}
```

字段要求：

- `postType`、`title`、`description`、`categoryId`、`location`、`occurredAt` 必填。
- `title` 2–50 字；`description` 10–1000 字；`location` 2–100 字。
- `images` 可选，最多 5 个 URL。
- `reward` 可选，最多 100 字。
- 新建信息的 `status` 固定为 `OPEN`，由后端设置，前端不得自行传入状态。

成功响应：HTTP `201`，`data` 返回创建后的完整 `Post` 对象。

### 8.4 修改本人发布的信息

`PATCH /posts/{postId}`（需要登录）

请求体示例：

```json
{
  "title": "在图书馆一楼拾获校园卡（更新）",
  "description": "补充：卡片放在图书馆服务台。",
  "images": [],
  "location": "图书馆一楼服务台"
}
```

规则：仅发布者可修改；`PROCESSING`、`RESOLVED`、`CLOSED`、`HIDDEN` 状态的信息不允许普通用户修改。成功后返回完整 `Post`。

### 8.5 关闭本人发布的信息

`POST /posts/{postId}/close`（需要登录，P1）

请求体可为空。仅发布者可对 `OPEN` 状态的信息执行关闭；存在已接受申请时，不允许直接关闭，必须先完成或由管理员按业务规则处理。成功后返回更新后的信息状态。

### 8.6 我的发布

`GET /users/me/posts`（需要登录）

查询参数：`postType`、`status`、`page`、`pageSize`，规则与 `/posts` 相同。

成功响应 `data` 使用统一分页格式，`items` 为 `Post` 对象数组。前端用于“我的寻物”“我的招领”及状态筛选。

---

## 9. 认领与线索申请接口

### 9.1 提交申请

`POST /posts/{postId}/applications`（需要登录）

请求体：

```json
{
  "details": "物品是黑色手机，手机壳右下角有一道白色划痕。我可以补充锁屏照片进行核对。"
}
```

规则：

- 当信息 `postType=FOUND` 时，服务端自动设置 `applicationType=CLAIM`。
- 当信息 `postType=LOST` 时，服务端自动设置 `applicationType=CLUE`。
- `details` 必填，10–500 字。
- 不允许对本人发布的信息提交申请。
- 信息必须处于 `OPEN` 状态。
- 前端不传 `applicantId`、`applicationType`、`status`；这些字段由服务端根据登录用户和信息类型决定。

成功响应：HTTP `201`

```json
{
  "code": 0,
  "message": "申请提交成功",
  "data": {
    "id": "40000000-0000-4000-8000-000000000001",
    "postId": "30000000-0000-4000-8000-000000000001",
    "postTitle": "在图书馆一楼拾获校园卡",
    "applicationType": "CLAIM",
    "details": "物品特征描述……",
    "status": "PENDING",
    "applicant": {
      "id": "00000000-0000-4000-8000-000000000103",
      "nickname": "小周",
      "avatarUrl": null
    },
    "reviewNote": null,
    "createdAt": "2026-11-16T11:00:00+08:00",
    "updatedAt": "2026-11-16T11:00:00+08:00"
  },
  "requestId": "req-application-001"
}
```

失败场景：本人申请自己的信息返回 `403`；信息已关闭或处理中返回 `409`；重复有效申请返回 `409`。

### 9.2 查看某条信息收到的申请

`GET /posts/{postId}/applications`（需要登录）

查询参数：`status`、`page`、`pageSize`。

规则：仅该信息发布者或管理员可访问。成功响应 `data` 为统一分页结构，`items` 为 `Application` 数组。

### 9.3 我的申请与收到的申请

`GET /users/me/applications`（需要登录）

查询参数：

| 参数 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `role` | `SUBMITTED` \| `RECEIVED` | 是 | `SUBMITTED` 为我提交的申请；`RECEIVED` 为我发布的信息收到的申请 |
| `status` | ApplicationStatus | 否 | 按申请状态筛选 |
| `page` | integer | 否 | 默认 1 |
| `pageSize` | integer | 否 | 默认 12，最大 50 |

成功响应为统一分页结构。每个 `Application` 对象中必须包含 `postId` 和 `postTitle`，用于前端跳转对应信息详情。

### 9.4 申请详情

`GET /applications/{applicationId}`（需要登录，P1）

仅申请人、对应信息发布者或管理员可访问。成功响应 `data` 为完整 `Application`，并包含必要的信息摘要 `post`。

### 9.5 发布者接受或拒绝申请

`POST /applications/{applicationId}/decision`（需要登录）

请求体：

```json
{
  "decision": "ACCEPTED",
  "reviewNote": "请通过站内方式进一步核对物品特征。"
}
```

字段：

- `decision` 必填，只允许 `ACCEPTED` 或 `REJECTED`。
- `reviewNote` 可选，最多 200 字。

规则：

1. 仅对应信息发布者可以处理申请。
2. 申请必须为 `PENDING`，对应信息必须为 `OPEN`。
3. 接受后申请状态变为 `ACCEPTED`，信息状态变为 `PROCESSING`。
4. 接受一条申请后，同一信息的其他 `PENDING` 申请自动变为 `REJECTED`。
5. 拒绝后申请状态变为 `REJECTED`；若没有其他已接受申请，信息仍保持 `OPEN`。

成功响应 `data`：

```json
{
  "application": {
    "id": "40000000-0000-4000-8000-000000000001",
    "status": "ACCEPTED",
    "reviewNote": "请通过站内方式进一步核对物品特征。"
  },
  "post": {
    "id": "30000000-0000-4000-8000-000000000001",
    "status": "PROCESSING"
  }
}
```

### 9.6 申请人撤回申请

`POST /applications/{applicationId}/cancel`（需要登录，P1）

仅申请人本人可撤回 `PENDING` 状态申请。成功后状态变为 `CANCELLED`。已接受、已拒绝或已完成的申请不可撤回。

### 9.7 发布者确认完成

`POST /applications/{applicationId}/complete`（需要登录）

请求体可为空。规则：仅信息发布者可以确认；申请必须处于 `ACCEPTED`，对应信息必须处于 `PROCESSING`。成功后申请变为 `COMPLETED`，信息变为 `RESOLVED`。

成功响应 `data`：

```json
{
  "applicationId": "40000000-0000-4000-8000-000000000001",
  "applicationStatus": "COMPLETED",
  "postId": "30000000-0000-4000-8000-000000000001",
  "postStatus": "RESOLVED",
  "completedAt": "2026-11-17T16:30:00+08:00"
}
```

---

## 10. 管理员接口（P1）

### 10.1 管理员查看信息

`GET /admin/posts`（需要 `ADMIN` 角色）

查询参数：`keyword`、`postType`、`status`、`page`、`pageSize`。成功响应为统一分页结构。

### 10.2 隐藏信息

`POST /admin/posts/{postId}/hide`（需要 `ADMIN` 角色）

请求体：

```json
{ "reason": "包含不适当内容" }
```

成功后信息状态变为 `HIDDEN`，普通信息广场不再展示。后端应记录管理员操作和原因。

### 10.3 恢复信息

`POST /admin/posts/{postId}/restore`（需要 `ADMIN` 角色）

仅恢复此前被隐藏的信息。恢复后的状态由后端按隐藏前状态或业务规则决定；首版建议保存隐藏前状态，恢复时还原该状态。

---

## 11. 前端页面与接口对应关系

| 页面/交互 | 调用接口 | 前端需要处理的状态 |
|---|---|---|
| 注册页 | `POST /auth/register` | 校验中、成功、账号重复、参数错误 |
| 登录页 | `POST /auth/login`、`GET /auth/me` | 登录中、登录失败、令牌失效 |
| 首页 | `GET /posts`、`GET /categories` | 推荐/最新信息、空状态、加载状态 |
| 信息广场 | `GET /posts`、`GET /categories` | 搜索、分类筛选、类型切换、分页、无结果 |
| 信息详情 | `GET /posts/{id}` | 图片预览、发布者身份判断、申请入口、状态标签 |
| 发布页 | `GET /categories`、`POST /files`、`POST /posts` | 表单校验、图片上传进度、预览、提交成功/失败 |
| 编辑页 | `GET /posts/{id}`、`PATCH /posts/{id}` | 回显数据、权限判断、保存状态 |
| 申请表单 | `POST /posts/{id}/applications` | 认领/线索文案、字符数、重复提交防抖 |
| 我的发布 | `GET /users/me/posts` | 按类型和状态筛选、查看详情 |
| 收到的申请 | `GET /posts/{id}/applications`、`POST /applications/{id}/decision` | 接受、拒绝、二次确认、处理中状态 |
| 我的申请 | `GET /users/me/applications`、`POST /applications/{id}/cancel` | 申请进度、撤回操作 |
| 完成交接 | `POST /applications/{id}/complete` | 完成确认弹窗、成功反馈 |
| 个人资料 | `GET /auth/me`、`PATCH /users/me` | 资料回显、保存成功/失败 |
| 管理后台 | `/admin/posts` 系列接口 | 信息筛选、隐藏/恢复确认 |

---

## 12. Mock 数据与并行开发要求

为保证两人不互相等待，第一天完成本节约定后即可并行开发。

### 12.1 前端成员的工作方式

1. 根据第 4 节数据对象创建统一 TypeScript 类型（如 `User`、`Post`、`Application`）。
2. 根据第 5–10 节接口定义封装 API 函数，不在页面组件中散落请求地址。
3. 后端未完成时，使用与本文件响应结构完全一致的 Mock 数据。
4. Mock 与真实接口切换应通过统一 API 层或环境配置完成，避免页面中同时维护两套字段。
5. 页面开发必须覆盖加载中、空数据、接口失败、未登录、无权限和操作成功等状态。

### 12.2 后端成员的工作方式

1. 先创建统一响应体、分页对象、异常处理和身份认证机制。
2. 先提供分类列表和 Mock/测试数据，使前端可以尽早联调。
3. 严格按本文件实现字段名、字段类型、枚举值和业务状态流转。
4. 为每个 P0 接口提供至少一个可重复执行的测试请求和成功响应。
5. 不向前端返回密码、密码哈希、未授权联系方式或其他不必要的敏感字段。

### 12.3 推荐的前端 API 封装目录

```text
frontend/src/
├── api/
│   ├── http.ts             # 请求实例、Base URL、Token、统一错误处理
│   ├── auth.ts             # 注册、登录、当前用户
│   ├── posts.ts             # 信息列表、详情、发布、编辑
│   ├── applications.ts     # 申请提交、查询、处理
│   ├── categories.ts       # 分类
│   ├── files.ts             # 文件上传
│   └── users.ts             # 个人中心
├── types/
│   ├── user.ts
│   ├── post.ts
│   ├── application.ts
│   └── api.ts
└── mocks/                  # 开发阶段 Mock 数据
```

### 12.4 推荐的后端模块目录

```text
backend/src/
├── modules/
│   ├── auth/
│   ├── users/
│   ├── categories/
│   ├── files/
│   ├── posts/
│   ├── applications/
│   └── admin/
├── common/
│   ├── response/
│   ├── exception/
│   ├── pagination/
│   └── security/
└── config/
```

目录名称可按实际后端框架调整，但模块边界和接口职责保持一致。

---

## 13. 联调与验收标准

### 13.1 联调顺序

| 时间建议 | 联调内容 | 验收结果 |
|---|---|---|
| 11 月 18 日 | Base URL、统一响应、登录认证、分类、CORS | 前端能成功请求后端并保持登录状态 |
| 11 月 20 日 | 信息发布、图片上传、信息列表和详情 | 能发布一条信息，并在广场和详情页看到 |
| 11 月 22 日 | 搜索、筛选、分页、我的发布 | 条件变化正确反映在列表中 |
| 11 月 24 日 | 认领/线索申请、申请列表、接受/拒绝 | 核心申请流程可完整走通 |
| 11 月 26 日 | 完成交接、个人中心、权限和异常处理 | 状态流转与页面显示一致 |
| 11 月 27 日 | 全流程回归测试 | 主要用户场景无阻断问题 |

### 13.2 P0 端到端验收场景

**场景 A：拾获物品并完成认领**

1. 用户 A 注册并登录。
2. 用户 A 发布一条 `FOUND` 招领信息，上传物品图片。
3. 用户 B 在信息广场搜索并打开详情。
4. 用户 B 提交 `CLAIM` 申请，填写物品特征证明。
5. 用户 A 在个人中心查看收到的申请并接受。
6. 信息状态变为 `PROCESSING`，申请状态变为 `ACCEPTED`。
7. 用户 A 确认物品已归还。
8. 信息状态变为 `RESOLVED`，申请状态变为 `COMPLETED`。

**场景 B：丢失物品并收到线索**

1. 用户 A 发布一条 `LOST` 寻物信息。
2. 用户 B 搜索信息并提交线索。
3. 用户 A 查看线索并处理。
4. 双方线下联系并完成找回后，用户 A 确认完成。

### 13.3 测试检查项

- [ ] 未登录用户无法发布、修改或申请。
- [ ] 用户不能编辑或关闭他人发布的信息。
- [ ] 用户不能对自己发布的信息提交申请。
- [ ] `LOST` 与 `FOUND` 对应正确的申请类型。
- [ ] 申请被接受后，信息状态同步为 `PROCESSING`。
- [ ] 完成申请后，信息状态同步为 `RESOLVED`。
- [ ] 重复点击提交不会产生重复申请或重复信息。
- [ ] 图片类型、大小和数量均受到限制。
- [ ] 列表分页、搜索和筛选结果正确。
- [ ] 无数据、加载中、网络错误和权限错误均有明确页面反馈。
- [ ] 手机号、邮箱、密码及其他敏感信息不会被公开接口泄露。

---

## 14. 两周内的接口实现优先级

考虑到项目只有两周，建议严格按以下顺序推进：

### 第一批：11 月 16–18 日，先确定契约

- 确认所有枚举、数据对象、统一响应和分页规范。
- 确认登录、分类、信息列表、详情、发布和申请接口。
- 双方在本文件上确认版本 V1.0，开始并行开发。

### 第二批：11 月 19–22 日，完成信息主流程

- 后端：注册登录、分类、文件上传、信息 CRUD、列表查询。
- 前端：登录注册、首页、信息广场、详情页、发布页。
- 11 月 20 日开始第一次真实接口联调，不等待所有功能开发完成。

### 第三批：11 月 23–25 日，完成申请主流程

- 后端：提交申请、查看申请、接受/拒绝、完成交接。
- 前端：申请表单、我的发布、我的申请、申请处理和状态展示。
- 11 月 25 日冻结 P0 功能，之后原则上只修复问题和优化交互。

### 第四批：11 月 26–29 日，质量与交付

- 11 月 26–27 日：端到端联调、异常处理、视觉和交互优化。
- 11 月 28 日：部署、数据准备、项目说明和演示检查。
- 11 月 29 日：最终验收和提交。

---

## 15. 双方确认清单

开始正式并行开发前，两名成员应共同确认以下事项：

- [ ] 已确认后端框架、前端框架、数据库和开发环境。
- [ ] 已确认 API Base URL、端口、跨域配置和启动方式。
- [ ] 已确认 `LOST`、`FOUND`、信息状态和申请状态的含义。
- [ ] 已确认用户、信息、申请三个核心数据对象字段。
- [ ] 已确认统一成功/失败响应和分页结构。
- [ ] 已确认 P0 接口范围和实现顺序。
- [ ] 前端已按本规范建立 TypeScript 类型和 Mock 数据。
- [ ] 后端已建立统一响应、异常处理和认证机制。
- [ ] 双方已约定接口变更必须先沟通并更新文档。
- [ ] 已把本文档提交到 GitHub 仓库 `docs/API接口规范文档.md`。

| 确认角色 | 姓名/账号 | 确认日期 | 签字/确认 |
|---|---|---|---|
| 成员 A（后端） |  |  |  |
| 成员 B（前端） |  |  |  |

---

## 16. 当前版本说明与待确认事项

本规范采用通用 RESTful JSON 约定，未绑定具体前后端框架。正式开始编码前，双方只需补充或确认：

1. 实际技术栈与后端端口、开发环境 Base URL。
2. 校园用户账号是否需要学号格式或校园邮箱验证。若没有学校统一认证条件，首版使用普通账号注册，不应伪称已完成校园身份认证。
3. 图片文件采用本地存储还是对象存储；无论采用哪种方式，前端只依赖接口返回的 `url`。
4. 是否实现 P1 管理员功能。时间不足时优先保证 P0 主流程。

除上述部署或环境配置项外，双方应以本文件作为接口实现和联调的共同依据。
