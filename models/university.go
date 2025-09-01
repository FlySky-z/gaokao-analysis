package models

import (
	"context"
	"database/sql"
	"fmt"
	"log/slog"
	"strings"
)

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
