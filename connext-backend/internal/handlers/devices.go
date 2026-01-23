package handlers

import (
	"time"

	"connext-backend/internal/database"
	"connext-backend/internal/models"

	"github.com/gofiber/fiber/v2"
)

func Heartbeat(c *fiber.Ctx) error {
	var hb struct {
		MachineKey string `json:"machine_key"`
		Endpoint   string `json:"endpoint"`
		PunchPort  uint16 `json:"punch_port"`
	}

	if err := c.BodyParser(&hb); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid body"})
	}

	var dev models.ConnexrDevice
	if err := database.DB.Where("pub_key = ?", hb.MachineKey).First(&dev).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "device not found"})
	}

	// Update fields
	dev.Endpoint = hb.Endpoint
	dev.LastSeen = time.Now()
	dev.Status = "online"
	dev.PunchPort = hb.PunchPort

	database.DB.Save(&dev)

	return c.JSON(fiber.Map{"ok": true})
}

// GET /api/devices
func ListDevices(c *fiber.Ctx) error {
	var devices []models.ConnexrDevice
	database.DB.Order("last_seen desc").Find(&devices)

	// Mark offline if last_seen > 90 sec
	now := time.Now()

	type DeviceResponse struct {
		ID        uint      `json:"id"`
		PubKey    string    `json:"pubkey"`
		Name      string    `json:"name"`
		IP        string    `json:"ip"`
		Region    string    `json:"region"`
		Status    string    `json:"status"`
		Endpoint  string    `json:"endpoint"`
		LastSeen  time.Time `json:"last_seen"`
		CreatedAt time.Time `json:"created_at"`
	}

	out := []DeviceResponse{}

	for _, d := range devices {
		status := "offline"
		if now.Sub(d.LastSeen) < 90*time.Second {
			status = "online"
		}

		out = append(out, DeviceResponse{
			ID:        d.ID,
			PubKey:    d.PubKey,
			Name:      d.Name,
			IP:        d.IP,
			Region:    d.Region,
			Status:    status,
			Endpoint:  d.Endpoint,
			LastSeen:  d.LastSeen,
			CreatedAt: d.CreatedAt,
		})
	}

	return c.JSON(fiber.Map{
		"devices": out,
	})
}

// DELETE /api/devices/:pubkey
func DeleteDevice(c *fiber.Ctx) error {
	pubkey := c.Params("pubkey")

	database.DB.Where("pub_key = ?", pubkey).Delete(&models.ConnexrDevice{})

	return c.JSON(fiber.Map{
		"deleted": pubkey,
	})
}
