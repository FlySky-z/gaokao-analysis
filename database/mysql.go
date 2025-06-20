package database

import (
	"fmt"
	"log/slog"
	"time"

	sloggorm "github.com/orandin/slog-gorm"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var MySQL *gorm.DB

// InitMySQL initializes the MySQL database connection using GORM
func InitMySQL(dsn string) error {
	// 使用slog-gorm库作为GORM日志记录器
	slogLogger := sloggorm.New(
		sloggorm.WithHandler(slog.Default().Handler()),   // 使用默认的slog记录器
		sloggorm.WithTraceAll(),                          // 记录所有SQL语句
		sloggorm.WithSlowThreshold(200*time.Millisecond), // 设置慢查询阈值
	)

	gormConfig := &gorm.Config{
		Logger: slogLogger,
	}

	var err error
	MySQL, err = gorm.Open(mysql.Open(dsn), gormConfig)
	if err != nil {
		return fmt.Errorf("failed to connect to MySQL: %w", err)
	}

	// Configure connection pool
	sqlDB, err := MySQL.DB()
	if err != nil {
		return fmt.Errorf("failed to get DB instance: %w", err)
	}

	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

	slog.Info("MySQL连接成功",
		"dsn", maskDSN(dsn),
		"max_idle_conns", 10,
		"max_open_conns", 100,
		"conn_max_lifetime", "1h",
	)
	return nil
}

// maskDSN 屏蔽DSN中的敏感信息，适合日志输出
func maskDSN(dsn string) string {
	// 简单屏蔽DSN中的密码部分
	// 例如: user:password@tcp(host:port)/dbname?params
	// 返回: user:***@tcp(host:port)/dbname?params

	at := -1
	colon := -1
	for i := 0; i < len(dsn); i++ {
		if dsn[i] == ':' && colon == -1 {
			colon = i
		}
		if dsn[i] == '@' {
			at = i
			break
		}
	}
	if colon != -1 && at != -1 && colon < at {
		return dsn[:colon+1] + "***" + dsn[at:]
	}
	return dsn
}

// GetMySQL returns the initialized MySQL database connection
func GetMySQL() *gorm.DB {
	return MySQL
}
