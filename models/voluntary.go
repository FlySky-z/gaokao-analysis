package models

import (
	"context"
	"fmt"
	"log/slog"
	"strings"
	"time"

	"gaokao-data-analysis/database"
)

var (
	TABLE = "gaokao2025" // ClickHouse表名
)

// VoluntaryUniversityPriorityRequest 志愿-院校优先查询请求
type VoluntaryUniversityPriorityRequest struct {
	// 选择城市，使用逗号分隔（不选择省份，仅选择城市）
	Citys string `json:"citys,omitempty" form:"citys"`
	// 院校类型，使用逗号分隔，办学类型（公办），院校特色（211），院校类型（综合类），取交集
	CollegeType string `json:"college_type,omitempty" form:"college_type"`
	// 招生计划，使用逗号分隔
	EnrollmentPlan string `json:"enrollment_plan,omitempty" form:"enrollment_plan"`
	// 限制搜索最高分
	MaxScore string `json:"max_score,omitempty" form:"max_score"`
	// 限制搜索最低分
	MinScore string `json:"min_score,omitempty" form:"min_score"`
	// 档案id
	ProfileID string `json:"profile_id,omitempty" form:"profile_id"`
	// 报考的省份
	Province string `json:"province,omitempty" form:"province"`
	// 排名
	Rank int32 `json:"rank,omitempty" form:"rank"`
	// 分数
	Score int32 `json:"score,omitempty" form:"score"`
	// [0冲、1稳、2保]，默认1稳
	Strategy int32 `json:"strategy,omitempty" form:"strategy"`
	// 用户选择的科目
	Subjects string `json:"subjects,omitempty" form:"subjects"`
	// 分页参数
	Page     int32 `json:"page,omitempty" form:"page"`
	PageSize int32 `json:"page_size,omitempty" form:"page_size"`
}

// paginationData 志愿-院校优先查询数据
type paginationData struct {
	List interface{} `json:"list"`
	// 页码
	Page int32 `json:"page"`
	// 页面总数
	PageNum int32 `json:"page_num"`
	// 页面大小
	PageSize int32 `json:"page_size"`
	// 总数目
	Total int32 `json:"total"`
}

// VoluntaryMajorGroupRequest 获取专业组信息请求
type VoluntaryMajorGroupRequest struct {
	// 院校代码
	SchoolCode string `json:"school_code,omitempty" form:"school_code"`
	// 专业组代码
	GroupCode string `json:"group_code,omitempty" form:"group_code"`
	// 档案id
	ProfileID string `json:"profile_id,omitempty" form:"profile_id"`
	// 报考的省份
	Province string `json:"province,omitempty" form:"province"`
	// 排名
	Rank int32 `json:"rank,omitempty" form:"rank"`
	// 分数
	Score int32 `json:"score,omitempty" form:"score"`
	// [0冲、1稳、2保]，默认1稳
	Strategy int32 `json:"strategy,omitempty" form:"strategy"`
	// 用户选择的科目
	Subjects string `json:"subjects,omitempty" form:"subjects"`
}

// ValidateSubjects 验证科目组合，必须包含物理或历史
func ValidateSubjects(subjectsStr string) error {
	_, err := ParseSubjects(subjectsStr)
	return err
}

// GetSubjectType 获取科目类型（物理或历史）
func GetSubjectType(subjectsStr string) string {
	filter, err := ParseSubjects(subjectsStr)
	if err != nil {
		return ""
	}
	return filter.SubjectCategory
}

// 计算录取概率
func CalculateProbability(userScore, minScore int32) int32 {
	// 这是一个简化的概率计算方法，实际应用中可能需要更复杂的算法
	scoreDiff := userScore - minScore

	if scoreDiff <= -20 {
		return 0 // 几乎不可能
	} else if scoreDiff <= -10 {
		return 20 // 非常低
	} else if scoreDiff <= 0 {
		return 40 // 低
	} else if scoreDiff <= 10 {
		return 60 // 中等
	} else if scoreDiff <= 20 {
		return 80 // 高
	} else {
		return 95 // 几乎确定
	}
}

// 获取匹配的策略
func GetStrategy(userScore, minScore int32) int32 {
	scoreDiff := userScore - minScore

	if scoreDiff <= -5 {
		return 0 // 冲
	} else if scoreDiff >= 10 {
		return 2 // 保
	} else {
		return 1 // 稳
	}
}

// EnumMapper 枚举映射器
type EnumMapper struct {
	provinceMap   map[string]int
	ownershipMap  map[string]int
	educationMap  map[string]int
	admissionMap  map[string]int
	enrollmentMap map[string]int
	subjectCatMap map[string]int
}

// NewEnumMapper 创建枚举映射器
func NewEnumMapper() *EnumMapper {
	return &EnumMapper{
		provinceMap: map[string]int{
			"湖北": 1,
		},
		ownershipMap: map[string]int{
			"公办":         1,
			"内地与港澳台合作办学": 2,
			"中外合作办学":     3,
			"民办":         4,
			"境外高校独立办学":   5,
		},
		educationMap: map[string]int{
			"本科":   1,
			"职业本科": 2,
			"专科":   3,
		},
		admissionMap: map[string]int{
			"本科批": 1,
			"专科批": 2,
		},
		enrollmentMap: map[string]int{
			"":            1,
			"国家专项计划":      2,
			"地方专项计划":      3,
			"专本联合培养":      4,
			"单设志愿-高校专项":   5,
			"单设志愿-高水平运动队": 6,
		},
		subjectCatMap: map[string]int{
			"物理": 1,
			"历史": 2,
		},
	}
}

// MapProvince 映射省份枚举值
func (em *EnumMapper) MapProvince(province string) (int, bool) {
	val, exists := em.provinceMap[province]
	return val, exists
}

// MapOwnership 映射办学性质枚举值
func (em *EnumMapper) MapOwnership(ownership string) (int, bool) {
	val, exists := em.ownershipMap[ownership]
	return val, exists
}

// MapSubjectCategory 映射科目类别枚举值
func (em *EnumMapper) MapSubjectCategory(category string) (int, bool) {
	val, exists := em.subjectCatMap[category]
	return val, exists
}

// ScoreRangeCalculator 分数范围计算器
type ScoreRangeCalculator struct{}

// CalculateRange 根据策略计算分数范围
func (src *ScoreRangeCalculator) CalculateRange(userScore int32, strategy int32) (minDiff, maxDiff int32) {
	switch strategy {
	case 0: // 冲
		return 3, 20 // 分数比最低分高3-20分
	case 1: // 稳
		return -5, 3 // 分数比最低分低5分到高3分
	case 2: // 保
		return -20, -5 // 分数比最低分低20-5分
	default:
		return -5, 3 // 默认稳策略
	}
}

// GetUniversityPriorityVoluntary 查询志愿-院校优先（重构版）
func GetUniversityPriorityVoluntary(ctx context.Context, req *VoluntaryUniversityPriorityRequest) (*paginationData, error) {
	startTime := time.Now()

	// 获取ClickHouse连接
	db := database.GetClickHouse()
	if db == nil {
		return nil, fmt.Errorf("ClickHouse连接未初始化")
	}

	// 初始化辅助器
	enumMapper := NewEnumMapper()
	profileManager := &ProfileManager{}
	scoreCalculator := &ScoreRangeCalculator{}

	// 应用用户档案信息
	if err := profileManager.ApplyProfileToRequest(req.ProfileID, req); err != nil {
		slog.Warn("应用用户档案失败", "error", err.Error())
	}

	// 验证科目组合
	if err := ValidateSubjects(req.Subjects); err != nil {
		return nil, fmt.Errorf("科目验证失败: %w", err)
	}

	// 构建基础查询
	baseQuery := fmt.Sprintf(`SELECT 
	school_code as recruit_code,
	school_name as university_name,
	school_province as province,
	school_type as category,
	school_tags as tags,
	major_group_code as group_code,
	count(*) as major_count
FROM %s
WHERE 1=1
`, TABLE)

	queryBuilder := NewQueryBuilder(baseQuery)

	// 处理省份条件
	if req.Province != "" {
		if provinceVal, exists := enumMapper.MapProvince(req.Province); exists {
			queryBuilder.AddCondition("source_province = ?", provinceVal)
		}
	}

	// 处理分数范围条件
	if req.Score > 0 {
		minDiff, maxDiff := scoreCalculator.CalculateRange(req.Score, req.Strategy)
		queryBuilder.AddCondition("min_score_2024 >= ?", req.Score+minDiff)
		queryBuilder.AddCondition("min_score_2024 <= ?", req.Score+maxDiff)
	}

	// 处理科目条件
	if req.Subjects != "" {
		subjectFilter, err := ParseSubjects(req.Subjects)
		if err != nil {
			return nil, fmt.Errorf("解析科目失败: %w", err)
		}
		subjectConditions, subjectArgs := subjectFilter.BuildSubjectConditions()
		queryBuilder.AddConditions(subjectConditions, subjectArgs)
	}

	// 处理城市筛选
	if req.Citys != "" {
		cities := strings.Split(req.Citys, ",")
		if len(cities) > 0 {
			citiesCondition := make([]string, len(cities))
			var cityArgs []interface{}
			for i, city := range cities {
				citiesCondition[i] = "school_city = ?"
				cityArgs = append(cityArgs, strings.TrimSpace(city))
			}
			queryBuilder.AddCondition("("+strings.Join(citiesCondition, " OR ")+")", cityArgs...)
		}
	}

	// 处理院校类型筛选
	if req.CollegeType != "" {
		if err := buildCollegeTypeConditions(queryBuilder, enumMapper, req.CollegeType); err != nil {
			return nil, fmt.Errorf("构建院校类型条件失败: %w", err)
		}
	}

	// 添加分组和排序
	finalQuery, args := queryBuilder.Build()
	finalQuery += `
		GROUP BY 
			recruit_code, 
			university_name, 
			province, 
			category,
			tags,
			group_code
		ORDER BY 
			university_name ASC
	`

	// 处理分页
	if req.Page <= 0 {
		req.Page = 1
	}
	if req.PageSize <= 0 {
		req.PageSize = 20
	}

	// 查询总数
	total, err := queryUniversityCount(ctx, db, queryBuilder)
	if err != nil {
		return nil, fmt.Errorf("查询总数失败: %w", err)
	}

	// 添加分页限制
	limit := req.PageSize
	offset := (req.Page - 1) * req.PageSize
	paginatedQuery := finalQuery + fmt.Sprintf(" LIMIT %d OFFSET %d", limit, offset)

	// 执行分页查询
	resultItems, err := executeUniversityQuery(ctx, db, paginatedQuery, args, req)
	if err != nil {
		return nil, fmt.Errorf("执行查询失败: %w", err)
	}

	// 计算分页信息
	pageNum := (int32(total) + req.PageSize - 1) / req.PageSize

	// 创建响应数据
	data := &paginationData{
		List:     resultItems,
		Page:     req.Page,
		PageSize: req.PageSize,
		PageNum:  pageNum,
		Total:    int32(total),
	}

	slog.Info("志愿-院校优先查询完成",
		"totalResults", total,
		"duration", time.Since(startTime).String(),
		"page", req.Page,
		"pageSize", req.PageSize,
		"resultCount", len(resultItems),
	)

	return data, nil
}

// buildCollegeTypeConditions 构建院校类型筛选条件
func buildCollegeTypeConditions(qb *QueryBuilder, em *EnumMapper, collegeType string) error {
	collegeTypes := strings.Split(collegeType, ",")
	if len(collegeTypes) == 0 {
		return nil
	}

	var ownershipConditions []string
	var ownershipArgs []interface{}
	var tagsConditions []string
	var tagsArgs []interface{}

	for _, colType := range collegeTypes {
		colType = strings.TrimSpace(colType)

		// 检查是否是办学性质
		if ownershipVal, exists := em.MapOwnership(colType); exists {
			ownershipConditions = append(ownershipConditions, "school_ownership = ?")
			ownershipArgs = append(ownershipArgs, ownershipVal)
		} else {
			// 其他为院校标签
			tagsConditions = append(tagsConditions, "positionUTF8(school_tags, ?) > 0")
			tagsArgs = append(tagsArgs, colType)
		}
	}

	// 合并各类条件
	var typeConditions []string
	if len(ownershipConditions) > 0 {
		typeConditions = append(typeConditions, "("+strings.Join(ownershipConditions, " OR ")+")")
		qb.args = append(qb.args, ownershipArgs...)
	}
	if len(tagsConditions) > 0 {
		typeConditions = append(typeConditions, "("+strings.Join(tagsConditions, " OR ")+")")
		qb.args = append(qb.args, tagsArgs...)
	}

	if len(typeConditions) > 0 {
		qb.AddCondition("(" + strings.Join(typeConditions, " AND ") + ")")
	}

	return nil
}
