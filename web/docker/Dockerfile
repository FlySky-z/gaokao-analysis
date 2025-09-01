# 使用官方Node.js运行时作为基础镜像
FROM node:20-alpine AS base

# 安装必要的系统依赖
RUN apk add --no-cache libc6-compat

# 安装依赖阶段
FROM base AS deps
WORKDIR /app

# 复制依赖文件
COPY package.json package-lock.json* ./
# 安装依赖
RUN npm ci

# 构建阶段
FROM base AS builder
WORKDIR /app

# 复制已安装的依赖
COPY --from=deps /app/node_modules ./node_modules
# 复制源代码
COPY . ./

# 构建Next.js应用
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# 生产运行阶段
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# 创建nextjs用户
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# 复制构建产物
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 切换到非root用户
USER nextjs

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["node", "server.js"]
