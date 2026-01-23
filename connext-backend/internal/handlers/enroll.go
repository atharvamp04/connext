package handlers

import (
	"net/http"
	"time"

	"connext-backend/internal/database"
	"connext-backend/internal/models"

	"github.com/gofiber/fiber/v2"
)

// POST /api/enroll
// body: { enrollment_key, machine_key, public_key, hostname, os }
// This allows silent enrollment using an enrollment key (server-side)
// or daemon can call /enroll with just the key to request immediate approval.
func EnrollDevice(c *fiber.Ctx) error {
	var body struct {
		EnrollmentKey string `json:"enrollment_key"`
		MachineKey    string `json:"machine_key"`
		PublicKey     string `json:"public_key"`
		Hostname      string `json:"hostname"`
		OS            string `json:"os"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "invalid body"})
	}

	// Validate enrollment key
	var ek models.EnrollmentKey
	if err := database.DB.Where("key = ?", body.EnrollmentKey).First(&ek).Error; err != nil {
		return c.Status(401).JSON(fiber.Map{"error": "invalid enrollment key"})
	}
	// check expiry
	if !ek.ExpiresAt.IsZero() && time.Now().After(ek.ExpiresAt) {
		return c.Status(401).JSON(fiber.Map{"error": "enrollment key expired"})
	}

	// allocate node id & ip
	nodeID := randToken(10)
	ip := allocateNextIP()

	// build wireguard config (replace with your generator)
	wg := generateWireguardConfig(body.PublicKey, nodeID, ip)

	// create ConnexrDevice
	dev := models.ConnexrDevice{
		PubKey:   body.PublicKey,
		Name:     body.Hostname,
		IP:       ip,
		Region:   "auto",
		Status:   "active",
		LastSeen: time.Now(),
		Token:    randToken(16),
	}
	if err := database.DB.Create(&dev).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed saving device"})
	}

	// increment usage_count and delete if one-time
	ek.UsageCount++
	if !ek.Reusable {
		database.DB.Delete(&ek)
	} else {
		database.DB.Save(&ek)
	}

	return c.JSON(fiber.Map{
		"node_id":          nodeID,
		"ip_address":       ip,
		"wireguard_config": wg,
		"token":            dev.Token,
	})
}
