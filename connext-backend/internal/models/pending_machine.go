package models

import "time"

type PendingMachine struct {
	ID           uint   `gorm:"primaryKey"`
	ApproveToken string `gorm:"uniqueIndex"`

	MachineKey *string `gorm:"uniqueIndex;default:null"`
	PublicKey  *string `gorm:"uniqueIndex;default:null"`

	Hostname *string `gorm:"default:null"`
	OS       *string `gorm:"default:null"`

	NodeID       *string `gorm:"default:null"`
	IPAddress    *string `gorm:"default:null"`
	WireguardCfg *string `gorm:"type:text"`

	Approved   bool
	ApprovedAt time.Time
	ApprovedBy uint
	CreatedAt  time.Time
}
