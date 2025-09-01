package config

import (
	"fmt"
	"gaokao-data-analysis/database"
	"gaokao-data-analysis/logs"
	"gaokao-data-analysis/models"
	"os"

	"github.com/joho/godotenv"
)

// loadDotEnvConfig 从 .env 文件加载环境变量
func loadDotEnvConfig() error {
	// 尝试加载 .env 文件，如果存在的话
	err := godotenv.Load()
	if err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("加载 .env 文件错误: %w", err)
	}
	return nil
}

// 初始化 config
func InitConfig() error {
	// 加载配置
	if err := loadDotEnvConfig(); err != nil {
		return fmt.Errorf("加载配置失败: %w", err)
	}

	// 初始化数据库
	if err := database.InitDatabase(); err != nil {
		return fmt.Errorf("初始化数据库失败: %w", err)
	}

	// 自动迁移数据库模型
	if err := database.GetDB().AutoMigrate(&models.UserProfile{}); err != nil {
		return fmt.Errorf("自动迁移数据库模型失败: %w", err)
	}

	// 初始化日志系统
	if err := logs.InitLogger(); err != nil {
		return fmt.Errorf("初始化日志系统失败: %w", err)
	}
	return nil
}
