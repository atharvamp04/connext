package handlers

import (
	"fmt"
	"time"

	"connext-backend/internal/database"
	"connext-backend/internal/models"

	"github.com/gofiber/fiber/v2"
)

// GET /api/peers
// Returns list of ALL devices for daemon sync
func ListPeers(c *fiber.Ctx) error {
	var devices []models.ConnexrDevice
	database.DB.Find(&devices)

	now := time.Now()

	type Peer struct {
		NodeID     string  `json:"node_id"`
		MachineKey string  `json:"machine_key"`
		PublicKey  string  `json:"public_key"`
		IPAddress  string  `json:"ip_address"`
		Endpoint   *string `json:"endpoint"`
		PunchPort  uint16  `json:"punch_port"` // ← NEW: Port for NAT hole punching
		IsOnline   bool    `json:"is_online"`
		LastSeen   string  `json:"last_seen"`
		NodeName   string  `json:"node_name"`
	}

	out := []Peer{}

	for _, d := range devices {
		isOnline := now.Sub(d.LastSeen) < 90*time.Second

		var ep *string
		if d.Endpoint != "" {
			ep = &d.Endpoint
		}

		out = append(out, Peer{
			NodeID:     fmt.Sprintf("node-%d", d.ID),
			MachineKey: d.PubKey,
			PublicKey:  d.PubKey,
			IPAddress:  d.IP,
			Endpoint:   ep,
			PunchPort:  d.PunchPort, // ← NEW: Include punch port from database
			IsOnline:   isOnline,
			LastSeen:   d.LastSeen.Format(time.RFC3339),
			NodeName:   d.Name,
		})
	}

	return c.JSON(out)
}
