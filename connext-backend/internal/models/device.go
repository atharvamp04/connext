package models

import "time"

type ConnexrDevice struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	PubKey    string    `gorm:"uniqueIndex;size:128" json:"pubkey"`
	Name      string    `json:"name"`
	IP        string    `json:"ip"`
	Region    string    `json:"region"`
	Status    string    `json:"status"`
	Endpoint  string    `json:"endpoint"`
	PunchPort uint16    `json:"punch_port"`
	LastSeen  time.Time `json:"last_seen"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	Token     string    `json:"token"` // daemon auth token
}
