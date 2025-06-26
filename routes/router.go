package routes

import (
	"gaokao-data-analysis/handlers"
	"os"

	"github.com/gin-gonic/gin"
)

// SetupRouter sets up the gin router and all routes
func SetupRouter() *gin.Engine {
	gin.SetMode(os.Getenv("GIN_MODE"))

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
