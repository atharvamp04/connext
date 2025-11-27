package handlers

import (
	"os"
	"os/exec"
	"strings"
	"time"

	"connext-backend/internal/database"
	"connext-backend/internal/models"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

// --------------------- Request Structs ---------------------

type registerRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// --------------------- REGISTER ---------------------

func Register(c *fiber.Ctx) error {
	var body registerRequest

	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid body"})
	}

	if body.Email == "" || body.Password == "" || body.Name == "" {
		return c.Status(400).JSON(fiber.Map{"error": "missing fields"})
	}

	email := strings.ToLower(strings.TrimSpace(body.Email))

	// ⛔ Check if user exists
	var exists models.User
	if err := database.DB.Where("email = ?", email).First(&exists).Error; err == nil {
		return c.Status(400).JSON(fiber.Map{"error": "email already exists"})
	}

	// 🔐 Hash password
	hashed, _ := bcrypt.GenerateFromPassword([]byte(body.Password), 14)

	// 🏷️ Create Headscale username from email prefix
	split := strings.Split(email, "@")
	hsUser := split[0]
	hsUser = strings.NewReplacer(".", "_", "-", "_", "+", "_").Replace(hsUser)

	// 🐳 Create user in Headscale
	container := os.Getenv("HEADSCALE_CONTAINER_NAME")
	if container == "" {
		container = "headscale"
	}

	cmd := exec.Command("docker", "exec", container, "headscale", "users", "create", hsUser)
	out, err := cmd.CombinedOutput()
	if err != nil && !strings.Contains(string(out), "already exists") {
		return c.Status(500).JSON(fiber.Map{
			"error":  "failed creating headscale user",
			"detail": string(out),
		})
	}

	// 💾 Store user in DB
	user := models.User{
		Name:          body.Name,
		Email:         email,
		Password:      string(hashed),
		HeadscaleUser: hsUser,
	}

	if err := database.DB.Create(&user).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed saving user"})
	}

	// 🎟️ Generate JWT Token
	tokenString, _ := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"id":    user.ID,
		"email": user.Email,
		"exp":   time.Now().Add(7 * 24 * time.Hour).Unix(), // 7 days
	}).SignedString([]byte(os.Getenv("JWT_SECRET")))

	return c.JSON(fiber.Map{
		"message": "registered",
		"user": fiber.Map{
			"id":             user.ID,
			"name":           user.Name,
			"email":          user.Email,
			"headscale_user": user.HeadscaleUser,
		},
		"token": tokenString,
	})
}

// --------------------- LOGIN ---------------------

func Login(c *fiber.Ctx) error {
	var body loginRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid body"})
	}

	email := strings.ToLower(body.Email)

	var user models.User
	if err := database.DB.Where("email = ?", email).First(&user).Error; err != nil {
		return c.Status(401).JSON(fiber.Map{"error": "invalid credentials"})
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(body.Password)); err != nil {
		return c.Status(401).JSON(fiber.Map{"error": "invalid credentials"})
	}

	token, _ := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"id":    user.ID,
		"email": user.Email,
		"exp":   time.Now().Add(24 * time.Hour).Unix(),
	}).SignedString([]byte(os.Getenv("JWT_SECRET")))

	return c.JSON(fiber.Map{"token": token})
}

// --------------------- ME ---------------------

func Me(c *fiber.Ctx) error {
	userAny := c.Locals("user")
	userModel, ok := userAny.(models.User)
	if !ok {
		return c.Status(500).JSON(fiber.Map{"error": "user context missing"})
	}

	return c.JSON(fiber.Map{
		"id":             userModel.ID,
		"name":           userModel.Name,
		"email":          userModel.Email,
		"headscale_user": userModel.HeadscaleUser,
	})
}
