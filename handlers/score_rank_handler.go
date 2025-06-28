package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"sync"

	"github.com/gin-gonic/gin"
)

// ScoreRankItem represents a single score-rank mapping entry
type ScoreRankItem struct {
	Score      string `json:"score"`      // 分数，可能是单个分数或分数区间
	Num        int    `json:"num"`        // 该分数段人数
	Accumulate int    `json:"accumulate"` // 累计人数（位次）
}

// ScoreRankData represents the complete score-rank data structure
type ScoreRankData struct {
	Data []ScoreRankItem `json:"data"`
}

// ProcessedScoreRankData represents the processed and optimized score-rank data
type ProcessedScoreRankData struct {
	ScoreToRank  map[int]int // 分数到位次的映射
	MinScore     int         // 最低分数
	MaxScore     int         // 最高分数
	SortedScores []int       // 排序后的分数列表，用于二分查找
}

// ScoreRankRequest represents the request structure for score rank query
type ScoreRankRequest struct {
	Province string `form:"province" binding:"required"` // 省份
	Category string `form:"category" binding:"required"` // 类别：physics/history
	Year     int    `form:"year" binding:"required"`     // 年份
	Score    int    `form:"score" binding:"required"`    // 分数
}

// ScoreRankResponseData represents the data part of score rank response
type ScoreRankResponseData struct {
	Rank int `json:"rank"` // 位次
	Year int `json:"year"` // 年份
}

// ScoreRankResponse represents the response structure for score rank query
type ScoreRankResponse struct {
	Code int                    `json:"code" example:"0"`   // 响应码，0表示成功
	Msg  string                 `json:"msg" example:"查询成功"` // 响应消息
	Data *ScoreRankResponseData `json:"data,omitempty"`     // 响应数据，错误时为空
}

// RankToScoreRequest represents the request structure for rank to score query
type RankToScoreRequest struct {
	Province string `form:"province" binding:"required" example:"hubei"`   // 省份
	Category string `form:"category" binding:"required" example:"physics"` // 类别：physics/history
	Year     int    `form:"year" binding:"required" example:"2024"`        // 年份
	Rank     int    `form:"rank" binding:"required" example:"12345"`       // 位次
}

// RankToScoreResponseData represents the data part of rank to score response
type RankToScoreResponseData struct {
	Score int `json:"score" example:"600"` // 分数
	Year  int `json:"year" example:"2024"` // 年份
}

// RankToScoreResponse represents the response structure for rank to score query
type RankToScoreResponse struct {
	Code int                      `json:"code" example:"0"`   // 响应码，0表示成功
	Msg  string                   `json:"msg" example:"查询成功"` // 响应消息
	Data *RankToScoreResponseData `json:"data,omitempty"`     // 响应数据，错误时为空
}

var (
	// processedScoreRankCache 缓存已处理的分数位次数据
	processedScoreRankCache = make(map[string]*ProcessedScoreRankData)
	// scoreRankMutex 保护缓存的读写锁
	scoreRankMutex sync.RWMutex
)

// getScoreRankCacheKey 生成缓存键
func getScoreRankCacheKey(province, category string, year int) string {
	return fmt.Sprintf("%s_%s_%d", strings.ToLower(province), strings.ToLower(category), year)
}

// processScoreRankData 处理原始JSON数据，生成优化的查询结构
func processScoreRankData(rawData *ScoreRankData) *ProcessedScoreRankData {
	processed := &ProcessedScoreRankData{
		ScoreToRank:  make(map[int]int),
		SortedScores: make([]int, 0),
		MinScore:     999999,
		MaxScore:     0,
	}

	// 处理每个数据项
	for _, item := range rawData.Data {
		// 处理单个分数
		score, err := strconv.Atoi(item.Score)
		if err != nil {
			continue
		}

		processed.ScoreToRank[score] = item.Accumulate
		if score < processed.MinScore {
			processed.MinScore = score
		}
		if score > processed.MaxScore {
			processed.MaxScore = score
		}
	}

	// 生成排序后的分数列表，用于快速查找
	for score := range processed.ScoreToRank {
		processed.SortedScores = append(processed.SortedScores, score)
	}

	// 按分数从高到低排序
	sort.Sort(sort.Reverse(sort.IntSlice(processed.SortedScores)))

	return processed
}

// loadScoreRankData 加载并处理分数位次数据，支持缓存
func loadScoreRankData(province, category string, year int) (*ProcessedScoreRankData, error) {
	cacheKey := getScoreRankCacheKey(province, category, year)

	// 先尝试从缓存读取
	scoreRankMutex.RLock()
	if cachedData, exists := processedScoreRankCache[cacheKey]; exists {
		scoreRankMutex.RUnlock()
		return cachedData, nil
	}
	scoreRankMutex.RUnlock()

	// 缓存未命中，从文件加载
	fileName := fmt.Sprintf("score_rank_%s_%d_%s.json", strings.ToLower(province), year, strings.ToLower(category))
	filePath := filepath.Join("static", fileName)

	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("无法读取文件 %s: %v", fileName, err)
	}

	var rawData ScoreRankData
	if err := json.Unmarshal(data, &rawData); err != nil {
		return nil, fmt.Errorf("JSON解析失败: %v", err)
	}

	// 处理原始数据
	processedData := processScoreRankData(&rawData)

	// 写入缓存
	scoreRankMutex.Lock()
	processedScoreRankCache[cacheKey] = processedData
	scoreRankMutex.Unlock()

	return processedData, nil
}

// findRankByScore 根据分数查找对应的位次（使用处理后的数据）
func findRankByScore(processedData *ProcessedScoreRankData, targetScore int) int {
	// 直接从映射中查找
	if rank, exists := processedData.ScoreToRank[targetScore]; exists {
		return rank
	}

	// 如果没有精确匹配，找到最接近的较低分数的位次
	// 因为分数越低，位次越高（数字越大）
	for _, score := range processedData.SortedScores {
		if score <= targetScore {
			if rank, exists := processedData.ScoreToRank[score]; exists {
				return rank
			}
		}
	}

	// 如果目标分数比所有记录的分数都高，返回最好的位次（最小值）
	if targetScore > processedData.MaxScore && len(processedData.SortedScores) > 0 {
		// 返回最高分数对应的位次
		highestScore := processedData.SortedScores[0]
		if rank, exists := processedData.ScoreToRank[highestScore]; exists {
			return rank
		}
	}

	// 如果目标分数比所有记录的分数都低，返回最差的位次（最大值）
	if targetScore < processedData.MinScore && len(processedData.SortedScores) > 0 {
		// 返回最低分数对应的位次
		lowestScore := processedData.SortedScores[len(processedData.SortedScores)-1]
		if rank, exists := processedData.ScoreToRank[lowestScore]; exists {
			return rank
		}
	}

	return 0
}

// findScoreByRank 根据位次查找对应的分数（使用处理后的数据）
func findScoreByRank(processedData *ProcessedScoreRankData, targetRank int) int {
	// 遍历所有分数，找到第一个位次大于等于目标位次的分数
	for _, score := range processedData.SortedScores {
		if rank, exists := processedData.ScoreToRank[score]; exists {
			if rank >= targetRank {
				return score
			}
		}
	}

	// 如果没有找到，返回0
	return 0
}

// QueryScoreByRank 根据省份、类别、年份和位次查询对应的分数
func QueryScoreByRank(province, category string, year, rank int) (int, error) {
	// 验证类别参数
	if category != "physics" && category != "history" {
		return 0, fmt.Errorf("类别参数错误，只支持 physics 或 history")
	}

	// 加载分数位次数据
	processedData, err := loadScoreRankData(province, category, year)
	if err != nil {
		return 0, fmt.Errorf("加载数据失败: %v", err)
	}

	// 查找对应分数
	score := findScoreByRank(processedData, rank)
	return score, nil
}

// QueryRankByScore 根据省份、类别、年份和分数查询对应的位次
func QueryRankByScore(province, category string, year, score int) (int, error) {
	// 验证类别参数
	if category != "physics" && category != "history" {
		return 0, fmt.Errorf("类别参数错误，只支持 physics 或 history")
	}

	// 加载分数位次数据
	processedData, err := loadScoreRankData(province, category, year)
	if err != nil {
		return 0, fmt.Errorf("加载数据失败: %v", err)
	}

	// 查找对应位次
	rank := findRankByScore(processedData, score)
	return rank, nil
}

// GetScoreRank 查询分数对应位次的处理函数
// @Summary 查询分数对应位次
// @Description 根据省份、类别、年份和分数查询对应的位次信息
// @Tags 分数位次查询
// @Produce json
// @Param province query string true "省份" example(hubei)
// @Param category query string true "类别" Enums(physics,history) example(physics)
// @Param year query int true "年份" example(2024)
// @Param score query int true "分数" example(600)
// @Success 200 {object} ScoreRankResponse "查询成功"
// @Failure 400 {object} ScoreRankResponse "请求参数错误"
// @Failure 500 {object} ScoreRankResponse "服务器内部错误"
// @Router /api/rank/getRank [get]
func GetScoreRank(c *gin.Context) {
	var req ScoreRankRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, ScoreRankResponse{
			Code: 1,
			Msg:  fmt.Sprintf("请求参数错误: %v", err),
		})
		return
	}

	// 调用核心查询函数
	rank, err := QueryRankByScore(req.Province, req.Category, req.Year, req.Score)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ScoreRankResponse{
			Code: 1,
			Msg:  err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, ScoreRankResponse{
		Code: 0,
		Msg:  "查询成功",
		Data: &ScoreRankResponseData{
			Rank: rank,
			Year: req.Year,
		},
	})
}

// GetRankToScore 根据位次查询分数的处理函数
// @Summary 查询位次对应分数
// @Description 根据省份、类别、年份和位次查询对应的分数信息
// @Tags 分数位次查询
// @Produce json
// @Param province query string true "省份" example(hubei)
// @Param category query string true "类别" Enums(physics,history) example(physics)
// @Param year query int true "年份" example(2024)
// @Param rank query int true "位次" example(12345)
// @Success 200 {object} RankToScoreResponse "查询成功"
// @Failure 400 {object} RankToScoreResponse "请求参数错误"
// @Failure 500 {object} RankToScoreResponse "服务器内部错误"
// @Router /api/rank/getScore [get]
func GetRankToScore(c *gin.Context) {
	var req RankToScoreRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, RankToScoreResponse{
			Code: 1,
			Msg:  fmt.Sprintf("请求参数错误: %v", err),
		})
		return
	}

	// 调用核心查询函数
	score, err := QueryScoreByRank(req.Province, req.Category, req.Year, req.Rank)
	if err != nil {
		c.JSON(http.StatusInternalServerError, RankToScoreResponse{
			Code: 1,
			Msg:  err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, RankToScoreResponse{
		Code: 0,
		Msg:  "查询成功",
		Data: &RankToScoreResponseData{
			Score: score,
			Year:  req.Year,
		},
	})
}
