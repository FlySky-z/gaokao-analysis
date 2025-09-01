# 专业组查询批量优化文档

## 问题描述

原始的 `GetMajorGroupDetail` 函数在执行院校优先查询时，会对每个专业组单独进行数据库查询，导致：
- 大量重复的数据库连接开销
- 查询时间随专业组数量线性增长
- 数据库连接池压力过大

## 优化方案

### 1. 新增数据结构

```go
// SchoolGroupPair 学校代码和专业组代码对
type SchoolGroupPair struct {
    SchoolCode string
    GroupCode  string
}
```

### 2. 批量查询函数

新增 `GetMajorGroupsDetail` 函数：
- 接收多个学校-专业组对作为参数
- 使用 `IN` 条件进行批量查询
- 返回以 `schoolCode-groupCode` 为键的 map

### 3. 查询逻辑优化

修改 `executeUniversityQuery` 函数：
1. 第一遍遍历：收集所有学校和专业组信息
2. 批量查询：一次性获取所有专业组详情
3. 第二遍分配：将专业组信息分配给对应院校

## 性能提升

### 数据库查询次数
- **优化前**: N 次查询（N = 专业组数量）
- **优化后**: 1 次查询

### 预期性能提升
- 当有 50 个专业组时：从 50 次查询减少到 1 次查询
- 网络延迟减少：从 50 * 网络延迟 减少到 1 * 网络延迟
- 连接池压力减轻：避免频繁获取和释放连接

## 使用示例

```go
// 原来的单个查询（已保留兼容性）
majorGroup, err := GetMajorGroupDetail(ctx, req)

// 新的批量查询
schoolGroups := []SchoolGroupPair{
    {SchoolCode: "1001", GroupCode: "01"},
    {SchoolCode: "1002", GroupCode: "02"},
}
majorGroupsMap, err := GetMajorGroupsDetail(ctx, schoolGroups, req)
```

## 兼容性

- 保留了原始的 `GetMajorGroupDetail` 函数以确保向后兼容
- 院校优先查询自动使用批量优化版本
- API 接口不变，用户无感知升级

## 测试建议

1. 对比优化前后的查询时间
2. 监控数据库连接池使用情况
3. 压力测试验证并发性能提升
