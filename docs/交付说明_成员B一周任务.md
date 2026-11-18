# 交付说明 · 成员 B 前端全部任务（11/16–11/29）

> 本文档面向组内协作：成员 B 前端全部交付内容、运行方法、构建注意事项与推送到 GitHub 的步骤。
> 全程遵循 `docs/05_API接口规范文档.md` 契约与 `docs/06_并行开发与Mock联调规范.md`，未臆造任何字段。

## 一、已完成内容

- 从零搭建 `frontend/`：Vue 3 + TypeScript + Vite 6 + Element Plus（全量 + zh-cn 中文包）+ Pinia + Vue Router + Axios + dayjs + SCSS 设计 Token（对应 docs/03 视觉规范）。
- 页面（9 个视图，路由守卫/登录回跳齐全）：
  - 首页（Hero + 分类入口 + 最新发布 + 使用指南）
  - 信息广场（类型 Tab / 搜索 / 分类 / 地点 / 状态 / 排序 / 分页，筛选状态同步 URL 可分享可回退，移动端筛选抽屉）
  - 信息详情（图片画廊 + 主操作区分派：未登录引导登录 / 发布者查看并处理收到的申请 / 他人提交申请，覆盖 PENDING/ACCEPTED/REJECTED/CANCELLED/COMPLETED 全状态展示）
  - 发布信息 / 编辑信息（共用表单，编辑锁定类型、仅 OPEN 可编辑）
  - 登录 / 注册（演示账号提示、注册成功回填账号）
  - 个人中心（用户卡片 + 我的发布 / 我提交的申请 / 我收到的申请三 Tab，状态筛选 + 分页，撤回申请、接受/拒绝/完成交接全流程）
  - 404
- Mock 全接口实现（docs/06 规范）：认证、分类、信息、申请、上传全部可用且内存态可写，发布 → 申请 → 接受（其余待处理自动拒绝）→ 完成交接 全流程可演示；业务规则与后端一致（LOST 只能提线索、不能申请自己的信息等）。
- 八态交互（评分重点）：Loading 骨架 / Empty（必带下一步行动）/ Error（可重试）/ Success 反馈 / Disabled 态 / 表单校验 / 二次确认 / 防重复提交。
- 响应式：桌面 3 列 → 窄屏 2 列 → 移动 1 列；1366px 与 390px 均无横向滚动；颜色不作唯一状态区分（徽章均配文字标签）。

## 二、本地运行

```bash
cd frontend
npm ci --registry=https://registry.npmmirror.com   # 或 npm install --registry=...
npm run dev                                        # http://localhost:5173
```

- 默认 **Mock 模式**（`.env` 中 `VITE_USE_MOCK=true`），演示账号：`student2026` / `Passw0rd!`。
- 联调真实后端：把 `.env` 改为 `VITE_USE_MOCK=false` 并配置 `VITE_API_BASE_URL`（默认 `http://localhost:3000/api/v1`），页面代码无需任何改动（docs/06 约定：分支只在 API service 层）。

## 三、构建说明（重要：本机安全策略）

- 本电脑的 Windows 应用控制策略会拦截未签名的原生 DLL（rollup 的 `.node` 二进制），导致 `npm run build` 与 `npm run dev` 直接失败。
- 已在 `frontend/package.json` 用 `overrides` 将 rollup 替换为 **@rollup/wasm-node**（纯 WASM 实现、无原生依赖），`npm run dev` 与 `npm run build` 均已验证通过（vue-tsc 类型检查零错误）。
- 换到没有该策略的电脑时，此 overrides 可以保留（完全兼容）或删除。
- 构建时会出现 chunk 超过 500kB 的提示：Element Plus 全量引入所致，属既定技术栈决策，不影响使用。

## 四、推送到 GitHub（已完成）

- 2026-11-18 已通过 SSH-over-443 通道推送到 main：`3f1587c`（11/16–17 设计冻结文档）、`79f818e`（前端全部代码）。
- 本机已配置仓库级 `core.sshCommand`（指向 `~/.ssh/e4_b11_ed25519`），后续在本机直接 `git push` 即可，无需再配置。
- 若在别的电脑上推送，走 SSH 443 通道：在 `~/.ssh/config` 添加 `Host github.com → HostName ssh.github.com / Port 443 / User git`，并把公钥添加到 GitHub 账号。

## 五、目录速览

```
frontend/src/
├── api/           # http.ts（拦截器/ApiError/401 处理）+ 各业务模块薄封装
├── mock/          # db.ts（内存数据）+ handlers.ts（全接口）+ 开关 useMock()
├── types/         # 与 docs/05 契约一致的全部类型与枚举
├── stores/        # auth（sessionStorage token）、categories
├── router/        # 9 路由 + 登录守卫 + 标题
├── layouts/       # DefaultLayout（Header/Footer）
├── components/    # 16 个：状态徽章/骨架屏/空态/错态/确认弹窗/申请卡片/上传/画廊/筛选等
├── composables/   # useApplicationActions（接受/拒绝/完成 二次确认复用）
├── views/         # 9 个页面
└── styles/        # tokens.scss（设计 Token + Element 变量映射）
```

## 六、第二周收尾记录（11/25–11/29 任务）

### 可用性测试（对应 11/25–11/26）

- 浏览器自动化跑通主流程：登录、信息广场筛选搜索、详情页、发布表单、申请提交、个人中心三 Tab。
- 发现并修复 1 个缺陷：详情页"我的申请状态"取最早一条申请，导致拒绝后重新提交时页面仍显示旧的"重新提交"按钮、而提交接口按最新一条校验返回 409。已改为取最新一条申请（`src/mock/handlers.ts` 的 `mockGetPostDetail`），重新提交后状态展示与接口行为一致。
- 曾怀疑"发布页点击分类后页面跳转"，经本地 Playwright 精确复现（hook `history.pushState` 打印调用栈）确认是自动化工具的点击偏差，代码无此问题。
- 回归确认：1366px 桌面与 390px 移动端各关键页面均**无横向滚动**（截图脚本内置溢出检查全部通过）。

### 演示截图（对应 11/28）

- `docs/演示截图/` 共 10 张（桌面 6 张 + 移动 4 张）：首页、登录、信息广场、详情、发布、个人中心。
- 可重复生成：`cd frontend && node screenshot-demo.mjs`（依赖 playwright-core 驱动本机 Chrome/Edge，`npm ci` 已包含）。
- 调试辅助脚本 `frontend/debug-repro.mjs`：登录 → 发布页 → 点击分类/日期并输出跳转调用栈，供复现页面问题使用。

### 操作说明（对应 11/29）

- 演示入口：`npm run dev` 后访问 http://localhost:5173。
- 推荐演示动线：首页（未登录浏览）→ 登录（`student2026` / `Passw0rd!`）→ 信息广场筛选 → 详情页提交申请 → 个人中心"我收到"接受申请（观察其余待处理自动拒绝）→ 完成交接 → 状态变化全程可见。
- 演示注意事项：Mock 种子图片为外网占位图，断网时卡片自动降级为"暂无图片"占位，属预期设计；Mock 数据为内存态，重启 dev server 即恢复种子数据。
