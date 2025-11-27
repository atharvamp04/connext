package handlers

import (
	"strconv"

	"connext-backend/internal/database"
	"connext-backend/internal/models"

	"github.com/gofiber/fiber/v2"

	"encoding/json"
	"fmt"
	"os"
	"os/exec"
)

// getHeadscaleUserID fetches the numeric ID for a headscale username
func getHeadscaleUserID(username string) (int, error) {
	container := os.Getenv("HEADSCALE_CONTAINER_NAME")
	if container == "" {
		container = "headscale"
	}

	cmd := exec.Command("docker", "exec", container,
		"headscale", "users", "list", "--output", "json",
	)

	out, err := cmd.CombinedOutput()
	if err != nil {
		return 0, fmt.Errorf("failed to list users: %s", string(out))
	}

	var users []struct {
		ID   int    `json:"id"`
		Name string `json:"name"`
	}

	if err := json.Unmarshal(out, &users); err != nil {
		return 0, fmt.Errorf("failed to parse users: %v", err)
	}

	for _, u := range users {
		if u.Name == username {
			return u.ID, nil
		}
	}

	return 0, fmt.Errorf("user %s not found", username)
}

func CreateKey(c *fiber.Ctx) error {
	currentUser := c.Locals("user").(models.User)

	// Parse request body
	type CreateKeyRequest struct {
		Reusable   bool   `json:"reusable"`
		Ephemeral  bool   `json:"ephemeral"`
		Expiration string `json:"expiration"`
	}

	var req CreateKeyRequest
	// Don't fail if body is empty - just use defaults
	_ = c.BodyParser(&req)

	// Default values if not provided
	if req.Expiration == "" {
		req.Expiration = "24h"
	}

	// Get effective Headscale user (creator's if invited, own if not)
	hsUser := currentUser.HeadscaleUser
	if currentUser.CreatedBy != 0 {
		var creator models.User
		if err := database.DB.First(&creator, currentUser.CreatedBy).Error; err == nil {
			hsUser = creator.HeadscaleUser
		}
	}

	userID, err := getHeadscaleUserID(hsUser)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "cannot fetch user ID", "detail": err.Error()})
	}

	container := os.Getenv("HEADSCALE_CONTAINER_NAME")
	if container == "" {
		container = "headscale"
	}

	// Build command with dynamic flags
	args := []string{"exec", container, "headscale", "preauthkeys", "create",
		"--user", strconv.Itoa(userID),
		"--expiration", req.Expiration,
		"--output", "json",
	}

	// Add flags based on request
	if req.Reusable {
		args = append(args, "--reusable")
	}

	if req.Ephemeral {
		args = append(args, "--ephemeral")
	}

	cmd := exec.Command("docker", args...)

	out, err := cmd.CombinedOutput()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to create key", "detail": string(out)})
	}

	// Parse the JSON output instead of returning raw string
	var keyData map[string]interface{}
	if err := json.Unmarshal(out, &keyData); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to parse key response", "detail": string(out)})
	}

	return c.JSON(keyData)
}

// ListKeys - fetch preauth keys from Headscale
func ListKeys(c *fiber.Ctx) error {
	currentUser := c.Locals("user").(models.User)

	// Get effective Headscale user (creator's if invited, own if not)
	hsUser := currentUser.HeadscaleUser
	if currentUser.CreatedBy != 0 {
		var creator models.User
		if err := database.DB.First(&creator, currentUser.CreatedBy).Error; err == nil {
			hsUser = creator.HeadscaleUser
		}
	}

	userID, err := getHeadscaleUserID(hsUser)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "cannot fetch user ID", "detail": err.Error()})
	}

	container := os.Getenv("HEADSCALE_CONTAINER_NAME")
	if container == "" {
		container = "headscale"
	}

	cmd := exec.Command("docker", "exec", container,
		"headscale", "preauthkeys", "list",
		"--user", strconv.Itoa(userID),
		"--output", "json",
	)

	out, err := cmd.CombinedOutput()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to list keys", "detail": string(out)})
	}

	// Parse as array
	var keys []map[string]interface{}
	if err := json.Unmarshal(out, &keys); err != nil {
		// Handle null/empty response
		keys = []map[string]interface{}{}
	}

	// Add owner information (matching ListNodes structure)
	response := fiber.Map{
		"keys": keys,
		"owner": fiber.Map{
			"name":           currentUser.Name,
			"email":          currentUser.Email,
			"is_owner":       currentUser.CreatedBy == 0,
			"headscale_user": hsUser,
		},
	}

	return c.JSON(response)
}

// DeleteKey - delete a preauth key from Headscale
func DeleteKey(c *fiber.Ctx) error {
	keyID := c.Params("id")
	if keyID == "" {
		return c.Status(400).JSON(fiber.Map{"error": "key ID is required"})
	}

	currentUser := c.Locals("user").(models.User)

	// Get effective Headscale user (creator's if invited, own if not)
	hsUser := currentUser.HeadscaleUser
	if currentUser.CreatedBy != 0 {
		var creator models.User
		if err := database.DB.First(&creator, currentUser.CreatedBy).Error; err == nil {
			hsUser = creator.HeadscaleUser
		}
	}

	// Get headscale user ID
	userID, err := getHeadscaleUserID(hsUser)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "cannot fetch user ID", "detail": err.Error()})
	}

	container := os.Getenv("HEADSCALE_CONTAINER_NAME")
	if container == "" {
		container = "headscale"
	}

	// Get list of keys to find the actual key string
	listCmd := exec.Command("docker", "exec", container,
		"headscale", "preauthkeys", "list",
		"--user", strconv.Itoa(userID),
		"--output", "json",
	)
	listOut, err := listCmd.CombinedOutput()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error":  "failed to list keys",
			"detail": string(listOut),
		})
	}

	var keys []map[string]interface{}
	if err := json.Unmarshal(listOut, &keys); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to parse keys"})
	}

	// Find the key string by ID
	var keyString string
	keyIDInt, _ := strconv.Atoi(keyID)
	for _, k := range keys {
		if id, ok := k["id"].(float64); ok && int(id) == keyIDInt {
			if ks, ok := k["key"].(string); ok {
				keyString = ks
				break
			}
		}
	}

	if keyString == "" {
		return c.Status(404).JSON(fiber.Map{"error": "key not found"})
	}

	// Expire the key with --user flag
	cmd := exec.Command("docker", "exec", container,
		"headscale", "preauthkeys", "expire",
		"--user", strconv.Itoa(userID),
		keyString,
	)

	out, err := cmd.CombinedOutput()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error":  "failed to expire key",
			"detail": string(out),
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Key expired successfully",
	})
}
