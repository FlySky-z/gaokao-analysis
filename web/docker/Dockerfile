# 使用官方Node.js运行时作为基础镜像
FROM node:20-alpine AS base

# 安装必要的系统依赖
RUN apk add --no-cache libc6-compat wget openssl

# 安装依赖阶段
FROM base AS deps
WORKDIR /app

# 复制依赖文件（从项目根目录）
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
# 安装依赖（优化缓存）
RUN \
  if [ -f yarn.lock ]; then yarn install --frozen-lockfile --production=false; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable && pnpm install --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# 构建阶段
FROM base AS builder
WORKDIR /app

# 复制已安装的依赖
COPY --from=deps /app/node_modules ./node_modules

# 复制源代码
COPY . ./

# 复制 Prisma schema
COPY prisma ./prisma

# 生成Prisma客户端
RUN npx prisma generate

RUN npx prisma db push

# 构建Next.js应用
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# 生产运行阶段
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 创建nextjs用户（安全性）
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# 复制必要的文件
COPY --from=builder /app/public ./public

# 复制构建产物（利用 Next.js 输出跟踪优化）
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 复制Prisma相关文件
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# 复制脚本文件（如果存在）
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

# 复制并设置入口脚本
COPY --from=builder --chown=nextjs:nodejs /app/docker/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh

# 确保 nextjs 用户对工作目录有写权限
RUN chown -R nextjs:nodejs /app

# 切换到非root用户
USER nextjs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# 使用入口脚本启动
ENTRYPOINT ["./docker-entrypoint.sh"]
