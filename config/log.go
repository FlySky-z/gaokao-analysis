package config

import (
	"io"
	"log/slog"
	"os"
	"time"
)

// LogConfig 日志配置
type LogConfig struct {
	Level      string // 日志级别：debug, info, warn, error
	Format     string // 日志格式：json, text
	OutputPath string // 日志输出路径，为空则输出到标准输出
}

// InitLogger 初始化日志系统
func InitLogger(cfg *LogConfig) error {
	// 设置日志级别
	var level slog.Level
	switch cfg.Level {
	case "debug":
		level = slog.LevelDebug
	case "info":
		level = slog.LevelInfo
	case "warn":
		level = slog.LevelWarn
	case "error":
		level = slog.LevelError
	default:
		level = slog.LevelInfo
	}

	// 设置日志输出
	var output io.Writer = os.Stdout
	if cfg.OutputPath != "" {
		file, err := os.OpenFile(cfg.OutputPath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
		if err != nil {
			return err
		}
		output = file
	}

	// 创建处理器选项
	opts := &slog.HandlerOptions{
		Level: level,
		// 添加时间戳格式化，使用 ISO8601 格式
		ReplaceAttr: func(groups []string, a slog.Attr) slog.Attr {
			if a.Key == slog.TimeKey {
				if t, ok := a.Value.Any().(time.Time); ok {
					return slog.String(slog.TimeKey, t.Format(time.RFC3339))
				}
			}
			return a
		},
	}

	// 根据配置创建合适的处理器
	var handler slog.Handler
	if cfg.Format == "json" {
		handler = slog.NewJSONHandler(output, opts)
	} else {
		handler = slog.NewTextHandler(output, opts)
	}

	// 创建 Logger 实例并设置为默认 logger
	logger := slog.New(handler)

	// 添加默认字段，如服务名称
	logger = logger.With(
		slog.String("service", "gaokao-data-analysis"),
	)

	// 设置为默认 logger
	slog.SetDefault(logger)
	return nil
}

// LoadLogConfig 加载日志配置
func LoadLogConfig() (*LogConfig, error) {
	config := &LogConfig{
		Level:      getEnv("LOG_LEVEL", "info"),
		Format:     getEnv("LOG_FORMAT", "json"),  // 默认使用 JSON 格式便于 Promtail 解析
		OutputPath: getEnv("LOG_OUTPUT_PATH", ""), // 默认输出到标准输出
	}

	return config, nil
}
