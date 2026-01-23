package middleware

import (
	"connext-backend/internal/database"
	"connext-backend/internal/models"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

func Protected() fiber.Handler {
	return func(c *fiber.Ctx) error {
		tokenHeader := c.Get("Authorization")

		if tokenHeader == "" {
			return c.Status(401).JSON(fiber.Map{"error": "missing token"})
		}

		tokenString := tokenHeader[7:] // remove "Bearer "

		token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
			return []byte(os.Getenv("JWT_SECRET")), nil
		})

		if err != nil || !token.Valid {
			return c.Status(401).JSON(fiber.Map{"error": "invalid token"})
		}

		claims := token.Claims.(jwt.MapClaims)
		userID := uint(claims["id"].(float64))

		var user models.User
		if err := database.DB.First(&user, userID).Error; err != nil {
			return c.Status(401).JSON(fiber.Map{"error": "user not found"})
		}

		c.Locals("user", user)
		return c.Next()
	}
}
