package handlers

import "github.com/gofiber/fiber/v2"

func PunchListener(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{"ok": true})
}

func PunchReportHandler(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{"ok": true})
}
