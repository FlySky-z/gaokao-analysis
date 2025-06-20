# 高考志愿分析系统 Makefile
# 统一管理所有 Docker 操作

# 配置变量
IMAGE_NAME := gaokao-app
REGISTRY_URL := crpi-26y0ojkffc2rawdg.cn-hangzhou.personal.cr.aliyuncs.com
USERNAME := 天空_ice
NAMESPACE := flyskyz
REMOTE_IMAGE_NAME := gaokao
TAG ?= latest
DOCKERFILE_PATH := docker/Dockerfile

# 默认目标
.DEFAULT_GOAL := help

.PHONY: help
help: ## 显示帮助信息
	@echo "\033[0;34m🐳 高考志愿分析系统 - Docker 管理\033[0m"
	@echo "=================================="
	@echo ""
	@echo "\033[0;32m可用命令:\033[0m"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[0;34m%-15s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""
	@echo "\033[1;33m示例:\033[0m"
	@echo "  make build TAG=v1.0.0     # 构建指定版本"
	@echo "  make deploy               # 构建并推送 latest"
	@echo "  make run                  # 本地运行"
	@echo "  make clean                # 清理资源"

.PHONY: check
check: ## 检查环境
	@echo "\033[0;34m📋 检查环境...\033[0m"
	@if [ ! -f "package.json" ] || [ ! -d "docker" ]; then \
		echo "\033[0;31m❌ 请在项目根目录运行 make 命令\033[0m"; \
		exit 1; \
	fi
	@if ! docker info >/dev/null 2>&1; then \
		echo "\033[0;31m❌ Docker 未运行，请启动 Docker Desktop\033[0m"; \
		exit 1; \
	fi
	@echo "\033[0;32m✅ 环境检查通过\033[0m"

.PHONY: build
build: check ## 构建 Docker 镜像
	@echo "\033[0;34m🏗️  构建 Docker 镜像...\033[0m"
	@echo "镜像: $(IMAGE_NAME):$(TAG)"
	@echo "Dockerfile: $(DOCKERFILE_PATH)"
	@echo ""
	docker build -f $(DOCKERFILE_PATH) -t $(IMAGE_NAME):$(TAG) .
	@echo "\033[0;32m✅ 构建完成!\033[0m"
	@docker images | grep "$(IMAGE_NAME)" | head -1

.PHONY: push
push: check ## 推送镜像到阿里云
	@echo "\033[0;34m📤 推送镜像到阿里云...\033[0m"
	@if ! docker image inspect $(IMAGE_NAME):$(TAG) >/dev/null 2>&1; then \
		echo "\033[0;31m❌ 镜像 $(IMAGE_NAME):$(TAG) 不存在\033[0m"; \
		echo "\033[1;33m请先运行: make build TAG=$(TAG)\033[0m"; \
		exit 1; \
	fi
	@echo "正在为镜像打标签..."
	docker tag $(IMAGE_NAME):$(TAG) $(REGISTRY_URL)/$(NAMESPACE)/$(REMOTE_IMAGE_NAME):$(TAG)
	@echo "正在推送镜像..."
	docker push $(REGISTRY_URL)/$(NAMESPACE)/$(REMOTE_IMAGE_NAME):$(TAG)
	@echo "\033[0;32m✅ 推送成功!\033[0m"
	@echo "镜像地址: $(REGISTRY_URL)/$(NAMESPACE)/$(REMOTE_IMAGE_NAME):$(TAG)"
	@docker rmi $(REGISTRY_URL)/$(NAMESPACE)/$(REMOTE_IMAGE_NAME):$(TAG) || true

.PHONY: deploy
deploy: build push ## 构建并推送镜像
	@echo "\033[0;32m🎉 部署完成!\033[0m"

.PHONY: run
run: check ## 本地运行镜像
	@echo "\033[0;34m🚀 本地运行镜像...\033[0m"
	@if ! docker image inspect $(IMAGE_NAME):$(TAG) >/dev/null 2>&1; then \
		echo "\033[0;31m❌ 镜像 $(IMAGE_NAME):$(TAG) 不存在\033[0m"; \
		echo "\033[1;33m请先运行: make build TAG=$(TAG)\033[0m"; \
		exit 1; \
	fi
	docker run --rm -it -p 3000:3000 \
		-e ADMIN_USERNAME=$${ADMIN_USERNAME:-admin} \
		-e ADMIN_EMAIL=$${ADMIN_EMAIL:-admin@example.com} \
		-e ADMIN_PASSWORD=$${ADMIN_PASSWORD:-admin123} \
		--name gaokao-app $(IMAGE_NAME):$(TAG)

.PHONY: run-custom
run-custom: check ## 使用自定义管理员信息运行镜像
	@echo "\033[0;34m🚀 使用自定义管理员信息运行镜像...\033[0m"
	@if ! docker image inspect $(IMAGE_NAME):$(TAG) >/dev/null 2>&1; then \
		echo "\033[0;31m❌ 镜像 $(IMAGE_NAME):$(TAG) 不存在\033[0m"; \
		echo "\033[1;33m请先运行: make build TAG=$(TAG)\033[0m"; \
		exit 1; \
	fi
	@echo "请输入管理员信息："
	@read -p "用户名 (默认: admin): " username; \
	read -p "邮箱 (默认: admin@example.com): " email; \
	read -s -p "密码 (默认: admin123): " password; \
	echo ""; \
	docker run --rm -it -p 3000:3000 \
		-e ADMIN_USERNAME=$${username:-admin} \
		-e ADMIN_EMAIL=$${email:-admin@example.com} \
		-e ADMIN_PASSWORD=$${password:-admin123} \
		--name gaokao-app $(IMAGE_NAME):$(TAG)

.PHONY: test
test: check ## 测试镜像
	@echo "\033[0;34m🧪 测试镜像...\033[0m"
	@if ! docker image inspect $(IMAGE_NAME):$(TAG) >/dev/null 2>&1; then \
		echo "\033[0;31m❌ 镜像 $(IMAGE_NAME):$(TAG) 不存在\033[0m"; \
		exit 1; \
	fi
	@echo "启动测试容器..."
	@docker run --rm -d --name gaokao-test -p 3000:3000 $(IMAGE_NAME):$(TAG)
	@echo "\033[0;32m✅ 测试容器已启动\033[0m"
	@echo "访问地址: http://localhost:3000"
	@echo "\033[1;33m按 Enter 停止测试容器...\033[0m"
	@read dummy
	@docker stop gaokao-test || true
	@echo "\033[0;32m✅ 测试完成\033[0m"

.PHONY: compose-up
compose-up: check ## 使用 docker-compose 启动
	@echo "\033[0;34m🐙 使用 Docker Compose 启动...\033[0m"
	cd docker && docker-compose up -d
	@echo "\033[0;32m✅ 服务已启动\033[0m"
	@echo "访问地址: http://localhost:3000"
	@echo "默认管理员: admin/admin123"
	@echo "查看日志: make logs"
	@echo "停止服务: make compose-down"

.PHONY: compose-up-custom
compose-up-custom: check ## 使用自定义管理员信息启动 docker-compose
	@echo "\033[0;34m🐙 使用自定义管理员信息启动 Docker Compose...\033[0m"
	@echo "请输入管理员信息："
	@read -p "用户名 (默认: admin): " username; \
	read -p "邮箱 (默认: admin@example.com): " email; \
	read -s -p "密码 (默认: admin123): " password; \
	echo ""; \
	cd docker && ADMIN_USERNAME=$${username:-admin} \
		ADMIN_EMAIL=$${email:-admin@example.com} \
		ADMIN_PASSWORD=$${password:-admin123} \
		docker-compose up -d
	@echo "\033[0;32m✅ 服务已启动\033[0m"
	@echo "访问地址: http://localhost:3000"
	@echo "查看日志: make logs"
	@echo "停止服务: make compose-down"

.PHONY: compose-down
compose-down: ## 停止 docker-compose 服务
	@echo "\033[0;34m🛑 停止 Docker Compose 服务...\033[0m"
	cd docker && docker-compose down
	@echo "\033[0;32m✅ 服务已停止\033[0m"

.PHONY: logs
logs: ## 查看 docker-compose 日志
	cd docker && docker-compose logs -f

.PHONY: clean
clean: check ## 清理 Docker 资源
	@echo "\033[0;34m🧹 清理 Docker 资源...\033[0m"
	@echo "当前磁盘使用:"
	@docker system df
	@echo ""
	@echo "清理悬空镜像..."
	@docker image prune -f
	@echo "清理构建缓存..."
	@docker builder prune -f
	@echo "\033[0;32m✅ 清理完成\033[0m"
	@echo ""
	@echo "清理后磁盘使用:"
	@docker system df

.PHONY: clean-all
clean-all: check ## 清理所有未使用的 Docker 资源
	@echo "\033[0;34m🧹 深度清理 Docker 资源...\033[0m"
	@echo "\033[1;33m⚠️  这将删除所有未使用的镜像、容器、网络和卷\033[0m"
	@echo -n "确认继续? [y/N]: "
	@read answer; \
	if [ "$$answer" = "y" ] || [ "$$answer" = "Y" ]; then \
		docker system prune -a -f --volumes; \
		echo "\033[0;32m✅ 深度清理完成\033[0m"; \
	else \
		echo "\033[1;33m已取消\033[0m"; \
	fi

.PHONY: info
info: check ## 显示系统信息
	@echo "\033[0;34m📊 Docker 系统信息\033[0m"
	@echo "==================="
	@echo ""
	@echo "\033[0;32m本地镜像:\033[0m"
	@docker images | grep -E "(REPOSITORY|$(IMAGE_NAME))" || echo "未找到相关镜像"
	@echo ""
	@echo "\033[0;32m运行中的容器:\033[0m"
	@docker ps | grep -E "(CONTAINER|gaokao)" || echo "无相关容器运行"
	@echo ""
	@echo "\033[0;32m磁盘使用:\033[0m"
	@docker system df

.PHONY: login
login: ## 登录阿里云容器镜像服务
	@echo "\033[0;34m🔑 登录阿里云容器镜像服务...\033[0m"
	docker login --username=$(USERNAME) $(REGISTRY_URL)

.PHONY: dev
dev: ## 开发模式（构建并运行）
	@echo "\033[0;34m🔧 开发模式启动...\033[0m"
	$(MAKE) build
	$(MAKE) test

.PHONY: init
init: ## 初始化项目（安装依赖等）
	@echo "\033[0;34m🔄 初始化项目...\033[0m"
	@if [ ! -f "scripts/init_env.sh" ]; then \
		echo "\033[0;31m❌ 未找到 scripts/init_env.sh，请在项目根目录运行\033[0m"; \
		exit 1; \
	fi
	@chmod +x scripts/init_env.sh
	@./scripts/init_env.sh
	@echo "\033[0;32m✅ 项目初始化完成\033[0m"

# 快速命令别名
.PHONY: b p d r
b: build    ## 别名: build
p: push     ## 别名: push  
d: deploy   ## 别名: deploy
r: run      ## 别名: run
