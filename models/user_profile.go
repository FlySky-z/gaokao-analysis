package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"

	"gaokao-data-analysis/database"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// UserProfile represents a user's profile in the system
type UserProfile struct {
	ID         string         `gorm:"type:varchar(36);primaryKey" json:"id"`
	Username   string         `gorm:"type:varchar(100);not null" json:"username"`
	Gender     *string        `gorm:"type:varchar(20)" json:"gender,omitempty"`
	Province   string         `gorm:"type:varchar(50);not null" json:"province"`
	Score      int32          `gorm:"not null" json:"score"`
	Rank       int32          `gorm:"not null" json:"rank"`
	Subjects   StringList     `gorm:"type:json;not null" json:"subjects"`
	Preference Preference     `gorm:"type:json;not null" json:"preference,omitempty"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`
}

// Preference defines a user's preferences
type Preference struct {
	CareerInterest     []string `json:"career_interest,omitempty"`
	GraduationPlan     []string `json:"graduation_plan,omitempty"`
	MajorPreference    []string `json:"major_preference,omitempty"`
	Other              *string  `json:"other,omitempty"`
	PriorityStrategy   string   `json:"priority_strategy"`
	RegionPreference   []string `json:"region_preference,omitempty"`
	TargetUniversities []string `json:"target_universities,omitempty"`
	TuitionPreference  *string  `json:"tuition_preference,omitempty"`
}

// StringList is a custom type for handling string arrays in the database
type StringList []string

// BeforeCreate will set a UUID rather than numeric ID.
func (u *UserProfile) BeforeCreate(tx *gorm.DB) (err error) {
	if u.ID == "" {
		u.ID = uuid.New().String()
	}
	return
}

// Value makes StringList implement the driver.Valuer interface.
func (l StringList) Value() (driver.Value, error) {
	return json.Marshal(l)
}

// Scan makes StringList implement the sql.Scanner interface.
func (l *StringList) Scan(value interface{}) error {
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}
	return json.Unmarshal(bytes, l)
}

// Value makes Preference implement the driver.Valuer interface.
func (p Preference) Value() (driver.Value, error) {
	return json.Marshal(p)
}

// Scan makes Preference implement the sql.Scanner interface.
func (p *Preference) Scan(value interface{}) error {
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}
	return json.Unmarshal(bytes, p)
}

// UserProfileRequest represents the API request to create or update a user profile
type UserProfileRequest struct {
	Gender     *string     `json:"gender,omitempty"`
	Preference *Preference `json:"preference,omitempty"`
	Province   string      `json:"province"`
	Rank       int32       `json:"rank"`
	Score      int32       `json:"score"`
	Subjects   []string    `json:"subjects"`
	Username   string      `json:"username"`
}

// APIResponse represents a standard API response
type APIResponse struct {
	Code int32       `json:"code"`
	Data interface{} `json:"data"`
	Msg  string      `json:"msg"`
}

// ProfileIDResponse represents the profile ID response
type ProfileIDResponse struct {
	ProfileID *string `json:"profile_id,omitempty"`
}

// ==================== Database Operations ====================

// CreateUserProfile creates a new user profile in the database
func CreateUserProfile(request *UserProfileRequest) (*UserProfile, error) {
	// Convert request to UserProfile
	userProfile := &UserProfile{
		Username: request.Username,
		Gender:   request.Gender,
		Province: request.Province,
		Score:    request.Score,
		Rank:     request.Rank,
		Subjects: request.Subjects,
	}

	// Set preference if provided
	if request.Preference != nil {
		userProfile.Preference = *request.Preference
	} else {
		// Set default preference with required field
		userProfile.Preference = Preference{
			PriorityStrategy: "school", // Default value
		}
	}

	// Save to database
	db := database.GetDB()
	if result := db.Create(userProfile); result.Error != nil {
		return nil, result.Error
	}

	return userProfile, nil
}

// GetUserProfileByID retrieves a user profile by ID
func GetUserProfileByID(id string) (*UserProfile, error) {
	var userProfile UserProfile
	db := database.GetDB()
	if result := db.First(&userProfile, "id = ?", id); result.Error != nil {
		return nil, result.Error
	}
	return &userProfile, nil
}

// ==================== Response Helpers ====================

// SuccessResponse creates a successful API response
func SuccessResponse(data interface{}, msg string) *APIResponse {
	return &APIResponse{
		Code: 200,
		Data: data,
		Msg:  msg,
	}
}

// ErrorResponse creates an error API response
func ErrorResponse(code int32, msg string) *APIResponse {
	return &APIResponse{
		Code: code,
		Msg:  msg,
		Data: nil,
	}
}
