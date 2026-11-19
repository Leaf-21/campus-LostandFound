# 校园失物招领平台后端生产镜像
# 多阶段构建：依赖 → 编译 → 精简运行镜像

# ---------- 依赖层 ----------
FROM node:26-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
# 安装全部依赖（含 devDependencies，编译阶段需要 tsc/prisma CLI）
RUN npm ci --no-audit --no-fund

# ---------- 编译层 ----------
FROM node:26-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY . .
# 生成 Prisma Client 并编译 TypeScript
RUN npx prisma generate && npm run build
# 只保留生产依赖，减小镜像体积
RUN npm prune --omit=dev

# ---------- 运行层 ----------
FROM node:26-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# 运行期只需编译产物 + 生产依赖 + Prisma 迁移文件
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./package.json

# 上传目录（compose 中挂载 volume 持久化）
RUN mkdir -p /app/uploads

EXPOSE 3000

# 容器健康检查：/health 返回 200 即健康
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# 启动前不自动迁移：由部署流程显式执行 migrate deploy（见 docs/14）
CMD ["node", "dist/server.js"]
