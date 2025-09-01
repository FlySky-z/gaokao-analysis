# 高考志愿分析系统

一个基于Next.js的高考志愿填报分析系统，帮助考生做出更明智的大学和专业选择。

## 特性

- 📊 分数线趋势分析：分析历年各高校各专业的分数线走势
- 🧠 智能志愿推荐：根据分数、兴趣和地域偏好，智能推荐最适合的院校和专业
- 🎯 院校专业对比：多维度对比不同院校和专业，助您做出最优选择
- 🔒 安全的用户认证系统：基于Next.js Auth和Prisma的认证系统

## 开始使用

### 环境准备

确保您的系统已安装：

- Node.js 18.17.0或更高版本
- npm, yarn或pnpm

### 安装

1. 克隆项目

```bash
git clone <项目仓库URL>
cd gaokao
```

2. 安装依赖

```bash
npm install
# 或
yarn install
# 或
pnpm install
```

如果需要安装ts-node来运行脚本（如果未包含在开发依赖中）：

```bash
npm install -D ts-node
# 或
yarn add -D ts-node
# 或
pnpm add -D ts-node
```

3. 设置环境变量(可选)

创建`.env`文件并添加必要的环境变量：

```
# 数据库
DATABASE_URL="file:./dev.db"

# Next Auth
# 生成密钥: openssl rand -base64 32
AUTH_SECRET="your-secret-key"
```

4. 初始化数据库

```bash
npx ts-node -r dotenv/config ./scripts/sequelize-init.ts
```

这将：
- 生成Prisma客户端，使应用能够与数据库交互
- 创建SQLite数据库文件 (prisma/dev.db)
- 应用初始迁移，创建必要的数据表（包括User表）

5. 创建管理员用户

```bash
make init
```

脚本将自动创建一个默认管理员账户：
- 用户名: admin
- 密码: admin
- 邮箱: admin@example.com

您可以在登录后修改这些默认凭据。

6. 启动开发服务器

```bash
npm run dev
# 或
yarn dev
# 或
pnpm dev
```

访问[http://localhost:3000](http://localhost:3000)即可查看系统。

### 登录系统

使用在第5步创建的管理员账户登录系统：

登录成功后，您将被重定向到仪表盘页面(/dashboard)，在那里您可以开始使用系统的各项功能。

> **安全提示**: 在生产环境中，请务必修改默认的管理员密码。

## 项目结构

```
app/                 # Next.js应用页面
  page.tsx           # 首页
  login/             # 登录页面
  dashboard/         # 用户仪表盘
components/          # UI组件
  ui/                # UI基础组件
lib/                 # 工具库和业务逻辑
  model/             # 数据模型
prisma/              # Prisma数据库配置
  schema.prisma      # 数据库schema
scripts/             # 工具脚本
  create-admin.ts    # 创建管理员用户脚本
```

## 技术栈

- **前端框架**: Next.js 15
- **UI组件**: shadcn/ui
- **状态管理**: React Hooks
- **认证**: NextAuth.js

## 开发

### 添加新功能

1. 创建新的页面组件在`app/`目录下
2. 添加需要的API端点在`app/api/`目录下
3. 如需修改数据库模型，编辑`prisma/schema.prisma`然后运行`npx prisma migrate dev`

### 构建生产版本

```bash
npm run build
# 或
yarn build
# 或
pnpm build
```

## 部署

### Docker 部署 (推荐)

使用Docker可以快速部署应用，无需配置复杂的环境：

```bash
# build
make build
```

或通过docker/docker-compose.yml部署：

```bash
make compose-up
```

部署成功后访问 http://localhost:3000

详细的Docker部署指南请参考：[DOCKER-DEPLOY.md](./DOCKER-DEPLOY.md)

### Vercel 部署

本项目可以部署到Vercel平台：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/gaokao)

或者按照[Next.js部署文档](https://nextjs.org/docs/app/building-your-application/deploying)进行部署。

## 贡献

欢迎贡献代码、报告问题或提出新功能建议。

## 许可

[MIT](LICENSE)
