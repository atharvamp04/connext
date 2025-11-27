package handlers

import (
	"os"
	"os/exec"
	"strings"
	"time"

	"connext-backend/internal/database"
	"connext-backend/internal/models"

	"github.com/gofiber/fiber/v2"
	"golang.org/x/crypto/bcrypt"
)

// --------------------- LIST USERS ---------------------

func ListUsers(c *fiber.Ctx) error {
	// Get current logged-in user
	currentUser := c.Locals("user").(models.User)

	// Get only users created by the current user
	var users []models.User
	if err := database.DB.Where("created_by = ? OR id = ?", currentUser.ID, currentUser.ID).Find(&users).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to fetch users"})
	}

	// Return users without passwords
	type SafeUser struct {
		ID            uint   `json:"id"`
		Name          string `json:"name"`
		Email         string `json:"email"`
		HeadscaleUser string `json:"headscale_user"`
		CreatedAt     string `json:"created_at"`
	}

	safeUsers := make([]SafeUser, len(users))
	for i, u := range users {
		safeUsers[i] = SafeUser{
			ID:            u.ID,
			Name:          u.Name,
			Email:         u.Email,
			HeadscaleUser: u.HeadscaleUser,
			CreatedAt:     u.CreatedAt.Format(time.RFC3339),
		}
	}

	return c.JSON(fiber.Map{"users": safeUsers})
}

// --------------------- CREATE USER (Admin creates for another user) ---------------------

func CreateUser(c *fiber.Ctx) error {
	// Get current logged-in user (the creator)
	currentUser := c.Locals("user").(models.User)

	var body struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid body"})
	}

	if body.Name == "" || body.Email == "" || body.Password == "" {
		return c.Status(400).JSON(fiber.Map{"error": "name, email, and password are required"})
	}

	email := strings.ToLower(strings.TrimSpace(body.Email))

	// Check if user exists
	var exists models.User
	if err := database.DB.Where("email = ?", email).First(&exists).Error; err == nil {
		return c.Status(409).JSON(fiber.Map{"error": "email already exists"})
	}

	// Hash password
	hashed, err := bcrypt.GenerateFromPassword([]byte(body.Password), 14)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to hash password"})
	}

	// Create Headscale username from email prefix
	split := strings.Split(email, "@")
	hsUser := split[0]
	hsUser = strings.NewReplacer(".", "_", "-", "_", "+", "_").Replace(hsUser)

	// Create user in Headscale
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

	// Store user in DB with CreatedBy field
	user := models.User{
		Name:          body.Name,
		Email:         email,
		Password:      string(hashed),
		HeadscaleUser: hsUser,
		CreatedBy:     currentUser.ID, // Link to creator
	}

	if err := database.DB.Create(&user).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed saving user"})
	}

	return c.Status(201).JSON(fiber.Map{
		"message": "user created successfully",
		"user": fiber.Map{
			"id":             user.ID,
			"name":           user.Name,
			"email":          user.Email,
			"headscale_user": user.HeadscaleUser,
		},
	})
}

// --------------------- DELETE USER ---------------------

func DeleteUser(c *fiber.Ctx) error {
	userID := c.Params("id")
	currentUser := c.Locals("user").(models.User)

	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "user not found"})
	}

	// Only allow deleting users you created
	if user.CreatedBy != currentUser.ID {
		return c.Status(403).JSON(fiber.Map{"error": "you can only delete users you created"})
	}

	// Delete from Headscale
	container := os.Getenv("HEADSCALE_CONTAINER_NAME")
	if container == "" {
		container = "headscale"
	}

	cmd := exec.Command("docker", "exec", container,
		"headscale", "users", "destroy", "--force", user.HeadscaleUser,
	)

	out, err := cmd.CombinedOutput()
	if err != nil && !strings.Contains(string(out), "not found") {
		return c.Status(500).JSON(fiber.Map{
			"error":  "failed to delete headscale user",
			"detail": string(out),
		})
	}

	// Delete from database
	if err := database.DB.Delete(&user).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to delete user from database"})
	}

	return c.JSON(fiber.Map{"message": "user deleted successfully"})
}

// --------------------- UPDATE USER ---------------------

func UpdateUser(c *fiber.Ctx) error {
	userID := c.Params("id")

	var body struct {
		Name  string `json:"name"`
		Email string `json:"email"`
	}

	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid body"})
	}

	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "user not found"})
	}

	// Update fields
	if body.Name != "" {
		user.Name = body.Name
	}
	if body.Email != "" {
		email := strings.ToLower(strings.TrimSpace(body.Email))
		// Check if new email is already taken
		var exists models.User
		if err := database.DB.Where("email = ? AND id != ?", email, user.ID).First(&exists).Error; err == nil {
			return c.Status(409).JSON(fiber.Map{"error": "email already exists"})
		}
		user.Email = email
	}

	if err := database.DB.Save(&user).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to update user"})
	}

	return c.JSON(fiber.Map{
		"message": "user updated successfully",
		"user": fiber.Map{
			"id":             user.ID,
			"name":           user.Name,
			"email":          user.Email,
			"headscale_user": user.HeadscaleUser,
		},
	})
}
