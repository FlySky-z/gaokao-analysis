package models

import "database/sql"

// GaokaoData matches the structure of your gaokao_data table
type GaokaoData struct {
	ID                              int32          `db:"id"`
	SourceLocation                  string         `db:"source_location"`
	PlanBatch                       string         `db:"plan_batch"`
	PlanSubjectType                 string         `db:"plan_subject_type"`
	PlanSubjectRestrictionBit       int32          `db:"plan_subject_restriction_bit"`
	PlanSchoolCode                  string         `db:"plan_school_code"`
	PlanMajorGroupCode              string         `db:"plan_major_group_code"`
	PlanSchoolName                  string         `db:"plan_school_name"`
	PlanMajorCode                   string         `db:"plan_major_code"`
	PlanMajorName                   string         `db:"plan_major_name"`
	PlanMajorRemark                 sql.NullString `db:"plan_major_remark"`
	PlanDuration                    sql.NullString `db:"plan_duration"`
	PlanTuitionFee                  sql.NullInt32  `db:"plan_tuition_fee"`
	Admission2024PlanCount          int32          `db:"admission_2024_plan_count"`
	PlanNewMajor                    uint8          `db:"plan_new_major"`
	Admission2024MinScore           sql.NullInt32  `db:"admission_2024_min_score"`
	Admission2024MinRank            sql.NullInt32  `db:"admission_2024_min_rank"`
	Admission2024MajorGroupMinScore sql.NullInt32  `db:"admission_2024_major_group_min_score"`
	Admission2024MajorGroupMinRank  sql.NullInt32  `db:"admission_2024_major_group_min_rank"`
	Admission2023MajorGroupMinScore sql.NullInt32  `db:"admission_2023_major_group_min_score"`
	Admission2023MajorGroupMinRank  sql.NullInt32  `db:"admission_2023_major_group_min_rank"`
	Admission2023PlanCount          sql.NullInt32  `db:"admission_2023_plan_count"`
	Admission2023MinScore           sql.NullInt32  `db:"admission_2023_min_score"`
	Admission2023MinRank            sql.NullInt32  `db:"admission_2023_min_rank"`
	Admission2022PlanCount          sql.NullInt32  `db:"admission_2022_plan_count"`
	Admission2022MinScore           sql.NullInt32  `db:"admission_2022_min_score"`
	Admission2022MinRank            sql.NullInt32  `db:"admission_2022_min_rank"`
	Admission2021PlanCount          sql.NullInt32  `db:"admission_2021_plan_count"`
	Admission2021MinScore           sql.NullInt32  `db:"admission_2021_min_score"`
	Admission2021MinRank            sql.NullInt32  `db:"admission_2021_min_rank"`
	SchoolInfoProvince              sql.NullString `db:"school_info_province"`
	SchoolInfoCity                  sql.NullString `db:"school_info_city"`
	SchoolInfoLevel                 sql.NullString `db:"school_info_level"`
	SchoolInfoAffiliation           sql.NullString `db:"school_info_affiliation"`
	SchoolInfoTagsList              []string       `db:"school_info_tags_list"` // ClickHouse Array(String)
	SchoolInfoPublicPrivate         sql.NullString `db:"school_info_public_private"`
	SchoolInfoLevelList             []string       `db:"school_info_level_list"` // ClickHouse Array(String)
}
