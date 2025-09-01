package models

import "strings"

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
