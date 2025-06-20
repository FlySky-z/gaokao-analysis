package handlers

import (
	"gaokao-data-analysis/database"
	"log/slog"
	"net/http"

	"github.com/gin-gonic/gin"
)

// HealthCheck godoc
// @Summary Show the status of server.
// @Description get the status of server.
// @Tags root
// @Accept */*
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /health [get]
func HealthCheck(c *gin.Context) {
	mysqlDB := database.GetMySQL()
	if mysqlDB == nil {
		slog.Error("健康检查失败", "reason", "数据库连接未初始化")
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Database connection not initialized",
		})
		return
	}

	// 检查数据库连接是否正常
	sqlDB, err := mysqlDB.DB()
	if err != nil {
		slog.Error("健康检查失败", "error", err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "无法获取数据库连接",
		})
		return
	}

	// 测试数据库连接
	if err := sqlDB.Ping(); err != nil {
		slog.Error("健康检查失败", "error", err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "数据库连接不可用: " + err.Error(),
		})
		return
	}

	slog.Info("健康检查成功", "status", "ok")
	c.JSON(http.StatusOK, gin.H{
		"status":  "ok",
		"message": "Service is healthy and database connection is active",
	})
}
