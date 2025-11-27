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
	// Load env
	godotenv.Load()

	// Connect DB
	database.Connect()

	// Auto-migrate new models for node and key tracking
	database.DB.AutoMigrate(
		&models.User{},
		&models.Invitation{},
		&models.NodeRecord{},       // NEW: Track node ownership
		&models.PreAuthKeyRecord{}, // NEW: Track key ownership
	)

	app := fiber.New(fiber.Config{
		AppName: "Connext Backend",
	})

	// Global Middleware
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PUT, DELETE, OPTIONS",
	}))

	// Public Routes
	api := app.Group("/api")

	// Auth
	api.Post("/auth/register", handlers.Register)
	api.Post("/auth/login", handlers.Login)

	// Public invitation routes (for viewing/accepting invites)
	api.Get("/invitations/:token", handlers.GetInvitationByToken)

	// Webhooks (optional - for advanced node tracking)
	api.Post("/webhooks/node-registered", handlers.NodeRegistrationWebhook)

	// Protected Routes (Require authentication)
	protected := api.Group("/", middleware.Protected())

	// Current user info
	protected.Get("/auth/me", handlers.Me)

	// User Management
	protected.Get("/users", handlers.ListUsers)
	protected.Post("/users", handlers.CreateUser)
	protected.Put("/users/:id", handlers.UpdateUser)
	protected.Delete("/users/:id", handlers.DeleteUser)

	// Invitation Management
	protected.Post("/invitations", handlers.CreateInvitation)
	protected.Get("/invitations", handlers.ListInvitations)
	protected.Post("/invitations/:token/accept", handlers.AcceptInvitation)
	protected.Delete("/invitations/:id", handlers.CancelInvitation)

	// Headscale Routes
	protected.Get("/headscale/nodes", handlers.ListNodes)
	protected.Delete("/headscale/nodes/:id", handlers.DeleteNode)
	protected.Get("/headscale/keys", handlers.ListKeys)
	protected.Post("/headscale/keys", handlers.CreateKey)
	protected.Delete("/headscale/keys/:id", handlers.DeleteKey)

	// DNS Configuration Routes
	protected.Get("/dns/config", handlers.GetDNSConfig)
	protected.Post("/dns/config", handlers.SetDNSConfig)

	// Port
	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}

	// Startup logs
	log.Println("========================================")
	log.Println("🚀 Connext Backend Starting...")
	log.Println("========================================")
	log.Println("📧 SMTP Configuration:")
	log.Println("   Host:", os.Getenv("SMTP_HOST"))
	log.Println("   User:", os.Getenv("SMTP_USER"))
	log.Println("   Port:", os.Getenv("SMTP_PORT"))
	log.Println("🗄️  Database: Connected")
	log.Println("🔐 Authentication: Enabled")
	log.Println("🌐 CORS: Enabled (* - All Origins)")
	log.Println("📊 Server Port:", port)
	log.Println("========================================")
	log.Printf("✅ Server is ready and listening on http://localhost:%s\n", port)
	log.Println("========================================")

	app.Listen(":" + port)
}
