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

// 科目字符串转换为位图
func SubjectsToBitmap(subjectsStr string) int {
	// 科目映射表
	subjectMap := map[string]int{
		"物理": 1,  // 2^0
		"化学": 2,  // 2^1
		"生物": 4,  // 2^2
		"政治": 8,  // 2^3
		"历史": 16, // 2^4
		"地理": 32, // 2^5
	}

	// 如果为空，返回0（不限制科目）
	if subjectsStr == "" {
		return 0
	}

	subjects := strings.Split(subjectsStr, ",")
	bitmap := 0

	for _, subject := range subjects {
		if bit, exists := subjectMap[strings.TrimSpace(subject)]; exists {
			bitmap |= bit
		}
	}

	return bitmap
}

// ValidateSubjects 验证科目组合，必须包含物理或历史
func ValidateSubjects(subjectsStr string) error {
	if subjectsStr == "" {
		return fmt.Errorf("科目不能为空，必须包含物理或历史")
	}

	subjects := strings.Split(subjectsStr, ",")
	hasPhysics := false
	hasHistory := false

	for _, subject := range subjects {
		subject = strings.TrimSpace(subject)
		if subject == "物理" {
			hasPhysics = true
		} else if subject == "历史" {
			hasHistory = true
		}
	}

	if !hasPhysics && !hasHistory {
		return fmt.Errorf("科目组合必须包含物理或历史")
	}

	return nil
}

// GetSubjectType 获取科目类型（物理或历史）
func GetSubjectType(subjectsStr string) string {
	if subjectsStr == "" {
		return ""
	}

	subjects := strings.Split(subjectsStr, ",")
	for _, subject := range subjects {
		subject = strings.TrimSpace(subject)
		if subject == "物理" {
			return "物理"
		} else if subject == "历史" {
			return "历史"
		}
	}

	return ""
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

// GetUniversityPriorityVoluntary 查询志愿-院校优先
func GetUniversityPriorityVoluntary(ctx context.Context, req *VoluntaryUniversityPriorityRequest) (*VoluntaryUniversityPriorityData, error) {
	startTime := time.Now()

	// 获取ClickHouse连接
	db := database.GetClickHouse()
	if db == nil {
		return nil, fmt.Errorf("ClickHouse连接未初始化")
	}

	// 构建基础查询
	baseQuery := `
		SELECT 
			plan_school_code as recruit_code,
			plan_school_name as university_name,
			school_info_province as province,
			school_info_level_list as category,
			school_info_tags_list as tags,
			plan_major_group_code as group_code,
			count(*) as major_count
		FROM gaokao_data
		WHERE 1=1
	`

	// 构建查询条件
	var conditions []string
	var args []interface{}

	// 处理用户档案
	if req.ProfileID != "" {
		// 查询用户档案
		profile, err := GetUserProfileByID(req.ProfileID)
		if err == nil && profile != nil {
			// 使用用户档案中的信息
			if profile.Province != "" {
				conditions = append(conditions, "source_location = ?")
				args = append(args, profile.Province)
			}

			if profile.Score > 0 {
				req.Score = profile.Score
			}

			if profile.Rank > 0 {
				req.Rank = profile.Rank
			}

			if len(profile.Subjects) > 0 {
				req.Subjects = strings.Join(profile.Subjects, ",")
			}
		}
	}

	// 验证科目组合（必须包含物理或历史）
	if err := ValidateSubjects(req.Subjects); err != nil {
		return nil, fmt.Errorf("科目验证失败: %w", err)
	}

	// 处理省份
	if req.Province != "" {
		conditions = append(conditions, "source_location = ?")
		args = append(args, req.Province)
	}

	// 处理分数范围
	if req.Score > 0 {
		// 根据策略调整分数范围
		strategy := req.Strategy

		var minScoreDiff, maxScoreDiff int32

		switch strategy {
		case 0: // 冲
			minScoreDiff = 3  // 分数比最低分高3分
			maxScoreDiff = 20 // 分数比最低分高20分
		case 1: // 稳
			minScoreDiff = -5 // 分数比最低分低5分
			maxScoreDiff = 3  // 分数比最低分高3分
		case 2: // 保
			minScoreDiff = -20 // 分数比最低分低20分
			maxScoreDiff = -5  // 分数比最低分低5分
		}

		conditions = append(conditions, "admission_2024_major_group_min_score >= ?")
		args = append(args, req.Score+minScoreDiff)

		conditions = append(conditions, "admission_2024_major_group_min_score <= ?")
		args = append(args, req.Score+maxScoreDiff)
	}

	// 处理科目类型过滤（物理或历史）
	if req.Subjects != "" {
		subjectType := GetSubjectType(req.Subjects)
		if subjectType != "" {
			conditions = append(conditions, "plan_subject_type = ?")
			args = append(args, subjectType)
		}

		// 处理其他科目限制
		subjectBitmap := SubjectsToBitmap(req.Subjects)
		if subjectBitmap > 0 {
			// 检查科目位图是否匹配
			conditions = append(conditions, "(plan_subject_restriction_bit = 0 OR bitAnd(plan_subject_restriction_bit, ?) = plan_subject_restriction_bit)")
			args = append(args, subjectBitmap)
		}
	}

	// 处理城市筛选
	if req.Citys != "" {
		cities := strings.Split(req.Citys, ",")
		if len(cities) > 0 {
			citiesCondition := make([]string, len(cities))
			for i, city := range cities {
				citiesCondition[i] = "school_info_city = ?"
				args = append(args, strings.TrimSpace(city))
			}
			conditions = append(conditions, "("+strings.Join(citiesCondition, " OR ")+")")
		}
	}

	// 处理院校类型筛选
	if req.CollegeType != "" {
		collegeTypes := strings.Split(req.CollegeType, ",")
		if len(collegeTypes) > 0 {
			// 分类处理不同类型的筛选条件
			var publicPrivateConditions []string
			var tagsConditions []string
			// TODO: 考虑增加院校的水平查询
			// var levelConditions []string

			for _, colType := range collegeTypes {
				colType = strings.TrimSpace(colType)
				// 根据不同的类型添加不同的筛选条件
				switch {
				case colType == "公办" || colType == "民办":
					publicPrivateConditions = append(publicPrivateConditions, "school_info_public_private = ?")
					args = append(args, colType)
				default:
					// 假设其他为院校类型
					tagsConditions = append(tagsConditions, "has(school_info_tags_list, ?)")
					args = append(args, colType)
				}
			}

			// 合并各类条件
			var typeConditions []string
			if len(publicPrivateConditions) > 0 {
				typeConditions = append(typeConditions, "("+strings.Join(publicPrivateConditions, " OR ")+")")
			}
			if len(tagsConditions) > 0 {
				typeConditions = append(typeConditions, "("+strings.Join(tagsConditions, " OR ")+")")
			}

			if len(typeConditions) > 0 {
				conditions = append(conditions, "("+strings.Join(typeConditions, " AND ")+")")
			}
		}
	}

	// 添加筛选条件到查询
	if len(conditions) > 0 {
		baseQuery += " AND " + strings.Join(conditions, " AND ")
	}

	// 添加分组和排序
	baseQuery += `
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

	// 添加分页
	if req.Page <= 0 {
		req.Page = 1
	}
	if req.PageSize <= 0 {
		req.PageSize = 20
	}

	limit := req.PageSize
	offset := (req.Page - 1) * req.PageSize

	// 先查询不带分页的结果总数
	// 构建总数查询 - 只计算满足条件的不同学校数量
	countQuery := `
		SELECT count(DISTINCT plan_school_name) 
		FROM gaokao_data
		WHERE 1=1
	`

	// 添加相同的筛选条件到计数查询
	if len(conditions) > 0 {
		countQuery += " AND " + strings.Join(conditions, " AND ")
	}

	// 执行总数查询
	slog.Info("查询符合条件的院校总数", "query", countQuery, "args", args)

	var total int64
	err := db.QueryRowContext(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		slog.Error("查询志愿总数失败", "error", err.Error())
		return nil, fmt.Errorf("查询志愿总数失败: %w", err)
	}

	slog.Info("查询志愿院校总数完成",
		"total", total,
		"duration", time.Since(startTime).String(),
		"page", req.Page,
		"pageSize", req.PageSize,
	)

	// 添加分页限制
	paginatedQuery := baseQuery + fmt.Sprintf(" LIMIT %d OFFSET %d", limit, offset)

	// 执行查询
	slog.Info("查询志愿院校分页", "query", paginatedQuery, "args", args)

	rows, err := db.QueryContext(ctx, paginatedQuery, args...)
	if err != nil {
		slog.Error("查询志愿院校分页失败", "error", err.Error())
		return nil, fmt.Errorf("查询志愿院校分页失败: %w", err)
	}
	defer rows.Close()

	// 处理结果
	var resultItems []*VoluntaryUniversityItem             // 使用指针切片
	schoolMap := make(map[string]*VoluntaryUniversityItem) // 使用院校名称作为键

	for rows.Next() {
		var recruitCode, universityName, province, groupCode string
		var category, tags []string
		var majorCount int

		if err := rows.Scan(&recruitCode, &universityName, &province, &category, &tags, &groupCode, &majorCount); err != nil {
			slog.Error("扫描志愿院校结果失败", "error", err.Error())
			continue
		}

		// 检查学校是否已经存在
		schoolItem, exists := schoolMap[universityName]
		if !exists {
			// 创建新的院校条目
			schoolItem = &VoluntaryUniversityItem{
				RecruitCode:    recruitCode, // 仍然保留招生代码，但不用作映射键
				UniversityName: universityName,
				Province:       province,
				Category:       category,
				Tags:           tags,
				MajorGroup:     []VoluntaryMajorGroup{},
			}
			schoolMap[universityName] = schoolItem
			resultItems = append(resultItems, schoolItem) // 使用指针
		}

		// 获取专业组信息
		majorGroupReq := &VoluntaryMajorGroupRequest{
			SchoolCode: recruitCode,
			GroupCode:  groupCode,
			Province:   req.Province,
			ProfileID:  req.ProfileID,
			Score:      req.Score,
			Rank:       req.Rank,
			Strategy:   req.Strategy,
			Subjects:   req.Subjects,
		}

		majorGroup, err := GetMajorGroupDetails(ctx, majorGroupReq)
		if err != nil {
			slog.Error("获取专业组信息失败",
				"error", err.Error(),
				"school", universityName,
				"recruitCode", recruitCode,
				"groupCode", groupCode,
			)
			continue
		}

		// 添加专业组到院校
		schoolItem.MajorGroup = append(schoolItem.MajorGroup, *majorGroup)
	}

	// 计算分页信息
	pageNum := (int32(total) + req.PageSize - 1) / req.PageSize

	// 将指针切片转换为值切片
	result := make([]VoluntaryUniversityItem, len(resultItems))
	for i, item := range resultItems {
		result[i] = *item
	}

	// 创建响应数据
	data := &VoluntaryUniversityPriorityData{
		List:     result,
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
		"resultCount", len(result),
		"majorGroupCount", func() int {
			count := 0
			for _, item := range result {
				count += len(item.MajorGroup)
			}
			return count
		}(),
	)

	return data, nil
}

// GetMajorGroupDetails 获取专业组详细信息
func GetMajorGroupDetails(ctx context.Context, req *VoluntaryMajorGroupRequest) (*VoluntaryMajorGroup, error) {
	startTime := time.Now()

	// 获取ClickHouse连接
	db := database.GetClickHouse()
	if db == nil {
		return nil, fmt.Errorf("ClickHouse连接未初始化")
	}

	// 构建专业组查询
	majorQuery := `
		SELECT 
			id,
			plan_major_code as code,
			plan_major_name as name,
			admission_2024_major_group_min_score as min_score,
			admission_2024_major_group_min_rank as min_rank,
			admission_2024_plan_count as plan_num,
			plan_tuition_fee as study_cost,
			plan_duration as study_year,
			plan_major_remark as remark
		FROM gaokao_data
		WHERE plan_school_code = ? AND plan_major_group_code = ?
	`

	// 添加筛选条件
	majorQueryConditions := []string{}
	majorQueryArgs := []interface{}{req.SchoolCode, req.GroupCode}

	// 处理用户档案
	if req.ProfileID != "" {
		// 查询用户档案
		profile, err := GetUserProfileByID(req.ProfileID)
		if err == nil && profile != nil {
			// 使用用户档案中的信息
			if profile.Province != "" {
				majorQueryConditions = append(majorQueryConditions, "source_location = ?")
				majorQueryArgs = append(majorQueryArgs, profile.Province)
			}

			if profile.Score > 0 {
				req.Score = profile.Score
			}

			if profile.Rank > 0 {
				req.Rank = profile.Rank
			}

			if len(profile.Subjects) > 0 {
				req.Subjects = strings.Join(profile.Subjects, ",")
			}
		}
	}

	// 验证科目组合（必须包含物理或历史）
	if req.Subjects != "" {
		if err := ValidateSubjects(req.Subjects); err != nil {
			return nil, fmt.Errorf("科目验证失败: %w", err)
		}
	}

	// 添加省份条件
	if req.Province != "" {
		majorQueryConditions = append(majorQueryConditions, "source_location = ?")
		majorQueryArgs = append(majorQueryArgs, req.Province)
	}

	// 处理科目类型过滤（物理或历史）
	if req.Subjects != "" {
		subjectType := GetSubjectType(req.Subjects)
		if subjectType != "" {
			majorQueryConditions = append(majorQueryConditions, "plan_subject_type = ?")
			majorQueryArgs = append(majorQueryArgs, subjectType)
		}

		// 添加其他科目限制
		subjectBitmap := SubjectsToBitmap(req.Subjects)
		if subjectBitmap > 0 {
			majorQueryConditions = append(majorQueryConditions, "(plan_subject_restriction_bit = 0 OR bitAnd(plan_subject_restriction_bit, ?) = plan_subject_restriction_bit)")
			majorQueryArgs = append(majorQueryArgs, subjectBitmap)
		}
	}

	// 添加条件到查询
	if len(majorQueryConditions) > 0 {
		majorQuery += " AND " + strings.Join(majorQueryConditions, " AND ")
	}

	majorQuery += " ORDER BY plan_major_name ASC"

	slog.Info("查询专业组信息",
		"schoolCode", req.SchoolCode,
		"groupCode", req.GroupCode,
		"query", majorQuery,
		"args", majorQueryArgs,
	)

	// 执行查询
	majorRows, err := db.QueryContext(ctx, majorQuery, majorQueryArgs...)
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
		var studyCost sql.NullInt32
		var studyYear sql.NullString
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
					return fmt.Sprintf("%d", studyCost.Int32)
				}
				return "0"
			}(),
			StudyYear: func() string {
				if studyYear.Valid {
					return studyYear.String
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
