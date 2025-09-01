package handlers

import (
	"encoding/json"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"github.com/gin-gonic/gin"
)

// ProvinceCity represents the structure of province and cities data
type ProvinceCity struct {
	Province string   `json:"province"` // 省份名称
	Cities   []string `json:"citys"`    // 对应的城市列表
}

// ProvinceOptionsResponse represents the response structure for province options
type ProvinceOptionsResponse struct {
	Code int    `json:"code"` // 响应码，0表示成功
	Msg  string `json:"msg"`  // 响应消息
	Data struct {
		Provinces []ProvinceCity `json:"provinces"` // 可选省份列表
	} `json:"data"` // 响应数据
}

var (
	// provinceMap 原始省份城市映射数据，用于快速查找特定省份
	provinceMap map[string][]string
	// allProvinces 全量省份数据缓存，避免重复转换格式
	allProvinces []ProvinceCity
	// loadOnce 确保数据只加载一次的同步原语
	loadOnce sync.Once
)

// loadProvinceCache 从JSON文件加载省份数据并缓存
// 该函数通过sync.Once确保只执行一次，提供高效的数据加载
func loadProvinceCache() {
	filePath := filepath.Join("static", "province_city.json")
	data, err := os.ReadFile(filePath)
	if err != nil {
		// 静默处理文件读取错误，返回空数据
		return
	}

	// 解析JSON到map结构
	if err := json.Unmarshal(data, &provinceMap); err != nil {
		// 静默处理JSON解析错误
		return
	}

	// 预生成全量结果缓存，优化无过滤条件的查询性能
	for province, cities := range provinceMap {
		allProvinces = append(allProvinces, ProvinceCity{
			Province: province,
			Cities:   cities,
		})
	}
}

// GetProvinceOptions 获取可选省份选项
// @Summary 获取可选省份选项
// @Description 返回可选择的省份和城市列表，支持通过query参数过滤特定省份
// @Tags 选项接口
// @Accept json
// @Produce json
// @Param province query string false "限制返回省份，支持多个省份用逗号分隔，如: 湖北,湖南"
// @Success 200 {object} ProvinceOptionsResponse "成功返回省份列表"
// @Failure 500 {object} gin.H "服务器内部错误"
// @Router /api/options/provinces [get]
func GetProvinceOptions(c *gin.Context) {
	// 确保数据已加载（只在首次调用时执行）
	loadOnce.Do(loadProvinceCache)

	// 解析省份过滤参数
	var filters []string
	if filter := c.Query("province"); filter != "" {
		// 按逗号分割并去除空白字符
		for _, p := range strings.Split(filter, ",") {
			if p = strings.TrimSpace(p); p != "" {
				filters = append(filters, p)
			}
		}
	}

	var result []ProvinceCity

	if len(filters) == 0 {
		// 无过滤条件，直接返回预缓存的全量结果（最优性能）
		result = allProvinces
	} else {
		// 有过滤条件，使用map进行O(1)时间复杂度的快速查找
		for _, filter := range filters {
			if cities, exists := provinceMap[filter]; exists {
				result = append(result, ProvinceCity{
					Province: filter,
					Cities:   cities,
				})
			}
		}
	}

	// 构造并返回响应
	c.JSON(http.StatusOK, ProvinceOptionsResponse{
		Code: 0,
		Msg:  "success",
		Data: struct {
			Provinces []ProvinceCity `json:"provinces"`
		}{Provinces: result},
	})
}
