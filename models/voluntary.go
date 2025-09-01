package models

import (
	"context"
	"database/sql"
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

// VoluntaryUniversityPriorityResponse 志愿-院校优先查询响应
type VoluntaryUniversityPriorityResponse struct {
	// 响应码
	Code int32                           `json:"code"`
	Data VoluntaryUniversityPriorityData `json:"data"`
	// 响应消息
	Msg string `json:"msg"`
}

// VoluntaryUniversityPriorityData 志愿-院校优先查询数据
type VoluntaryUniversityPriorityData struct {
	List []VoluntaryUniversityItem `json:"list"`
	// 页码
	Page int32 `json:"page"`
	// 页面总数
	PageNum int32 `json:"page_num"`
	// 页面大小
	PageSize int32 `json:"page_size"`
	// 总数目
	Total int32 `json:"total"`
}

// VoluntaryUniversityItem 志愿-院校优先查询结果项
type VoluntaryUniversityItem struct {
	// 院校类型，综合、医药等
	Category []string `json:"category"`
	// 专业组，可选专业组
	MajorGroup []VoluntaryMajorGroup `json:"major_group"`
	// 院校所在省
	Province string `json:"province"`
	// 院校代码
	RecruitCode string `json:"recruit_code"`
	// 院校标签，例如985、211等
	Tags []string `json:"tags"`
	// 大学名称
	UniversityName string `json:"university_name"`
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

// VoluntaryMajorGroupResponse 获取专业组信息响应
type VoluntaryMajorGroupResponse struct {
	// 响应码
	Code int32               `json:"code"`
	Data VoluntaryMajorGroup `json:"data"`
	// 响应消息
	Msg string `json:"msg"`
}

// VoluntaryMajorGroup 专业组信息
type VoluntaryMajorGroup struct {
	// 专业组代码
	GroupCode string `json:"group_code"`
	// 专业，专业组内全部专业
	Major []VoluntaryMajor `json:"major"`
	// 专业组概率，百分比
	Probability int32 `json:"probability"`
	// 策略，[0冲、1稳、2保]
	Strategy int32 `json:"strategy"`
}

// VoluntaryMajor 专业信息
type VoluntaryMajor struct {
	// 专业代码
	Code string `json:"code"`
	// 专业id，ID 编号
	ID int32 `json:"id"`
	// 录取最低位次
	MinRank int32 `json:"min_rank"`
	// 录取最低分
	MinScore int32 `json:"min_score"`
	// 专业名称
	Name string `json:"name"`
	// 计划数
	PlanNum string `json:"plan_num"`
	// 录取概率，百分比
	Probability int32 `json:"probability"`
	// 专业备注
	Remark string `json:"remark"`
	// 策略
	Strategy int32 `json:"strategy"`
	// 学费
	StudyCost string `json:"study_cost"`
	// 学制
	StudyYear string `json:"study_year"`
	// 信息年份
	Year string `json:"year"`
}

// SubjectFilter 科目筛选器
type SubjectFilter struct {
	RequirePhysics   bool
	RequireChemistry bool
	RequireBiology   bool
	RequirePolitics  bool
	RequireHistory   bool
	RequireGeography bool
	SubjectCategory  string // "物理" 或 "历史"
}

// SchoolGroupPair 学校代码和专业组代码对
type SchoolGroupPair struct {
	SchoolCode string
	GroupCode  string
}

// ParseSubjects 解析科目字符串为筛选器
func ParseSubjects(subjectsStr string) (*SubjectFilter, error) {
	if subjectsStr == "" {
		return nil, fmt.Errorf("科目不能为空")
	}

	filter := &SubjectFilter{}
	subjects := strings.Split(subjectsStr, ",")

	hasPhysics := false
	hasHistory := false

	for _, subject := range subjects {
		subject = strings.TrimSpace(subject)
		switch subject {
		case "物理":
			filter.RequirePhysics = true
			hasPhysics = true
		case "化学":
			filter.RequireChemistry = true
		case "生物":
			filter.RequireBiology = true
		case "政治":
			filter.RequirePolitics = true
		case "历史":
			filter.RequireHistory = true
			hasHistory = true
		case "地理":
			filter.RequireGeography = true
		}
	}

	// 验证必须包含物理或历史
	if !hasPhysics && !hasHistory {
		return nil, fmt.Errorf("科目组合必须包含物理或历史")
	}

	// 设置科目类别
	if hasPhysics {
		filter.SubjectCategory = "物理"
	} else {
		filter.SubjectCategory = "历史"
	}

	return filter, nil
}

// BuildSubjectConditions 构建科目相关的查询条件
func (sf *SubjectFilter) BuildSubjectConditions() ([]string, []interface{}) {
	var conditions []string
	var args []interface{}

	// 主科目类别条件（物理或历史）
	if sf.SubjectCategory != "" {
		conditions = append(conditions, "subject_category = ?")
		if sf.SubjectCategory == "物理" {
			args = append(args, 1) // 物理=1
		} else {
			args = append(args, 2) // 历史=2
		}
	}

	// 具体科目要求条件 - 使用OR逻辑
	var subjectOrConditions []string
	if sf.RequirePhysics {
		subjectOrConditions = append(subjectOrConditions, "require_physics = true")
	}
	if sf.RequireChemistry {
		subjectOrConditions = append(subjectOrConditions, "require_chemistry = true")
	}
	if sf.RequireBiology {
		subjectOrConditions = append(subjectOrConditions, "require_biology = true")
	}
	if sf.RequirePolitics {
		subjectOrConditions = append(subjectOrConditions, "require_politics = true")
	}
	if sf.RequireHistory {
		subjectOrConditions = append(subjectOrConditions, "require_history = true")
	}
	if sf.RequireGeography {
		subjectOrConditions = append(subjectOrConditions, "require_geography = true")
	}

	// 如果有科目要求条件，用OR连接
	if len(subjectOrConditions) > 0 {
		conditions = append(conditions, "("+strings.Join(subjectOrConditions, " OR ")+")")
	}

	return conditions, args
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

// QueryBuilder 查询构建器
type QueryBuilder struct {
	baseQuery  string
	conditions []string
	args       []interface{}
}

// NewQueryBuilder 创建新的查询构建器
func NewQueryBuilder(baseQuery string) *QueryBuilder {
	return &QueryBuilder{
		baseQuery:  baseQuery,
		conditions: make([]string, 0),
		args:       make([]interface{}, 0),
	}
}

// AddCondition 添加查询条件
func (qb *QueryBuilder) AddCondition(condition string, args ...interface{}) {
	qb.conditions = append(qb.conditions, condition)
	qb.args = append(qb.args, args...)
}

// AddConditions 批量添加查询条件
func (qb *QueryBuilder) AddConditions(conditions []string, args []interface{}) {
	qb.conditions = append(qb.conditions, conditions...)
	qb.args = append(qb.args, args...)
}

// Build 构建最终查询语句
func (qb *QueryBuilder) Build() (string, []interface{}) {
	query := qb.baseQuery
	if len(qb.conditions) > 0 {
		query += " AND " + strings.Join(qb.conditions, " AND ")
	}
	return query, qb.args
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

// ProfileManager 用户档案管理器
type ProfileManager struct{}

// ApplyProfileToRequest 将用户档案应用到请求中
func (pm *ProfileManager) ApplyProfileToRequest(profileID string, req interface{}) error {
	if profileID == "" {
		return nil
	}

	profile, err := GetUserProfileByID(profileID)
	if err != nil || profile == nil {
		return err
	}

	// 根据请求类型应用档案信息
	switch r := req.(type) {
	case *VoluntaryUniversityPriorityRequest:
		if profile.Province != "" && r.Province == "" {
			r.Province = profile.Province
		}
		if profile.Score > 0 && r.Score == 0 {
			r.Score = profile.Score
		}
		if profile.Rank > 0 && r.Rank == 0 {
			r.Rank = profile.Rank
		}
		if len(profile.Subjects) > 0 && r.Subjects == "" {
			r.Subjects = strings.Join(profile.Subjects, ",")
		}
	case *VoluntaryMajorGroupRequest:
		if profile.Province != "" && r.Province == "" {
			r.Province = profile.Province
		}
		if profile.Score > 0 && r.Score == 0 {
			r.Score = profile.Score
		}
		if profile.Rank > 0 && r.Rank == 0 {
			r.Rank = profile.Rank
		}
		if len(profile.Subjects) > 0 && r.Subjects == "" {
			r.Subjects = strings.Join(profile.Subjects, ",")
		}
	}

	return nil
}

// GetUniversityPriorityVoluntary 查询志愿-院校优先（重构版）
func GetUniversityPriorityVoluntary(ctx context.Context, req *VoluntaryUniversityPriorityRequest) (*VoluntaryUniversityPriorityData, error) {
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
	data := &VoluntaryUniversityPriorityData{
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

// queryUniversityCount 查询符合条件的院校总数
func queryUniversityCount(ctx context.Context, db *sql.DB, qb *QueryBuilder) (int64, error) {
	countQuery := fmt.Sprintf(`SELECT count(DISTINCT school_name) 
FROM %s
WHERE 1=1
`, TABLE)

	// 复制查询条件到计数查询
	countQB := NewQueryBuilder(countQuery)
	countQB.conditions = append(countQB.conditions, qb.conditions...)
	countQB.args = append(countQB.args, qb.args...)

	finalCountQuery, countArgs := countQB.Build()

	slog.Info("查询符合条件的院校总数", "query", finalCountQuery, "args", countArgs)

	var total int64
	err := db.QueryRowContext(ctx, finalCountQuery, countArgs...).Scan(&total)
	if err != nil {
		slog.Error("查询志愿总数失败", "error", err.Error())
		return 0, err
	}

	return total, nil
}

// executeUniversityQuery 执行院校查询并返回结果
func executeUniversityQuery(ctx context.Context, db *sql.DB, query string, args []interface{}, req *VoluntaryUniversityPriorityRequest) ([]VoluntaryUniversityItem, error) {
	slog.Info("查询志愿院校分页", "query", query, "args", args)

	rows, err := db.QueryContext(ctx, query, args...)
	if err != nil {
		slog.Error("查询志愿院校分页失败", "error", err.Error())
		return nil, err
	}
	defer rows.Close()

	// 处理结果
	var resultItems []VoluntaryUniversityItem
	schoolMap := make(map[string]*VoluntaryUniversityItem)
	var schoolGroups []SchoolGroupPair

	for rows.Next() {
		var recruitCode, universityName, province, groupCode string
		var category, tags string
		var majorCount int

		if err := rows.Scan(&recruitCode, &universityName, &province, &category, &tags, &groupCode, &majorCount); err != nil {
			slog.Error("扫描志愿院校结果失败", "error", err.Error())
			continue
		}

		// 检查学校是否已经存在
		_, exists := schoolMap[universityName]
		if !exists {
			// 创建新的院校条目
			newItem := &VoluntaryUniversityItem{
				RecruitCode:    recruitCode,
				UniversityName: universityName,
				Province:       province,
				Category:       strings.Split(category, ","),
				Tags:           strings.Split(tags, ","),
				MajorGroup:     []VoluntaryMajorGroup{},
			}
			schoolMap[universityName] = newItem
		}

		// 收集所有学校代码和专业组代码对
		schoolGroups = append(schoolGroups, SchoolGroupPair{
			SchoolCode: recruitCode,
			GroupCode:  groupCode,
		})
	}

	// 批量获取专业组信息
	if len(schoolGroups) > 0 {
		majorGroupReq := &VoluntaryMajorGroupRequest{
			Province:  req.Province,
			ProfileID: req.ProfileID,
			Score:     req.Score,
			Rank:      req.Rank,
			Strategy:  req.Strategy,
			Subjects:  req.Subjects,
		}

		majorGroupsMap, err := GetMajorGroupsDetail(ctx, schoolGroups, majorGroupReq)
		if err != nil {
			slog.Error("批量获取专业组信息失败", "error", err.Error())
			return nil, fmt.Errorf("批量获取专业组信息失败: %w", err)
		}

		// 将专业组信息分配给对应的院校
		for _, sg := range schoolGroups {
			groupKey := fmt.Sprintf("%s-%s", sg.SchoolCode, sg.GroupCode)
			if majorGroup, exists := majorGroupsMap[groupKey]; exists {
				// 找到对应的学校
				for _, schoolItem := range schoolMap {
					if schoolItem.RecruitCode == sg.SchoolCode {
						schoolItem.MajorGroup = append(schoolItem.MajorGroup, *majorGroup)
						break
					}
				}
			}
		}
	}

	// 转换为结果切片
	for _, item := range schoolMap {
		resultItems = append(resultItems, *item)
	}

	return resultItems, nil
}

// GetMajorGroupsDetail 批量获取专业组详细信息
func GetMajorGroupsDetail(ctx context.Context, schoolGroups []SchoolGroupPair, req *VoluntaryMajorGroupRequest) (map[string]*VoluntaryMajorGroup, error) {
	startTime := time.Now()

	// 获取ClickHouse连接
	db := database.GetClickHouse()
	if db == nil {
		return nil, fmt.Errorf("ClickHouse连接未初始化")
	}

	// 初始化辅助器
	enumMapper := NewEnumMapper()
	profileManager := &ProfileManager{}

	// 应用用户档案信息
	if err := profileManager.ApplyProfileToRequest(req.ProfileID, req); err != nil {
		slog.Warn("应用用户档案失败", "error", err.Error())
	}

	// 验证科目组合
	if req.Subjects != "" {
		if err := ValidateSubjects(req.Subjects); err != nil {
			return nil, fmt.Errorf("科目验证失败: %w", err)
		}
	}

	// 构建批量查询条件
	if len(schoolGroups) == 0 {
		return make(map[string]*VoluntaryMajorGroup), nil
	}

	// 构建专业组查询 - 适配新表结构，支持批量查询
	baseQuery := fmt.Sprintf(`SELECT 
	school_code,
	major_group_code,
	id,
	major_code as code,
	major_name as name,
	major_min_score_2024 as min_score,
	major_min_rank_2024 as min_rank,
	enrollment_plan_2024 as plan_num,
	tuition_fee as study_cost,
	study_duration as study_year,
	major_description as remark
FROM %s
WHERE (school_code, major_group_code) IN (`, TABLE)

	// 构建 IN 条件的参数占位符
	var inConditions []string
	var inArgs []interface{}
	for _, sg := range schoolGroups {
		inConditions = append(inConditions, "(?, ?)")
		inArgs = append(inArgs, sg.SchoolCode, sg.GroupCode)
	}

	baseQuery += strings.Join(inConditions, ", ") + ")"

	queryBuilder := NewQueryBuilder(baseQuery)
	queryBuilder.args = append(queryBuilder.args, inArgs...)

	// 处理省份条件
	if req.Province != "" {
		if provinceVal, exists := enumMapper.MapProvince(req.Province); exists {
			queryBuilder.AddCondition("source_province = ?", provinceVal)
		}
	}

	// 处理科目条件
	if req.Subjects != "" {
		subjectFilter, err := ParseSubjects(req.Subjects)
		if err != nil {
			return nil, fmt.Errorf("解析科目失败: %w", err)
		}

		// 添加科目相关条件
		subjectConditions, subjectArgs := subjectFilter.BuildSubjectConditions()
		queryBuilder.AddConditions(subjectConditions, subjectArgs)
	}

	// 构建最终查询
	finalQuery, finalArgs := queryBuilder.Build()
	finalQuery += " ORDER BY school_code, major_group_code, major_name ASC"

	slog.Info("批量查询专业组信息",
		"schoolGroupCount", len(schoolGroups),
		"query", finalQuery,
		"args", finalArgs,
	)

	// 执行查询
	majorRows, err := db.QueryContext(ctx, finalQuery, finalArgs...)
	if err != nil {
		slog.Error("批量查询专业信息失败", "error", err.Error())
		return nil, fmt.Errorf("批量查询专业信息失败: %w", err)
	}
	defer majorRows.Close()

	// 处理结果 - 按学校代码+专业组代码分组
	result := make(map[string]*VoluntaryMajorGroup)
	groupMajorsMap := make(map[string][]VoluntaryMajor)
	groupProbabilityMap := make(map[string][]int32)

	for majorRows.Next() {
		var schoolCode, groupCode string
		var id int32
		var code, name string
		var minScore, minRank sql.NullInt32
		var planNum sql.NullInt32
		var studyCost sql.NullString
		var studyYear sql.NullInt32
		var remark sql.NullString

		if err := majorRows.Scan(&schoolCode, &groupCode, &id, &code, &name, &minScore, &minRank, &planNum, &studyCost, &studyYear, &remark); err != nil {
			slog.Error("扫描专业信息失败", "error", err.Error())
			continue
		}

		// 计算每个专业的录取概率和策略
		var probability int32 = 50 // 默认50%
		var strategy int32 = 1     // 默认稳

		// 如果有用户分数，计算具体概率
		if req.Score > 0 && minScore.Valid {
			probability = CalculateProbability(req.Score, minScore.Int32)
			strategy = GetStrategy(req.Score, minScore.Int32)
		}

		// 创建专业信息
		major := VoluntaryMajor{
			Code: code,
			ID:   id,
			Name: name,
			MinScore: func() int32 {
				if minScore.Valid {
					return minScore.Int32
				}
				return 0
			}(),
			MinRank: func() int32 {
				if minRank.Valid {
					return minRank.Int32
				}
				return 0
			}(),
			PlanNum: func() string {
				if planNum.Valid {
					return fmt.Sprintf("%d", planNum.Int32)
				}
				return "0"
			}(),
			Probability: probability,
			Remark: func() string {
				if remark.Valid {
					return remark.String
				}
				return ""
			}(),
			Strategy: strategy,
			StudyCost: func() string {
				if studyCost.Valid {
					return studyCost.String
				}
				return "0"
			}(),
			StudyYear: func() string {
				if studyYear.Valid {
					return fmt.Sprintf("%d", studyYear.Int32)
				}
				return ""
			}(),
			Year: "2024",
		}

		// 按学校代码+专业组代码分组
		groupKey := fmt.Sprintf("%s-%s", schoolCode, groupCode)
		groupMajorsMap[groupKey] = append(groupMajorsMap[groupKey], major)
		groupProbabilityMap[groupKey] = append(groupProbabilityMap[groupKey], probability)
	}

	// 创建专业组信息
	for groupKey, majors := range groupMajorsMap {
		probabilities := groupProbabilityMap[groupKey]

		// 计算专业组的平均概率
		var groupProbability int32 = 0
		if len(probabilities) > 0 {
			var sum int32 = 0
			for _, prob := range probabilities {
				sum += prob
			}
			groupProbability = sum / int32(len(probabilities))
		}

		// 根据策略参数筛选显示的专业
		filteredMajors := majors
		if req.Strategy > 0 {
			var strategyMajors []VoluntaryMajor
			for _, major := range majors {
				if major.Strategy == req.Strategy {
					strategyMajors = append(strategyMajors, major)
				}
			}

			// 如果筛选后没有专业，则保留全部
			if len(strategyMajors) > 0 {
				filteredMajors = strategyMajors
			}
		}

		// 从 groupKey 中解析出 groupCode
		parts := strings.Split(groupKey, "-")
		if len(parts) >= 2 {
			groupCode := parts[1]

			majorGroup := &VoluntaryMajorGroup{
				GroupCode:   groupCode,
				Major:       filteredMajors,
				Probability: groupProbability,
				Strategy:    req.Strategy,
			}

			result[groupKey] = majorGroup
		}
	}

	slog.Info("批量获取专业组信息完成",
		"schoolGroupCount", len(schoolGroups),
		"resultCount", len(result),
		"duration", time.Since(startTime).String(),
	)

	return result, nil
}

// GetMajorGroupDetail 获取专业组详细信息（保留原函数以兼容性）
func GetMajorGroupDetail(ctx context.Context, req *VoluntaryMajorGroupRequest) (*VoluntaryMajorGroup, error) {
	startTime := time.Now()

	// 获取ClickHouse连接
	db := database.GetClickHouse()
	if db == nil {
		return nil, fmt.Errorf("ClickHouse连接未初始化")
	}

	// 初始化辅助器
	enumMapper := NewEnumMapper()
	profileManager := &ProfileManager{}

	// 应用用户档案信息
	if err := profileManager.ApplyProfileToRequest(req.ProfileID, req); err != nil {
		slog.Warn("应用用户档案失败", "error", err.Error())
	}

	// 验证科目组合
	if req.Subjects != "" {
		if err := ValidateSubjects(req.Subjects); err != nil {
			return nil, fmt.Errorf("科目验证失败: %w", err)
		}
	}

	// 构建专业组查询 - 适配新表结构
	baseQuery := fmt.Sprintf(`SELECT 
	id,
	major_code as code,
	major_name as name,
	major_min_score_2024 as min_score,
	major_min_rank_2024 as min_rank,
	enrollment_plan_2024 as plan_num,
	tuition_fee as study_cost,
	study_duration as study_year,
	major_description as remark
FROM %s
WHERE school_code = ? AND major_group_code = ?
`, TABLE)

	queryBuilder := NewQueryBuilder(baseQuery)
	queryBuilder.args = append(queryBuilder.args, req.SchoolCode, req.GroupCode)

	// 处理省份条件
	if req.Province != "" {
		if provinceVal, exists := enumMapper.MapProvince(req.Province); exists {
			queryBuilder.AddCondition("source_province = ?", provinceVal)
		}
	}

	// 处理科目条件
	if req.Subjects != "" {
		subjectFilter, err := ParseSubjects(req.Subjects)
		if err != nil {
			return nil, fmt.Errorf("解析科目失败: %w", err)
		}

		// 添加科目相关条件
		subjectConditions, subjectArgs := subjectFilter.BuildSubjectConditions()
		queryBuilder.AddConditions(subjectConditions, subjectArgs)
	}

	// 构建最终查询
	finalQuery, finalArgs := queryBuilder.Build()
	finalQuery += " ORDER BY major_name ASC"

	slog.Info("查询专业组信息",
		"schoolCode", req.SchoolCode,
		"groupCode", req.GroupCode,
		"query", finalQuery,
		"args", finalArgs,
	)

	// 执行查询
	majorRows, err := db.QueryContext(ctx, finalQuery, finalArgs...)
	if err != nil {
		slog.Error("查询专业信息失败", "error", err.Error(), "schoolCode", req.SchoolCode, "groupCode", req.GroupCode)
		return nil, fmt.Errorf("查询专业信息失败: %w", err)
	}
	defer majorRows.Close()

	// 处理结果
	var majors []VoluntaryMajor
	var groupProbability int32 = 0

	for majorRows.Next() {
		var id int32
		var code, name string
		var minScore, minRank sql.NullInt32
		var planNum sql.NullInt32
		var studyCost sql.NullString
		var studyYear sql.NullInt32
		var remark sql.NullString

		if err := majorRows.Scan(&id, &code, &name, &minScore, &minRank, &planNum, &studyCost, &studyYear, &remark); err != nil {
			slog.Error("扫描专业信息失败", "error", err.Error())
			continue
		}

		// 计算每个专业的录取概率和策略
		var probability int32 = 50 // 默认50%
		var strategy int32 = 1     // 默认稳

		// 如果有用户分数，计算具体概率
		if req.Score > 0 && minScore.Valid {
			probability = CalculateProbability(req.Score, minScore.Int32)
			strategy = GetStrategy(req.Score, minScore.Int32)
		}

		// 更新专业组的整体概率（取平均值）
		groupProbability += probability

		// 创建专业信息
		major := VoluntaryMajor{
			Code: code,
			ID:   id,
			Name: name,
			MinScore: func() int32 {
				if minScore.Valid {
					return minScore.Int32
				}
				return 0
			}(),
			MinRank: func() int32 {
				if minRank.Valid {
					return minRank.Int32
				}
				return 0
			}(),
			PlanNum: func() string {
				if planNum.Valid {
					return fmt.Sprintf("%d", planNum.Int32)
				}
				return "0"
			}(),
			Probability: probability,
			Remark: func() string {
				if remark.Valid {
					return remark.String
				}
				return ""
			}(),
			Strategy: strategy,
			StudyCost: func() string {
				if studyCost.Valid {
					return studyCost.String
				}
				return "0"
			}(),
			StudyYear: func() string {
				if studyYear.Valid {
					return fmt.Sprintf("%d", studyYear.Int32)
				}
				return ""
			}(),
			Year: "2024",
		}

		majors = append(majors, major)
	}

	// 计算专业组的平均概率
	if len(majors) > 0 {
		groupProbability = groupProbability / int32(len(majors))

		// 根据策略参数筛选显示的专业
		if req.Strategy > 0 {
			var filteredMajors []VoluntaryMajor
			for _, major := range majors {
				if major.Strategy == req.Strategy {
					filteredMajors = append(filteredMajors, major)
				}
			}

			// 如果筛选后没有专业，则保留全部
			if len(filteredMajors) > 0 {
				majors = filteredMajors
			}
		}
	}

	// 创建专业组信息
	majorGroup := &VoluntaryMajorGroup{
		GroupCode:   req.GroupCode,
		Major:       majors,
		Probability: groupProbability,
		Strategy:    req.Strategy,
	}

	slog.Info("获取专业组信息完成",
		"schoolCode", req.SchoolCode,
		"groupCode", req.GroupCode,
		"majorCount", len(majors),
		"duration", time.Since(startTime).String(),
	)

	return majorGroup, nil
}
