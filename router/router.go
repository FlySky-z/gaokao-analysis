package routes

import (
	"os"

	"gaokao-data-analysis/handlers"

	"github.com/gin-gonic/gin"
)

// SetupRouter sets up the gin router and all routes
func SetupRouter() *gin.Engine {
	mode := os.Getenv("GIN_MODE")
	if mode == "" {
		mode = gin.ReleaseMode
	}
	gin.SetMode(mode)

	r := gin.Default()

	// API Routes
	api := r.Group("/api")
	{
		// Health Check Route
		api.GET("/health", handlers.HealthCheck)
		// User Profile Routes
		api.POST("/profile/create", handlers.CreateUserProfile)
		api.GET("/profile/:id", handlers.GetUserProfile)

		// Voluntary Routes
		voluntary := api.Group("/voluntary")
		{
			voluntary.POST("/universityPriority", handlers.UniversityPriorityVoluntary)
			voluntary.POST("/majorPriority", handlers.MajorPriorityVoluntary)
			voluntary.POST("/majorGroup", handlers.GetMajorGroupDetailsHandler)
		}

		// Options Routes
		options := api.Group("/options")
		{
			options.GET("/provinces", handlers.GetProvinceOptions)
		}

		// Score Rank Routes
		scoreRank := api.Group("/rank")
		{
			scoreRank.GET("/getRank", handlers.GetScoreRank)
			scoreRank.GET("/getScore", handlers.GetRankToScore)
		}
	}

	return r
}
