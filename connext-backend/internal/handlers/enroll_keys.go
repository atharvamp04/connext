package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"time"

	"connext-backend/internal/database"
	"connext-backend/internal/models"

	"github.com/gofiber/fiber/v2"
)

func randomKey() string {
	b := make([]byte, 16)
	rand.Read(b)
	return hex.EncodeToString(b)
}

func CreateEnrollKey(c *fiber.Ctx) error {
	var body struct {
		Reusable bool `json:"reusable"`
		Hours    int  `json:"hours"`
	}

	if err := c.BodyParser(&body); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	expiry := time.Now().Add(24 * time.Hour)
	if body.Hours > 0 {
		expiry = time.Now().Add(time.Duration(body.Hours) * time.Hour)
	}

	key := models.EnrollmentKey{
		Key:       randomKey(),
		Reusable:  body.Reusable,
		ExpiresAt: expiry,
		CreatedAt: time.Now(),
		CreatedBy: c.Locals("user").(models.User).ID,
	}

	if err := database.DB.Create(&key).Error; err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	// 🔥 Return clean JSON always
	return c.JSON(fiber.Map{
		"id":          key.ID,
		"key":         key.Key,
		"reusable":    key.Reusable,
		"expires_at":  key.ExpiresAt,
		"usage_count": key.UsageCount,
	})
}

func ListEnrollKeys(c *fiber.Ctx) error {
	var keys []models.EnrollmentKey
	database.DB.Order("created_at desc").Find(&keys)
	return c.JSON(fiber.Map{"keys": keys})
}

func DeleteEnrollKey(c *fiber.Ctx) error {
	id := c.Params("id")
	database.DB.Delete(&models.EnrollmentKey{}, id)
	return c.JSON(fiber.Map{"deleted": id})
}
