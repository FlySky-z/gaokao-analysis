package models

import (
	"context"
	"database/sql"
	"fmt"
	"gaokao-data-analysis/database"
	"log/slog"
	"strings"
	"time"
)

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
