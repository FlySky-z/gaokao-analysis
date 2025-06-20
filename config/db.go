package config

import (
	"fmt"
	"time"

	"github.com/ClickHouse/clickhouse-go/v2"
)

// 数据库基础配置
type DBConfig struct {
	Host     string
	Port     int
	User     string
	Password string
	Database string
}

// MySQL 数据库特定配置
type MySQLConfig struct {
	DBConfig
	Charset string
}

// ClickHouseConfig 表示 ClickHouse 数据库配置
type ClickHouseConfig struct {
	DBConfig
}

// LoadClickHouseConfig 加载 ClickHouse 数据库配置
func LoadClickHouseConfig() (*ClickHouseConfig, error) {
	config := &ClickHouseConfig{
		DBConfig: DBConfig{
			Host:     getEnv("CLICKHOUSE_HOST", "localhost"),
			Port:     getIntEnv("CLICKHOUSE_PORT", 9000),
			User:     getEnv("CLICKHOUSE_USER", "default"),
			Password: getEnv("CLICKHOUSE_PASSWORD", ""),
			Database: getEnv("CLICKHOUSE_DATABASE", "default"),
		},
	}

	return config, nil
}

// LoadMySQLConfig 加载 MySQL 数据库配置
func LoadMySQLConfig() (*MySQLConfig, error) {
	config := &MySQLConfig{
		DBConfig: DBConfig{
			Host:     getEnv("MYSQL_HOST", "localhost"),
			Port:     getIntEnv("MYSQL_PORT", 3306),
			User:     getEnv("MYSQL_USER", "root"),
			Password: getEnv("MYSQL_PASSWORD", ""),
			Database: getEnv("MYSQL_DATABASE", "gaokao"),
		},
		Charset: getEnv("MYSQL_CHARSET", "utf8mb4"),
	}

	return config, nil
}

// DSN 返回 MySQL 数据库连接字符串
func (c *MySQLConfig) dsn() string {
	return fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=%s&parseTime=true&loc=Local",
		c.User, c.Password, c.Host, c.Port, c.Database, c.Charset)
}

// DSN 返回 ClickHouse 数据库连接字符串
func (c *ClickHouseConfig) createOption() *clickhouse.Options {
	return &clickhouse.Options{
		Addr: []string{
			fmt.Sprintf("%s:%d", c.Host, c.Port),
		},
		Auth: clickhouse.Auth{
			Database: c.Database,
			Username: c.User,
			Password: c.Password,
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
