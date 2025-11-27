package models

import "gorm.io/gorm"

type User struct {
	gorm.Model

	Name          string `gorm:"size:50;not null" json:"name"`
	Email         string `gorm:"size:100;uniqueIndex;not null" json:"email"`
	Password      string `gorm:"not null" json:"-"`
	HeadscaleUser string `gorm:"not null;default:default" json:"headscale_user"`

	// Track who created this user (0 = self-registered, >0 = created by another user)
	CreatedBy uint `gorm:"default:0" json:"created_by"`
}
