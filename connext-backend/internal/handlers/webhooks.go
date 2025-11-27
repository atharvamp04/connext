package handlers

import (
	"time"

	"connext-backend/internal/database"
	"connext-backend/internal/models"

	"github.com/gofiber/fiber/v2"
)

// NodeRegistrationWebhook - Called when a node successfully connects
// This helps track which user registered which node
func NodeRegistrationWebhook(c *fiber.Ctx) error {
	var body struct {
		NodeName      string `json:"node_name"`
		UserEmail     string `json:"user_email"`
		HeadscaleUser string `json:"headscale_user"`
	}

	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request"})
	}

	// Find the user by email
	var user models.User
	if err := database.DB.Where("email = ?", body.UserEmail).First(&user).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "user not found"})
	}

	// Check if node record already exists
	var existing models.NodeRecord
	if err := database.DB.Where("node_name = ?", body.NodeName).First(&existing).Error; err != nil {
		// Create new node record
		nodeRecord := models.NodeRecord{
			NodeName:      body.NodeName,
			UserID:        user.ID,
			HeadscaleUser: body.HeadscaleUser,
			RegisteredAt:  time.Now(),
		}
		database.DB.Create(&nodeRecord)
	}

	return c.JSON(fiber.Map{"success": true})
}
