package models

import "time"

// NodeRecord tracks which user registered which node
type NodeRecord struct {
	ID            uint   `gorm:"primaryKey"`
	NodeName      string `gorm:"uniqueIndex;not null"`
	UserID        uint   `gorm:"not null;index"`
	HeadscaleUser string `gorm:"not null"`
	RegisteredAt  time.Time
	CreatedAt     time.Time
	UpdatedAt     time.Time
}
