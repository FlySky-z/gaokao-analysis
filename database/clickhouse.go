package database

import (
	"context"
	"database/sql"
	"fmt"
	"gaokao-data-analysis/utils"
	"log/slog"
	"time"

	"github.com/ClickHouse/clickhouse-go/v2"
)

// initClickHouse 初始化 ClickHouse 数据库连接
func initClickHouse() (*sql.DB, error) {
	option := loadClickHouseConfig()
	conn := clickhouse.OpenDB(option)

	// 测试数据库连接
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := conn.PingContext(ctx); err != nil {
		return nil, fmt.Errorf("连接 ClickHouse 失败: %w", err)
	}

	slog.Info("ClickHouse连接成功",
		"host", option.Addr[0],
		"database", option.Auth.Database,
	)

	return conn, nil
}

// loadClickHouseConfig 加载 ClickHouse 数据库配置
func loadClickHouseConfig() *clickhouse.Options {
	return &clickhouse.Options{
		Addr: []string{
			fmt.Sprintf("%s:%d",
				utils.GetEnv("CLICKHOUSE_HOST", "localhost"),
				utils.GetIntEnv("CLICKHOUSE_PORT", 9000)),
		},
		Auth: clickhouse.Auth{
			Database: utils.GetEnv("CLICKHOUSE_DATABASE", "default"),
			Username: utils.GetEnv("CLICKHOUSE_USER", "default"),
			Password: utils.GetEnv("CLICKHOUSE_PASSWORD", ""),
		},
		Settings: clickhouse.Settings{
			"max_execution_time": 60,
		},
		DialTimeout: 5 * time.Second,
		Compression: &clickhouse.Compression{
			Method: clickhouse.CompressionLZ4,
		},
	}
}
