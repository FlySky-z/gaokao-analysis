package models

import "strings"

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
