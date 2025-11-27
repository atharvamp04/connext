package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"os"
	"strings"
	"sync"

	"connext-backend/internal/database"
	"connext-backend/internal/models"
	"connext-backend/internal/services"

	"github.com/gofiber/fiber/v2"
)

var emailService *services.EmailService
var emailServiceOnce sync.Once

func getEmailService() *services.EmailService {
	emailServiceOnce.Do(func() {
		emailService = services.NewEmailService()
	})
	return emailService
}

type invitationRequest struct {
	Name  string `json:"name"`
	Email string `json:"email"`
}

// CreateInvitation sends an invitation to a user
func CreateInvitation(c *fiber.Ctx) error {
	userAny := c.Locals("user")
	currentUser, ok := userAny.(models.User)
	if !ok {
		return c.Status(500).JSON(fiber.Map{"error": "user context missing"})
	}

	var body invitationRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid body"})
	}

	if body.Email == "" {
		return c.Status(400).JSON(fiber.Map{"error": "email is required"})
	}

	email := strings.ToLower(strings.TrimSpace(body.Email))

	if email == currentUser.Email {
		return c.Status(400).JSON(fiber.Map{"error": "cannot invite yourself"})
	}

	var existingUser models.User
	userExists := database.DB.Where("email = ? AND created_by = ?", email, currentUser.ID).First(&existingUser).Error == nil

	if userExists {
		return c.Status(400).JSON(fiber.Map{"error": "user already in your network"})
	}

	var pendingInvite models.Invitation
	hasPending := database.DB.Where("inviter_id = ? AND invitee_email = ? AND status = ?",
		currentUser.ID, email, "pending").First(&pendingInvite).Error == nil

	if hasPending {
		return c.Status(400).JSON(fiber.Map{"error": "invitation already sent to this email"})
	}

	tokenBytes := make([]byte, 32)
	if _, err := rand.Read(tokenBytes); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed generating token"})
	}
	token := hex.EncodeToString(tokenBytes)

	invitation := models.Invitation{
		InviterID:    currentUser.ID,
		InviteeEmail: email,
		InviteeName:  body.Name,
		Token:        token,
		Status:       "pending",
	}

	if err := database.DB.Create(&invitation).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed creating invitation"})
	}

	var inviteeUser models.User
	isNewUser := database.DB.Where("email = ?", email).First(&inviteeUser).Error != nil

	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:3000"
	}
	inviteLink := fmt.Sprintf("%s/invite/%s", frontendURL, token)

	emailData := services.InvitationEmailData{
		InviterName: currentUser.Name,
		InviteeName: body.Name,
		InviteLink:  inviteLink,
		IsNewUser:   isNewUser,
	}

	if err := getEmailService().SendInvitation(email, emailData); err != nil {
		fmt.Printf("Failed to send email: %v\n", err)
		return c.Status(200).JSON(fiber.Map{
			"message": "invitation created but email failed to send",
			"warning": "Please check SMTP configuration",
			"invitation": fiber.Map{
				"id":            invitation.ID,
				"invitee_email": invitation.InviteeEmail,
				"token":         invitation.Token,
				"status":        invitation.Status,
			},
		})
	}

	return c.Status(201).JSON(fiber.Map{
		"message": "invitation sent successfully",
		"invitation": fiber.Map{
			"id":            invitation.ID,
			"invitee_email": invitation.InviteeEmail,
			"invitee_name":  invitation.InviteeName,
			"token":         invitation.Token,
			"status":        invitation.Status,
			"created_at":    invitation.CreatedAt,
		},
	})
}

// ListInvitations returns all invitations created by the current user
func ListInvitations(c *fiber.Ctx) error {
	userAny := c.Locals("user")
	currentUser, ok := userAny.(models.User)
	if !ok {
		return c.Status(500).JSON(fiber.Map{"error": "user context missing"})
	}

	var invitations []models.Invitation
	if err := database.DB.Where("inviter_id = ?", currentUser.ID).
		Order("created_at DESC").
		Find(&invitations).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed fetching invitations"})
	}

	return c.JSON(fiber.Map{"invitations": invitations})
}

// GetInvitationByToken returns invitation details by token (public)
func GetInvitationByToken(c *fiber.Ctx) error {
	token := c.Params("token")

	var invitation models.Invitation
	if err := database.DB.Where("token = ?", token).First(&invitation).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "invitation not found"})
	}

	if invitation.Status != "pending" {
		return c.Status(400).JSON(fiber.Map{
			"error":  "invitation no longer valid",
			"status": invitation.Status,
		})
	}

	var inviter models.User
	database.DB.First(&inviter, invitation.InviterID)

	return c.JSON(fiber.Map{
		"invitation": fiber.Map{
			"id":            invitation.ID,
			"inviter_name":  inviter.Name,
			"inviter_email": inviter.Email,
			"invitee_email": invitation.InviteeEmail,
			"invitee_name":  invitation.InviteeName,
			"status":        invitation.Status,
			"created_at":    invitation.CreatedAt,
		},
	})
}

// AcceptInvitation allows a user to accept an invitation
func AcceptInvitation(c *fiber.Ctx) error {
	token := c.Params("token")

	var invitation models.Invitation
	if err := database.DB.Where("token = ?", token).First(&invitation).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "invitation not found"})
	}

	if invitation.Status != "pending" {
		return c.Status(400).JSON(fiber.Map{"error": "invitation already processed"})
	}

	userAny := c.Locals("user")
	currentUser, ok := userAny.(models.User)
	if !ok {
		return c.Status(401).JSON(fiber.Map{"error": "must be logged in to accept invitation"})
	}

	if strings.ToLower(currentUser.Email) != strings.ToLower(invitation.InviteeEmail) {
		return c.Status(403).JSON(fiber.Map{"error": "this invitation is for a different email address"})
	}

	if err := database.DB.Model(&currentUser).Update("created_by", invitation.InviterID).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed accepting invitation"})
	}

	invitation.Status = "accepted"
	acceptedByID := currentUser.ID
	invitation.AcceptedByID = &acceptedByID

	if err := database.DB.Save(&invitation).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed updating invitation"})
	}

	return c.JSON(fiber.Map{
		"message": "invitation accepted successfully",
		"user": fiber.Map{
			"id":             currentUser.ID,
			"name":           currentUser.Name,
			"email":          currentUser.Email,
			"headscale_user": currentUser.HeadscaleUser,
		},
	})
}

// CancelInvitation allows the inviter to cancel a pending invitation
func CancelInvitation(c *fiber.Ctx) error {
	userAny := c.Locals("user")
	currentUser, ok := userAny.(models.User)
	if !ok {
		return c.Status(500).JSON(fiber.Map{"error": "user context missing"})
	}

	invitationID := c.Params("id")

	var invitation models.Invitation
	if err := database.DB.First(&invitation, invitationID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "invitation not found"})
	}

	if invitation.InviterID != currentUser.ID {
		return c.Status(403).JSON(fiber.Map{"error": "not authorized"})
	}

	if invitation.Status != "pending" {
		return c.Status(400).JSON(fiber.Map{"error": "can only cancel pending invitations"})
	}

	invitation.Status = "cancelled"
	if err := database.DB.Save(&invitation).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed cancelling invitation"})
	}

	return c.JSON(fiber.Map{"message": "invitation cancelled"})
}
