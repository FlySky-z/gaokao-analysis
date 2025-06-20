package database

import (
	"context"
	"database/sql"
	"fmt"
	"log/slog"
	"time"

	"github.com/ClickHouse/clickhouse-go/v2"
)

var ClickHouse *sql.DB // 全局 ClickHouse 数据库连接变量

// InitClickHouse 初始化 ClickHouse 数据库连接
func InitClickHouse(option *clickhouse.Options) error {
	conn := clickhouse.OpenDB(option) // 创建数据库连接

	// 设置连接池参数
	conn.SetMaxIdleConns(5)
	conn.SetMaxOpenConns(20)
	conn.SetConnMaxLifetime(time.Hour)

	// 测试数据库连接
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second) // 设置超时时间为10秒
	defer cancel()

	if err := conn.PingContext(ctx); err != nil {
		return fmt.Errorf("连接 ClickHouse 失败: %w", err)
	}

	ClickHouse = conn // 赋值给全局变量

	// 使用结构化日志记录连接成功信息
	slog.Info("ClickHouse连接成功",
		"host", option.Addr[0],
		"database", option.Auth.Database,
		"max_idle_conns", 5,
		"max_open_conns", 20,
		"conn_max_lifetime", "1h",
	)

	return nil
}

// GetClickHouse 返回已初始化的 ClickHouse 数据库连接
func GetClickHouse() *sql.DB {
	return ClickHouse
}
