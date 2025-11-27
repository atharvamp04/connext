package models

import (
	"time"

	"gorm.io/gorm"
)

type PreAuthKey struct {
	gorm.Model

	// Who generated the key (optional, if you later support multiple users)
	UserID uint `json:"user_id"`

	// The actual key from Headscale (example: 79327d166932...)
	Key string `gorm:"uniqueIndex;size:200;not null" json:"key"`

	// Whether it can be reused or only once
	Reusable bool `gorm:"not null" json:"reusable"`

	// Whether it is already used by a node
	Used bool `gorm:"not null" json:"used"`

	// When the key expires
	ExpiresAt time.Time `json:"expires_at"`

	// If true, the key is temporary
	Ephemeral bool `gorm:"not null" json:"ephemeral"`
}
