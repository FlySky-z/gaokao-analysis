# 使用轻量级的 Alpine Linux 作为基础镜像
FROM alpine:latest

# 安装运行时依赖
RUN apk add --no-cache ca-certificates tzdata

# 设置时区
RUN ln -s /usr/share/zoneinfo/Asia/Shanghai /etc/localtime

# 创建非 root 用户
RUN adduser -D -s /bin/sh appuser

# 设置工作目录
WORKDIR /app

# 复制本地编译好的应用二进制文件
COPY build/gaokaoZ .

# 复制配置文件和静态资源
COPY static/ ./static/
COPY positions/ ./positions/

# 设置文件权限
RUN chmod +x gaokaoZ && \
    chown -R appuser:appuser /app

# 切换到非 root 用户
USER appuser

# 暴露端口
EXPOSE 8080

# 启动命令
CMD ["./gaokaoZ"]