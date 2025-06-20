package handlers

import (
	"context"
	"log/slog"
	"net/http"
	"strconv"
	"time"

	"gaokao-data-analysis/models"

	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
)

// UniversityPriorityVoluntary godoc
// @Summary 查询志愿-院校优先
// @Description 根据用户条件查询志愿-院校优先推荐
// @Tags voluntary
// @Accept json,multipart/form-data,x-www-form-urlencoded
// @Produce json
// @Param request body models.VoluntaryUniversityPriorityRequest true "查询条件"
// @Success 200 {object} models.VoluntaryUniversityPriorityResponse
// @Failure 400 {object} models.APIResponse
// @Failure 500 {object} models.APIResponse
// @Router /api/voluntary/universityPriority [post]
func UniversityPriorityVoluntary(c *gin.Context) {
	var request models.VoluntaryUniversityPriorityRequest

	// 尝试绑定不同类型的请求数据
	contentType := c.ContentType()
	var err error

	if contentType == "application/json" {
		// JSON绑定
		err = c.ShouldBindJSON(&request)
	} else if contentType == "multipart/form-data" {
		// 表单绑定
		err = c.ShouldBindWith(&request, binding.FormMultipart)
	} else {
		// 默认绑定（包括x-www-form-urlencoded）
		err = c.ShouldBind(&request)
	}

	if err != nil {
		slog.Warn("解析请求失败[志愿-院校优先]",
			"error", err.Error(),
			"clientIP", c.ClientIP(),
			"path", c.FullPath(),
			"contentType", contentType,
		)
		c.JSON(http.StatusBadRequest, models.ErrorResponse(400, "无效的请求: "+err.Error()))
		return
	}

	// 处理特殊的表单字段转换，表单可能会将整数作为字符串提交
	handleFormFieldConversions(c, &request)

	slog.Debug("接收到志愿-院校优先查询请求",
		"data", request,
		"clientIP", c.ClientIP(),
	)

	// 校验参数：必须有 profile_id，或者 (province, subjects, rank) 都有
	if request.ProfileID == "" &&
		(request.Province == "" || request.Subjects == "" || request.Rank == 0) {
		c.JSON(http.StatusBadRequest, models.ErrorResponse(400, "参数错误: 必须提供 profile_id 或 (province, subjects, rank)"))
		return
	}

	// 设置默认分页参数
	if request.Page <= 0 {
		request.Page = 1
	}
	if request.PageSize <= 0 {
		request.PageSize = 20 // 默认每页显示20条记录
	} else if request.PageSize > 100 {
		request.PageSize = 100 // 限制最大页面大小，避免查询过大
	}

	// 记录请求信息
	slog.Info("接收到志愿-院校优先查询请求",
		"profileID", request.ProfileID,
		"province", request.Province,
		"subjects", request.Subjects,
		"score", request.Score,
		"rank", request.Rank,
		"strategy", request.Strategy,
		"page", request.Page,
		"pageSize", request.PageSize,
		"clientIP", c.ClientIP(),
	)

	// 设置查询超时
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	// 调用模型层查询数据
	data, err := models.GetUniversityPriorityVoluntary(ctx, &request)
	if err != nil {
		slog.Error("查询志愿-院校优先失败",
			"error", err.Error(),
			"profileID", request.ProfileID,
		)
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(500, "查询失败: "+err.Error()))
		return
	}

	// 返回成功响应
	response := &models.VoluntaryUniversityPriorityResponse{
		Code: 200,
		Data: *data,
		Msg:  "查询成功",
	}
	c.JSON(http.StatusOK, response)
}

// handleFormFieldConversions 处理表单字段的特殊转换
// 表单提交时，整数字段可能会作为字符串提交，需要手动转换
func handleFormFieldConversions(c *gin.Context, request *models.VoluntaryUniversityPriorityRequest) {
	// 处理 Rank 字段
	if rankStr := c.PostForm("rank"); rankStr != "" && request.Rank == 0 {
		if rank, err := strconv.Atoi(rankStr); err == nil {
			request.Rank = int32(rank)
		}
	}

	// 处理 Score 字段
	if scoreStr := c.PostForm("score"); scoreStr != "" && request.Score == 0 {
		if score, err := strconv.Atoi(scoreStr); err == nil {
			request.Score = int32(score)
		}
	}

	// 处理 Strategy 字段
	if strategyStr := c.PostForm("strategy"); strategyStr != "" && request.Strategy == 0 {
		if strategy, err := strconv.Atoi(strategyStr); err == nil {
			request.Strategy = int32(strategy)
		}
	}

	// 处理 Page 字段
	if pageStr := c.PostForm("page"); pageStr != "" && request.Page == 0 {
		if page, err := strconv.Atoi(pageStr); err == nil {
			request.Page = int32(page)
		}
	}

	// 处理 PageSize 字段
	if pageSizeStr := c.PostForm("page_size"); pageSizeStr != "" && request.PageSize == 0 {
		if pageSize, err := strconv.Atoi(pageSizeStr); err == nil {
			request.PageSize = int32(pageSize)
		}
	}
}

// GetMajorGroupDetailsHandler godoc
// @Summary 查询专业组详情
// @Description 根据用户条件查询专业组详情
// @Tags voluntary
// @Accept json,multipart/form-data,x-www-form-urlencoded
// @Produce json
// @Param request body models.VoluntaryMajorGroupRequest true "查询条件"
// @Success 200 {object} models.VoluntaryMajorGroupResponse
// @Failure 400 {object} models.APIResponse
// @Failure 500 {object} models.APIResponse
// @Router /api/voluntary/majorGroupDetails [post]
func GetMajorGroupDetailsHandler(c *gin.Context) {
	var request models.VoluntaryMajorGroupRequest

	// 尝试绑定不同类型的请求数据
	contentType := c.ContentType()
	var err error

	if contentType == "application/json" {
		// JSON绑定
		err = c.ShouldBindJSON(&request)
	} else if contentType == "multipart/form-data" {
		// 表单绑定
		err = c.ShouldBindWith(&request, binding.FormMultipart)
	} else {
		// 默认绑定（包括x-www-form-urlencoded）
		err = c.ShouldBind(&request)
	}

	if err != nil {
		slog.Warn("解析请求失败[专业组详情]",
			"error", err.Error(),
			"clientIP", c.ClientIP(),
			"path", c.FullPath(),
			"contentType", contentType,
		)
		c.JSON(http.StatusBadRequest, models.ErrorResponse(400, "无效的请求: "+err.Error()))
		return
	}

	// 处理特殊的表单字段转换
	if scoreStr := c.PostForm("score"); scoreStr != "" && request.Score == 0 {
		if score, err := strconv.Atoi(scoreStr); err == nil {
			request.Score = int32(score)
		}
	}
	if rankStr := c.PostForm("rank"); rankStr != "" && request.Rank == 0 {
		if rank, err := strconv.Atoi(rankStr); err == nil {
			request.Rank = int32(rank)
		}
	}
	if strategyStr := c.PostForm("strategy"); strategyStr != "" && request.Strategy == 0 {
		if strategy, err := strconv.Atoi(strategyStr); err == nil {
			request.Strategy = int32(strategy)
		}
	}

	// 校验参数
	if request.SchoolCode == "" || request.GroupCode == "" {
		c.JSON(http.StatusBadRequest, models.ErrorResponse(400, "参数错误: 必须提供school_code和group_code"))
		return
	}

	// 设置查询超时
	ctx, cancel := context.WithTimeout(c.Request.Context(), 15*time.Second)
	defer cancel()

	// 调用查询函数
	majorGroup, err := models.GetMajorGroupDetails(ctx, &request)
	if err != nil {
		slog.Error("获取专业组详情失败",
			"error", err.Error(),
			"schoolCode", request.SchoolCode,
			"groupCode", request.GroupCode,
		)
		c.JSON(http.StatusInternalServerError, models.ErrorResponse(500, "查询失败: "+err.Error()))
		return
	}

	// 返回成功响应
	response := &models.VoluntaryMajorGroupResponse{
		Code: 200,
		Data: *majorGroup,
		Msg:  "查询成功",
	}
	c.JSON(http.StatusOK, response)
}
