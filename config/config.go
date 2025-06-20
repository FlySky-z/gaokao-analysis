package config

import (
	"fmt"
	"gaokao-data-analysis/database"
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

	// 加载日志配置并初始化日志系统
	logConfig, err := LoadLogConfig()
	if err != nil {
		return fmt.Errorf("加载日志配置失败: %w", err)
	}

	if err := InitLogger(logConfig); err != nil {
		return fmt.Errorf("初始化日志系统失败: %w", err)
	}

	// 加载 MySQL 和 ClickHouse 配置
	mysqlConfig, err := LoadMySQLConfig()
	if err != nil {
		return fmt.Errorf("加载 MySQL 配置失败: %w", err)
	}

	clickHouseConfig, err := LoadClickHouseConfig()
	if err != nil {
		return fmt.Errorf("加载 ClickHouse 配置失败: %w", err)
	}

	// 初始化数据库
	if err := database.InitMySQL(mysqlConfig.dsn()); err != nil {
		return fmt.Errorf("初始化 MySQL 失败: %w", err)
	}

	if err := database.InitClickHouse(clickHouseConfig.createOption()); err != nil {
		return fmt.Errorf("初始化 ClickHouse 失败: %w", err)
	}

	return nil
}
