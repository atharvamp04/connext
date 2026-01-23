package main

import (
	"log"
	"os"

	"connext-backend/internal/database"
	"connext-backend/internal/handlers"
	"connext-backend/internal/middleware"
	"connext-backend/internal/models"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load()
	database.Connect()

	database.DB.AutoMigrate(
		&models.User{},
		&models.ConnexrDevice{},
		&models.EnrollmentKey{},
		&models.PendingMachine{},
	)

	app := fiber.New(fiber.Config{
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			code := fiber.StatusInternalServerError
			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
			}
			log.Printf("Error: %v", err)
			return c.Status(code).JSON(fiber.Map{
				"error": err.Error(),
			})
		},
	})

	app.Use(logger.New(logger.Config{
		Format: "[${time}] ${status} - ${method} ${path} (${latency})\n",
	}))

	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PUT, DELETE, OPTIONS",
	}))

	api := app.Group("/api")

	// ------------------------------------------------
	// PUBLIC ENDPOINTS (DAEMON MUST ACCESS THESE)
	// ------------------------------------------------

	api.Post("/auth/register", handlers.Register)
	api.Post("/auth/login", handlers.Login)

	api.Get("/auth/me", middleware.Protected(), func(c *fiber.Ctx) error {
		user := c.Locals("user").(models.User)
		return c.JSON(fiber.Map{
			"id":         user.ID,
			"first_name": user.FirstName,
			"last_name":  user.LastName,
			"email":      user.Email,
		})
	})

	// Daemon enrollment (public)
	api.Post("/machines/register/start", handlers.RegisterMachineStart)
	api.Get("/machines/register/status", handlers.RegisterMachineStatus)

	// Silent enrollment
	api.Post("/enroll", handlers.EnrollDevice)

	// Heartbeat (public!)
	api.Post("/machines/heartbeat", handlers.Heartbeat)

	// NAT punching (public!)
	api.Post("/punch", handlers.PunchListener)
	api.Post("/punch/report", handlers.PunchReportHandler)

	// Most important: peers endpoint MUST be public
	api.Get("/peers", handlers.ListPeers)

	// ------------------------------------------------
	// ADMIN PROTECTED ROUTES
	// ------------------------------------------------
	// 🔥 CHANGED: Remove the "/" prefix
	admin := api.Group("", middleware.Protected())

	admin.Get("/enroll-keys", handlers.ListEnrollKeys)
	admin.Post("/enroll-keys", handlers.CreateEnrollKey)
	admin.Delete("/enroll-keys/:id", handlers.DeleteEnrollKey)

	admin.Get("/devices", handlers.ListDevices)
	admin.Delete("/devices/:pubkey", handlers.DeleteDevice)

	admin.Get("/dns", handlers.GetDNSConfig)
	admin.Post("/dns", handlers.SetDNSConfig)

	// Approving pending machines (browser)
	admin.Post("/machines/approve/:token", handlers.ApproveMachine)
	admin.Get("/machines/pending/:token", handlers.GetPendingMachine)

	// Dashboard nodes (duplicate route, but keeping for compatibility)
	admin.Get("/nodes", handlers.ListDevices)

	// Users endpoint
	admin.Get("/users", handlers.ListUsers)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}

	log.Println("🚀 Connexr Control Plane listening on port", port)
	log.Println("📍 API endpoints available at http://localhost:" + port + "/api")
	app.Listen(":" + port)
}
