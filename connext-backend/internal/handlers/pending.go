package handlers

import (
	"connext-backend/internal/database"
	"connext-backend/internal/models"

	"github.com/gofiber/fiber/v2"
)

// GET /api/machines/pending/:token
func GetPendingMachine(c *fiber.Ctx) error {
	token := c.Params("token")
	if token == "" {
		return c.Status(400).JSON(fiber.Map{"error": "missing token"})
	}

	var pm models.PendingMachine
	if err := database.DB.Where("approve_token = ?", token).First(&pm).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "not found"})
	}

	// unwrap pointer values safely
	hostname := ""
	osName := ""
	machineKey := ""

	if pm.Hostname != nil {
		hostname = *pm.Hostname
	}
	if pm.OS != nil {
		osName = *pm.OS
	}
	if pm.MachineKey != nil {
		machineKey = *pm.MachineKey
	}

	return c.JSON(fiber.Map{
		"hostname":    hostname,
		"os":          osName,
		"machine_key": machineKey,
		"created_at":  pm.CreatedAt,
	})
}
