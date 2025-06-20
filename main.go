package main

import (
	"log/slog"
	"os"

	"gaokao-data-analysis/config"
	"gaokao-data-analysis/database"
	"gaokao-data-analysis/models"
	"gaokao-data-analysis/routes"
)

func main() {
	// 初始化日志系统
	logConfig, err := config.LoadLogConfig()
	if err != nil {
		slog.Error("加载日志配置失败", "error", err)
		os.Exit(1)
	}

	if err := config.InitLogger(logConfig); err != nil {
		slog.Error("初始化日志系统失败", "error", err)
		os.Exit(1)
	}

	// 初始化配置和数据库连接
	if err := config.InitConfig(); err != nil {
		slog.Error("初始化配置失败", "error", err)
		os.Exit(1)
	}

	// 记录应用程序启动信息
	slog.Info("应用程序初始化完成",
		"version", "1.0.0",
		"environment", os.Getenv("APP_ENV"),
	)

	// Auto migrate database models
	if err := database.GetMySQL().AutoMigrate(&models.UserProfile{}); err != nil {
		slog.Error("数据库迁移失败", "error", err)
		os.Exit(1)
	}

	slog.Info("数据库迁移成功")

	// Setup and run the router
	r := routes.SetupRouter()

	// 获取端口配置，如果没有则使用默认端口
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	slog.Info("启动服务器", "port", port)
	if err := r.Run(":" + port); err != nil {
		slog.Error("服务器启动失败", "error", err)
		os.Exit(1)
	}
}
