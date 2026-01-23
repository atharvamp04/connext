package models

import "gorm.io/gorm"

type User struct {
	gorm.Model

	FirstName string `gorm:"size:50;not null" json:"firstname"`
	LastName  string `gorm:"size:50;not null" json:"lastname"`
	Email     string `gorm:"size:100;uniqueIndex;not null" json:"email"`
	Password  string `gorm:"not null" json:"-"`

	// Optional: track who created the user
	CreatedBy uint `gorm:"default:0" json:"created_by"`
}
