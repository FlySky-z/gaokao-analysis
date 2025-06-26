# 高考数据分析系统

一个基于Go和Next.js构建的高考数据分析与志愿填报辅助系统。本项目提供高考录取数据分析、院校专业查询、志愿填报建议等功能，帮助考生和家长做出更明智的升学决策。

## 功能特色

- 📊 **数据分析**: 基于历年录取数据进行统计分析
- 🎯 **志愿填报**: 智能推荐适合的院校和专业
- 📈 **排名转换**: 支持分数与排名的相互转换
- 🔍 **院校查询**: 全面的院校和专业信息检索
- 👤 **用户管理**: 个人档案和偏好设置
- 📱 **响应式设计**: 支持多设备访问

## 技术栈

### 后端
- **Go 1.24+** - 主要开发语言
- **Gin** - Web框架
- **GORM** - ORM框架
- **MySQL** - 主数据库
- **ClickHouse** - 数据分析数据库
- **Swagger** - API文档

### 前端
- **Next.js 14** - React框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **Prisma** - 数据库工具
- **shadcn/ui** - UI组件库

## 快速开始

### 环境要求

- Go 1.24+
- Node.js 18+
- MySQL 8.0+
- ClickHouse (可选，用于数据分析)

### 安装部署

1. **克隆项目**
   ```bash
   git clone https://github.com/yourusername/gaokao-data-analysis.git
   cd gaokao-data-analysis
   ```

2. **后端设置**
   ```bash
   # 安装Go依赖
   go mod download
   
   # 配置环境变量
   cp .env.example .env
   # 编辑.env文件，配置数据库连接等信息
   
   # 启动后端服务
   go run main.go
   ```

3. **前端设置**
   ```bash
   cd web
   
   # 安装依赖
   npm install
   
   # 启动开发服务器
   npm run dev
   ```

4. **使用Docker部署**
   ```bash
   docker-compose up -d
   ```

## API文档

启动服务后，访问 `http://localhost:8080/swagger/index.html` 查看API文档。

## 项目结构

```
├── config/          # 配置文件
├── database/        # 数据库连接
├── handlers/        # 请求处理器
├── models/          # 数据模型
├── routes/          # 路由定义
├── web/            # 前端项目
│   ├── app/        # Next.js应用
│   ├── components/ # React组件
│   └── lib/        # 工具库
└── docs/           # 文档
```

## 贡献指南

欢迎提交Issue和Pull Request！

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开Pull Request

## 许可证

本项目基于MIT许可证开源 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 构建说明

* 使用 [golang Agent](https://github.com/alibaba/opentelemetry-go-auto-instrumentation) 完成自动插桩。

可选参数设置（可不用设置）：

```bash
otel set -verbose                          # print verbose logs
otel set -debug                            # enable debug mode
```
