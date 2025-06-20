package routes

import (
	"gaokao-data-analysis/handlers"

	"github.com/gin-gonic/gin"
)

// SetupRouter sets up the gin router and all routes
func SetupRouter() *gin.Engine {
	r := gin.Default()

	// Health Check Route
	r.GET("/health", handlers.HealthCheck)

	// API Routes
	api := r.Group("/api")
	{
		// User Profile Routes
		api.POST("/profile/create", handlers.CreateUserProfile)
		api.GET("/profile/:id", handlers.GetUserProfile)

		// Voluntary Routes
		voluntary := api.Group("/voluntary")
		{
			voluntary.POST("/universityPriority", handlers.UniversityPriorityVoluntary)
			voluntary.POST("/majorGroup", handlers.GetMajorGroupDetailsHandler)
		}
	}

	return r
}
