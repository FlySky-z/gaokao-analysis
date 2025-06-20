package handlers

import (
	"gaokao-data-analysis/models"
	"log/slog"
	"net/http"

	"github.com/gin-gonic/gin"
)

// CreateUserProfile handles the creation of a new user profile
// @Summary Create a new user profile
// @Description Create a new user profile with preferences
// @Tags user-profiles
// @Accept json
// @Produce json
// @Param request body models.UserProfileRequest true "User Profile Info"
// @Success 200 {object} models.APIResponse
// @Failure 400 {object} models.APIResponse
// @Failure 500 {object} models.APIResponse
// @Router /api/user-profiles [post]
func CreateUserProfile(c *gin.Context) {
	var request models.UserProfileRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		slog.Warn("请求验证失败",
			"error", err.Error(),
			"clientIP", c.ClientIP(),
			"path", c.FullPath(),
		)
		c.JSON(http.StatusBadRequest, models.ErrorResponse(400, "Invalid request: "+err.Error()))
		return
	}

	// Validate required fields
	if request.Username == "" || request.Province == "" || len(request.Subjects) == 0 {
		slog.Warn("缺少必要字段",
			"username", request.Username != "",
			"province", request.Province != "",
			"subjects", len(request.Subjects),
			"clientIP", c.ClientIP(),
		)
		c.JSON(http.StatusBadRequest, models.ErrorResponse(400, "Missing required fields: username, province, and subjects are required"))
		return
	}

	// 使用结构化日志记录用户请求信息（不包含敏感数据）
	slog.Info("创建用户档案",
		"username", request.Username,
		"province", request.Province,
		"subjectCount", len(request.Subjects),
		"clientIP", c.ClientIP(),
	)

	// Use model's method to create user profile
	userProfile, err := models.CreateUserProfile(&request)
	if err != nil {
		slog.Error("创建用户档案失败",
			"error", err.Error(),
			"username", request.Username,
			"province", request.Province,
		)
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(500, "Failed to create user profile: "+err.Error()))
		return
	}

	slog.Info("用户档案创建成功", "profileID", userProfile.ID)

	// Return success response
	response := models.SuccessResponse(models.ProfileIDResponse{ProfileID: &userProfile.ID}, "User profile created successfully")
	c.JSON(http.StatusOK, response)
}

// GetUserProfile handles retrieving a user profile by ID
// @Summary Get a user profile by ID
// @Description Get a user profile by its ID
// @Tags user-profiles
// @Accept json
// @Produce json
// @Param id path string true "User Profile ID"
// @Success 200 {object} models.UserProfile
// @Failure 404 {object} models.APIResponse
// @Failure 500 {object} models.APIResponse
// @Router /api/user-profiles/{id} [get]
func GetUserProfile(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, models.ErrorResponse(400, "Missing profile ID"))
		return
	}

	// Use model's method to get user profile
	userProfile, err := models.GetUserProfileByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, models.ErrorResponse(404, "User profile not found"))
		return
	}

	c.JSON(http.StatusOK, userProfile)
}
