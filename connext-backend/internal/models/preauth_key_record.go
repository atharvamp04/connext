package models

import "time"

// PreAuthKeyRecord tracks which user created which pre-auth key
type PreAuthKeyRecord struct {
	ID            uint   `gorm:"primaryKey"`
	KeyString     string `gorm:"uniqueIndex;not null"`
	UserID        uint   `gorm:"not null;index"`
	HeadscaleUser string `gorm:"not null"`
	CreatedAt     time.Time
	UpdatedAt     time.Time
}
