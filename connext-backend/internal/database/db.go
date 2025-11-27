// internal/database/database.go
package database

import (
	"fmt"
	"log"
	"os"

	"connext-backend/internal/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func Connect() {
	// Get environment variables with validation
	host := os.Getenv("DB_HOST")
	if host == "" {
		host = "localhost"
		log.Println("⚠️  DB_HOST not set, using default: localhost")
	}

	port := os.Getenv("DB_PORT")
	if port == "" {
		port = "5432"
		log.Println("⚠️  DB_PORT not set, using default: 5432")
	}

	user := os.Getenv("DB_USER")
	if user == "" {
		log.Fatal("❌ DB_USER environment variable is required")
	}

	password := os.Getenv("DB_PASSWORD")
	if password == "" {
		log.Fatal("❌ DB_PASSWORD environment variable is required")
	}

	dbname := os.Getenv("DB_NAME")
	if dbname == "" {
		log.Fatal("❌ DB_NAME environment variable is required")
	}

	// Build connection string
	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		host, port, user, password, dbname,
	)

	// Log connection attempt (without password)
	log.Printf("🔌 Connecting to database: host=%s port=%s user=%s dbname=%s", host, port, user, dbname)

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		log.Fatal("❌ Failed to connect to database:", err)
	}

	log.Println("✅ Database connected successfully")

	// Run migrations
	if err := runMigrations(); err != nil {
		log.Fatal("❌ Failed to run migrations:", err)
	}
}

func runMigrations() error {
	log.Println("🔄 Running database migrations...")

	// AutoMigrate will create tables if they don't exist
	err := DB.AutoMigrate(
		&models.User{},
		&models.Invitation{},
		&models.NodeRecord{},
		&models.PreAuthKeyRecord{},
	)

	if err != nil {
		log.Printf("❌ Migration error: %v", err)
		return err
	}

	log.Println("✅ Migrations completed successfully")

	// Verify tables exist
	if DB.Migrator().HasTable(&models.User{}) {
		log.Println("   ✓ users table exists")
	}
	if DB.Migrator().HasTable(&models.Invitation{}) {
		log.Println("   ✓ invitations table exists")
	}

	return nil
}
