#!/bin/bash

# 构建脚本 - 跨平台编译并构建 Docker 镜像
set -e

echo "=== 高考项目构建脚本 ==="

# 设置变量
PROJECT_NAME="gaokao"
BINARY_NAME="gaokaoZ"
BUILD_DIR="build"
DOCKER_IMAGE_NAME="gaokao:latest"

# 创建构建目录
mkdir -p ${BUILD_DIR}

echo "1. 清理旧的构建文件..."
rm -f ${BUILD_DIR}/${BINARY_NAME}

echo "2. 检查是否存在 otel-darwin-arm64 构建工具..."
if [ ! -f "${BUILD_DIR}/otel-darwin-arm64" ]; then
    echo "错误: ${BUILD_DIR}/otel-darwin-arm64 文件不存在"
    echo "请确保该文件存在后再运行构建脚本"
    exit 1
fi

echo "3. 设置 otel-darwin-arm64 权限..."
chmod +x ${BUILD_DIR}/otel-darwin-arm64

echo "4. 使用 otel 工具跨平台编译 Go 应用 (Linux ARM64)..."
CGO_ENABLED=0 GOOS=linux GOARCH=arm64 ./${BUILD_DIR}/otel-darwin-arm64 go build -a -o ${BUILD_DIR}/${BINARY_NAME} .

echo "5. 设置二进制文件权限..."
chmod +x ${BUILD_DIR}/${BINARY_NAME}

echo "6. 构建 Docker 镜像..."
docker build -t ${DOCKER_IMAGE_NAME} .

echo "7. 构建完成!"
echo "镜像名称: ${DOCKER_IMAGE_NAME}"
echo "二进制文件: ${BUILD_DIR}/${BINARY_NAME}"

# 显示镜像信息
echo ""
echo "=== Docker 镜像信息 ==="
docker images | grep gaokao || echo "未找到 gaokao 镜像"

echo ""
echo "=== 运行镜像命令 ==="
echo "docker run -p 8080:8080 ${DOCKER_IMAGE_NAME}"
