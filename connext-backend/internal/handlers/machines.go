package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"os"
	"time"

	"connext-backend/internal/database"
	"connext-backend/internal/ipallocator"
	"connext-backend/internal/models"

	"github.com/gofiber/fiber/v2"
)

func randToken(n int) string {
	b := make([]byte, n)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

func strPtr(s string) *string {
	return &s
}

// -----------------------------
// POST /api/machines/register/start
// Now accepts device info upfront
// -----------------------------
func RegisterMachineStart(c *fiber.Ctx) error {
	var body struct {
		Hostname   string `json:"hostname"`
		OS         string `json:"os"`
		MachineKey string `json:"machine_key"`
		PublicKey  string `json:"public_key"`
	}

	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request body"})
	}

	// Generate approval token
	token := randToken(12)

	pm := models.PendingMachine{
		ApproveToken: token,
		Hostname:     strPtr(body.Hostname),
		OS:           strPtr(body.OS),
		MachineKey:   strPtr(body.MachineKey),
		PublicKey:    strPtr(body.PublicKey),
		CreatedAt:    time.Now(),
		Approved:     false,
	}

	if err := database.DB.Create(&pm).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error":  "failed to create pending machine",
			"detail": err.Error(),
		})
	}

	frontend := os.Getenv("FRONTEND_URL")
	if frontend == "" {
		frontend = "http://localhost:3000"
	}

	authURL := fmt.Sprintf("%s/approve-device?token=%s", frontend, token)

	return c.JSON(fiber.Map{
		"token":    token,
		"auth_url": authURL,
	})
}

// -----------------------------
// GET /api/machines/register/status?machine_key=xxx
// Daemon polls this endpoint
// -----------------------------
func RegisterMachineStatus(c *fiber.Ctx) error {
	machineKey := c.Query("machine_key") // ✅ Changed from "token"
	if machineKey == "" {
		return c.Status(400).JSON(fiber.Map{"error": "missing machine_key"})
	}

	var pm models.PendingMachine
	if err := database.DB.Where("machine_key = ?", machineKey).First(&pm).Error; err != nil {
		// Return success=false so daemon keeps polling (don't return 404)
		return c.JSON(fiber.Map{"success": false})
	}

	if !pm.Approved {
		return c.JSON(fiber.Map{"success": false})
	}

	// Device was approved - return credentials in daemon's expected format
	return c.JSON(fiber.Map{
		"success":          true,
		"node_id":          *pm.NodeID,
		"ip_address":       *pm.IPAddress,
		"wireguard_config": *pm.WireguardCfg,
		"dns_servers":      []string{"1.1.1.1"}, // Add default DNS
	})
}

// -----------------------------
// POST /api/machines/approve/:token
// Simplified - info already in DB
// -----------------------------
func ApproveMachine(c *fiber.Ctx) error {
	token := c.Params("token")
	if token == "" {
		return c.Status(400).JSON(fiber.Map{"error": "missing token"})
	}

	// Lookup pending machine
	var pm models.PendingMachine
	if err := database.DB.Where("approve_token = ?", token).First(&pm).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "pending machine not found"})
	}

	if pm.MachineKey == nil || pm.PublicKey == nil {
		return c.Status(400).JSON(fiber.Map{"error": "incomplete device info"})
	}

	// Allocate VPN IP
	ip := ipallocator.AllocateIP(pm.ID)
	nodeID := fmt.Sprintf("node-%d", pm.ID)

	// Build WireGuard config
	wgConf := BuildWGConfig(models.ConnexrDevice{
		PubKey: *pm.PublicKey,
		IP:     ip,
	})

	// Create active device entry
	device := models.ConnexrDevice{
		PubKey:   *pm.PublicKey,
		Name:     *pm.Hostname,
		IP:       ip,
		Status:   "active",
		Region:   "unknown",
		LastSeen: time.Now(),
		Token:    randToken(16),
	}

	if err := database.DB.Create(&device).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error":  "failed to create device entry",
			"detail": err.Error(),
		})
	}

	// Get approver user
	user := c.Locals("user").(models.User)

	// Update pending entry
	pm.Approved = true
	pm.ApprovedAt = time.Now()
	pm.ApprovedBy = user.ID
	pm.NodeID = strPtr(nodeID)
	pm.IPAddress = strPtr(ip)
	pm.WireguardCfg = strPtr(wgConf)

	database.DB.Save(&pm)

	return c.JSON(fiber.Map{
		"ok":               true,
		"node_id":          nodeID,
		"ip_address":       ip,
		"wireguard_config": wgConf,
	})
}
