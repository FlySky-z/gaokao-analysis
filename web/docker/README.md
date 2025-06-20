# Docker 使用说明

## 🚀 快速开始

项目已使用 **Makefile** 统一管理所有 Docker 操作，无需多个脚本文件。

### 基本命令

```bash
# 查看所有可用命令
make help

# 构建镜像
make build

# 构建指定版本
make build TAG=v1.0.0

# 本地运行（使用默认管理员：admin/admin123）
make run

# 使用自定义管理员信息运行
make run-custom
```

## 🔧 管理员用户配置

容器支持通过环境变量配置管理员用户信息：

### 环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `ADMIN_USERNAME` | `admin` | 管理员用户名 |
| `ADMIN_EMAIL` | `admin@example.com` | 管理员邮箱 |
| `ADMIN_PASSWORD` | `admin123` | 管理员密码 |

### 使用方法

1. **使用默认管理员信息运行**：
```bash
make run
# 默认用户名: admin
# 默认密码: admin123
```

2. **通过环境变量设置**：
```bash
ADMIN_USERNAME=myuser ADMIN_EMAIL=user@domain.com ADMIN_PASSWORD=mypass123 make run
```

3. **交互式设置**：
```bash
make run-custom
# 会提示输入用户名、邮箱和密码
```

4. **使用 .env 文件**：
```bash
# 复制示例环境文件
cp docker/.env.example docker/.env

# 编辑 .env 文件设置你的管理员信息
vim docker/.env

# 使用 docker-compose 启动
make compose-up
```

# 构建并推送到阿里云
make deploy

# 使用 docker-compose
make compose-up
```

### 常用操作

| 命令 | 说明 |
|------|------|
| `make build` | 构建 Docker 镜像 |
| `make push` | 推送到阿里云 |
| `make deploy` | 构建并推送 |
| `make run` | 本地运行 |
| `make test` | 测试镜像 |
| `make compose-up` | Docker Compose 启动 |
| `make clean` | 清理资源 |
| `make info` | 显示系统信息 |

### 快捷别名

- `make b` = `make build`
- `make p` = `make push`  
- `make d` = `make deploy`
- `make r` = `make run`

## 📁 文件结构

```
gaokao/
├── Makefile              # 统一构建管理
├── .dockerignore        # 根目录忽略文件
└── docker/
    ├── Dockerfile       # 多阶段构建
    ├── docker-compose.yml
    └── docker-entrypoint.sh
```

## 🔧 配置

所有配置都在 `Makefile` 中，可以通过环境变量覆盖：

```bash
# 自定义镜像名称和标签
make build IMAGE_NAME=my-app TAG=dev

# 使用不同的 registry
make push REGISTRY_URL=your-registry.com
```

## 📝 最佳实践

1. **开发环境**: `make dev` (构建并测试)
2. **生产部署**: `make deploy TAG=v1.0.0`
3. **快速测试**: `make test`
4. **资源清理**: `make clean`

所有操作都会自动检查环境和依赖，确保安全执行。
