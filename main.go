package main

import (
	"log/slog"
	"os"

	"gaokao-data-analysis/config"
	routes "gaokao-data-analysis/router"
	"gaokao-data-analysis/utils"
)

func main() {
	// 初始化配置和数据库连接
	if err := config.InitConfig(); err != nil {
		slog.Error("初始化配置失败", "error", err)
		os.Exit(1)
	}

	// 记录应用程序启动信息
	version := utils.GetEnv("APP_VERSION", "unknown")
	slog.Info("应用程序初始化完成",
		"version", version,
		"environment", utils.GetEnv("GIN_MODE", "release"),
	)

	// 设置路由
	r := routes.SetupRouter()

	// 获取端口配置
	port := utils.GetEnv("PORT", "8080")

	slog.Info("启动服务器", "port", port)
	if err := r.Run(":" + port); err != nil {
		slog.Error("服务器启动失败", "error", err)
		os.Exit(1)
	}
}
