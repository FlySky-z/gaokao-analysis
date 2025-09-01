package utils

import (
	"os"
	"strconv"
)

// GetEnv 获取环境变量，如果不存在则返回默认值
func GetEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

// GetIntEnv 获取整型环境变量，如果不存在或格式不正确则返回默认值
func GetIntEnv(key string, defaultValue int) int {
	valueStr := GetEnv(key, "")
	if valueStr == "" {
		return defaultValue
	}

	value, err := strconv.Atoi(valueStr)
	if err != nil {
		return defaultValue
	}
	return value
}
