package database

import (
	"database/sql"
	"fmt"
	"gaokao-data-analysis/utils"
	"log/slog"
	"time"

	sloggorm "github.com/orandin/slog-gorm"
	"gorm.io/driver/mysql"
	"gorm.io/driver/sqlite"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var (
	db         *gorm.DB
	clickHouse *sql.DB
)

// GetDB returns the initialized database connection
func GetDB() *gorm.DB {
	return db
}

// GetClickHouse returns the initialized ClickHouse connection
func GetClickHouse() *sql.DB {
	return clickHouse
}

// InitDatabase initializes the database connection based on DB_TYPE environment variable
func InitDatabase() error {
	dbType := utils.GetEnv("DB_TYPE", "mysql")

	switch dbType {
	case "mysql":
		initMySQL()
	case "postgres", "postgresql":
		initPostgreSQL()
	case "sqlite", "sqlite3":
		initSQLite()
	default:
		return fmt.Errorf("unsupported database type: %s", dbType)
	}

	var err error
	clickHouse, err = initClickHouse()
	if err != nil {
		return err
	}

	return nil
}

// initMySQL 初始化MySQL数据库连接
func initMySQL() error {
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=%s&parseTime=true&loc=Local",
		utils.GetEnv("DB_USER", "root"),
		utils.GetEnv("DB_PASSWORD", ""),
		utils.GetEnv("DB_HOST", "localhost"),
		utils.GetIntEnv("DB_PORT", 3306),
		utils.GetEnv("DB_DATABASE", "gaokao"),
		utils.GetEnv("DB_CHARSET", "utf8mb4"))

	slogLogger := sloggorm.New(
		sloggorm.WithHandler(slog.Default().Handler()),   // 使用默认的slog记录器
		sloggorm.WithTraceAll(),                          // 记录所有SQL语句
		sloggorm.WithSlowThreshold(200*time.Millisecond), // 设置慢查询阈值
	)

	gormConfig := &gorm.Config{
		Logger: slogLogger,
	}

	var err error
	db, err = gorm.Open(mysql.Open(dsn), gormConfig)
	if err != nil {
		return fmt.Errorf("failed to connect to MySQL: %w", err)
	}

	slog.Info("MySQL连接成功",
		"database", utils.GetEnv("DB_DATABASE", "gaokao"),
		"host", utils.GetEnv("DB_HOST", "localhost"),
		"port", utils.GetIntEnv("DB_PORT", 3306))
	return nil
}

// initPostgreSQL 初始化PostgreSQL数据库连接
func initPostgreSQL() error {
	// PostgreSQL DSN format: postgres://username:password@localhost:5432/database_name?sslmode=disable
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%d sslmode=%s TimeZone=%s",
		utils.GetEnv("DB_HOST", "localhost"),
		utils.GetEnv("DB_USER", "postgres"),
		utils.GetEnv("DB_PASSWORD", ""),
		utils.GetEnv("DB_DATABASE", "gaokao"),
		utils.GetIntEnv("DB_PORT", 5432),
		utils.GetEnv("DB_SSL", "disable"),
		utils.GetEnv("DB_TIMEZONE", "Asia/Shanghai"))

	slogLogger := sloggorm.New(
		sloggorm.WithHandler(slog.Default().Handler()),
		sloggorm.WithTraceAll(),
		sloggorm.WithSlowThreshold(200*time.Millisecond),
	)

	gormConfig := &gorm.Config{
		Logger: slogLogger,
	}

	var err error
	db, err = gorm.Open(postgres.Open(dsn), gormConfig)
	if err != nil {
		return fmt.Errorf("failed to connect to PostgreSQL: %w", err)
	}

	slog.Info("PostgreSQL连接成功",
		"database", utils.GetEnv("DB_DATABASE", "gaokao"),
		"host", utils.GetEnv("DB_HOST", "localhost"),
		"port", utils.GetIntEnv("DB_PORT", 5432))
	return nil
}

// initSQLite 初始化SQLite数据库连接
func initSQLite() error {
	dbPath := utils.GetEnv("DB_PATH", "./database/gaokao.db")

	slogLogger := sloggorm.New(
		sloggorm.WithHandler(slog.Default().Handler()),
		sloggorm.WithTraceAll(),
		sloggorm.WithSlowThreshold(200*time.Millisecond),
	)

	gormConfig := &gorm.Config{
		Logger: slogLogger,
	}

	var err error
	db, err = gorm.Open(sqlite.Open(dbPath), gormConfig)
	if err != nil {
		return fmt.Errorf("failed to connect to SQLite: %w", err)
	}

	slog.Info("SQLite连接成功", "path", dbPath)
	return nil
}
