package models

import (
	"fmt"
	"strings"
)

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
