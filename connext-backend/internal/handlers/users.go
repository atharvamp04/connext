package handlers

import (
	"strings"
	"time"

	"connext-backend/internal/database"
	"connext-backend/internal/models"

	"github.com/gofiber/fiber/v2"
	"golang.org/x/crypto/bcrypt"
)

// --------------------- LIST USERS ---------------------

func ListUsers(c *fiber.Ctx) error {
	currentUser := c.Locals("user").(models.User)

	var users []models.User
	if err := database.DB.
		Where("created_by = ? OR id = ?", currentUser.ID, currentUser.ID).
		Find(&users).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to fetch users"})
	}

	type SafeUser struct {
		ID        uint   `json:"id"`
		FirstName string `json:"first_name"`
		LastName  string `json:"last_name"`
		Email     string `json:"email"`
		CreatedAt string `json:"created_at"`
	}

	response := make([]SafeUser, len(users))
	for i, u := range users {
		response[i] = SafeUser{
			ID:        u.ID,
			FirstName: u.FirstName,
			LastName:  u.LastName,
			Email:     u.Email,
			CreatedAt: u.CreatedAt.Format(time.RFC3339),
		}
	}

	return c.JSON(fiber.Map{"users": response})
}

// --------------------- CREATE USER (REGISTER) ---------------------

func CreateUser(c *fiber.Ctx) error {
	currentUser := c.Locals("user").(models.User)

	var body struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request body"})
	}

	if body.Name == "" || body.Email == "" || body.Password == "" {
		return c.Status(400).JSON(fiber.Map{
			"error": "name, email and password are required",
		})
	}

	// Split name into first & last
	parts := strings.Fields(strings.TrimSpace(body.Name))
	firstName := parts[0]
	lastName := ""
	if len(parts) > 1 {
		lastName = strings.Join(parts[1:], " ")
	}

	email := strings.ToLower(strings.TrimSpace(body.Email))

	// Check existing email
	var exists models.User
	if err := database.DB.Where("email = ?", email).First(&exists).Error; err == nil {
		return c.Status(409).JSON(fiber.Map{"error": "email already exists"})
	}

	// Hash password
	hashed, err := bcrypt.GenerateFromPassword([]byte(body.Password), 14)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to hash password"})
	}

	user := models.User{
		FirstName: firstName,
		LastName:  lastName,
		Email:     email,
		Password:  string(hashed),
		CreatedBy: currentUser.ID,
	}

	if err := database.DB.Create(&user).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to create user"})
	}

	return c.Status(201).JSON(fiber.Map{
		"message": "user created successfully",
		"user": fiber.Map{
			"id":         user.ID,
			"first_name": user.FirstName,
			"last_name":  user.LastName,
			"email":      user.Email,
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

	if user.CreatedBy != currentUser.ID {
		return c.Status(403).JSON(fiber.Map{
			"error": "you can only delete users you created",
		})
	}

	if err := database.DB.Delete(&user).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to delete user"})
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
		return c.Status(400).JSON(fiber.Map{"error": "invalid request body"})
	}

	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "user not found"})
	}

	if body.Name != "" {
		parts := strings.Fields(strings.TrimSpace(body.Name))
		user.FirstName = parts[0]
		if len(parts) > 1 {
			user.LastName = strings.Join(parts[1:], " ")
		} else {
			user.LastName = ""
		}
	}

	if body.Email != "" {
		email := strings.ToLower(strings.TrimSpace(body.Email))

		var exists models.User
		if err := database.DB.
			Where("email = ? AND id != ?", email, user.ID).
			First(&exists).Error; err == nil {
			return c.Status(409).JSON(fiber.Map{"error": "email already in use"})
		}

		user.Email = email
	}

	if err := database.DB.Save(&user).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to update user"})
	}

	return c.JSON(fiber.Map{
		"message": "user updated successfully",
		"user": fiber.Map{
			"id":         user.ID,
			"first_name": user.FirstName,
			"last_name":  user.LastName,
			"email":      user.Email,
		},
	})
}
