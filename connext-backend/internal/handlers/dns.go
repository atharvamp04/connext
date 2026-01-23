package handlers

import "github.com/gofiber/fiber/v2"

// In the future you may store DNS settings in DB
var dnsConfig = map[string]interface{}{
	"nameservers": []string{},
	"magic_dns":   false,
}

// GET /api/dns
func GetDNSConfig(c *fiber.Ctx) error {
	return c.JSON(dnsConfig)
}

// POST /api/dns
func SetDNSConfig(c *fiber.Ctx) error {
	var body map[string]interface{}

	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid dns config"})
	}

	for k, v := range body {
		dnsConfig[k] = v
	}

	return c.JSON(fiber.Map{
		"updated": true,
		"dns":     dnsConfig,
	})
}
