# scripts — 一键启动 / 关闭

面向本项目的开发与演示脚本，无需记忆多条命令。

## 快速使用

```powershell
# 一键启动（MySQL + 后端 + 前端，启动后自动打开浏览器）
powershell -ExecutionPolicy Bypass -File scripts\start-all.ps1

# 一键关闭
powershell -ExecutionPolicy Bypass -File scripts\stop-all.ps1
```

启动成功后浏览器打开 **http://localhost:5173**，用 `student2026 / Passw0rd!` 登录即可操作。

## 脚本说明

| 文件 | 作用 |
|---|---|
| `start-all.ps1` | 按依赖顺序启动 MySQL 3307 → 后端 3000 → 前端 5173，每步等待就绪 |
| `stop-all.ps1` | 逆序关闭前端 → 后端 → MySQL，仅杀本项目端口上的进程 |
| `_run-backend.ps1` | 后端启动器（由 start-all 以独立进程调用，内部写日志） |
| `_run-frontend.ps1` | 前端启动器（同上） |

> `_run-*.ps1` 是内部脚本，一般不需要直接调用。

## 参数

### start-all.ps1

| 参数 | 说明 |
|---|---|
| `-NoBrowser` | 不自动打开浏览器 |
| `-SkipDeps` | 跳过 node_modules / .env 检查（更快，但依赖缺失时会启动失败） |

```powershell
powershell -ExecutionPolicy Bypass -File scripts\start-all.ps1 -NoBrowser
```

### stop-all.ps1

| 参数 | 说明 |
|---|---|
| `-KeepMySQL` | 保留 MySQL 运行（下次启动更快，适合频繁重启前后端） |

```powershell
powershell -ExecutionPolicy Bypass -File scripts\stop-all.ps1 -KeepMySQL
```

## 脚本做了什么

### 启动流程

1. **前置检查**：node / npm 是否存在，`backend/node_modules`、`frontend/node_modules`、两侧 `.env` 是否就绪
2. **启动 MySQL（3307）**
   - 已在运行则跳过
   - 否则调用 `D:\dsh_project\.tools\start-mysql-lf.ps1`
   - **必须 SQL 连通**才算就绪（仅端口通不够，MySQL 启动初期会拒绝连接）
3. **启动后端（3000）**
   - Prisma Client 缺失或比 schema 旧时，自动执行 `npx prisma generate`
   - 以独立 PowerShell 进程运行 `npm run dev`，日志写入 `logs/backend.out.log`
   - 等待 `/health` 返回 200，最长 90 秒
4. **启动前端（5173）**
   - 同样以独立进程运行，日志写入 `logs/frontend.out.log`
   - 等待首页返回 200，最长 90 秒
5. 打印访问地址与演示账号，可选自动开浏览器

### 关闭流程

1. 关闭前端（5173）→ 关闭后端（3000）→ 关闭 MySQL（3307）
2. 关闭前校验进程命令行含项目路径，**不会误杀其他 node 进程**
3. 最后逐项核验端口是否已释放

## 常见问题

| 现象 | 原因与处理 |
|---|---|
| 提示「node_modules 不存在」 | 先在对应目录执行 `npm ci` |
| 提示「.env 不存在」 | 执行 `Copy-Item backend/.env.example backend/.env`（前端同理） |
| 后端启动超时 | 查看 `logs/backend.out.log`；常见原因是数据库未就绪或 `.env` 里 `DATABASE_URL` 端口写错 |
| 前端启动超时 | 查看 `logs/frontend.out.log`；常见原因是 5173 被占用 |
| 关闭后端口仍占用 | 用管理员权限执行 `Get-NetTCPConnection -LocalPort <端口>` 排查 |

## 端口占用说明

| 服务 | 端口 | 监听 |
|---|---|---|
| 前端 Vite | 5173 | **仅 IPv6 (`::1`)**，浏览器访问 `localhost` 正常 |
| 后端 API | 3000 | IPv4 + IPv6 |
| MySQL | 3307 | IPv4 + IPv6 |

脚本的端口探测会同时检查 IPv4 与 IPv6，避免因 Vite 只监听 IPv6 而误判服务未启动。
