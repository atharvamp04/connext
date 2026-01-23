package models

import "time"

type EnrollmentKey struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	Key        string    `gorm:"uniqueIndex;size:128" json:"key"`
	Reusable   bool      `json:"reusable"`
	ExpiresAt  time.Time `json:"expires_at"`
	CreatedAt  time.Time `json:"created_at"`
	CreatedBy  uint      `json:"created_by"` // FIXED: uint, not string
	UsageCount uint      `json:"usage_count"`
}
