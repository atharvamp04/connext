// internal/models/invitation.go
package models

import "gorm.io/gorm"

// Invitation model for network sharing
type Invitation struct {
	gorm.Model

	// Who sent the invitation
	InviterID uint `gorm:"not null" json:"inviter_id"`

	// Who is invited (email)
	InviteeEmail string `gorm:"size:100;not null" json:"invitee_email"`
	InviteeName  string `gorm:"size:50" json:"invitee_name"`

	// Invitation details
	Token  string `gorm:"size:64;uniqueIndex;not null" json:"token"`
	Status string `gorm:"size:20;default:'pending'" json:"status"` // pending, accepted, declined, cancelled

	// If accepted, who accepted it
	AcceptedByID *uint `json:"accepted_by_id,omitempty"`
}
