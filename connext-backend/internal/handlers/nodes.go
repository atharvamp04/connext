package handlers

import (
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"strconv"
	"time"

	"connext-backend/internal/database"
	"connext-backend/internal/models"

	"github.com/gofiber/fiber/v2"
)

type HsNode struct {
	ID        uint          `json:"id"`
	Hostname  string        `json:"hostname"`
	Name      string        `json:"name"`
	GivenName string        `json:"given_name"`
	IPs       []string      `json:"ip_addresses"`
	Online    bool          `json:"online"`
	LastSeen  *LastSeenTime `json:"last_seen,omitempty"`
	User      *NodeUser     `json:"user,omitempty"`
}

type LastSeenTime struct {
	Seconds int64 `json:"seconds"`
}

type NodeUser struct {
	Name string `json:"name"`
}

type HeadscaleNodeDetail struct {
	ID          uint     `json:"id"`
	Name        string   `json:"name"`
	GivenName   string   `json:"givenName"`
	Online      bool     `json:"online"`
	LastSeen    string   `json:"lastSeen"`
	IPAddresses []string `json:"ipAddresses"`
	User        struct {
		Name string `json:"name"`
	} `json:"user"`
}

func ListNodes(c *fiber.Ctx) error {
	currentUser := c.Locals("user").(models.User)

	// Get effective Headscale user (creator's if invited, own if not)
	hsUser := currentUser.HeadscaleUser
	if currentUser.CreatedBy != 0 {
		var creator models.User
		if err := database.DB.First(&creator, currentUser.CreatedBy).Error; err == nil {
			hsUser = creator.HeadscaleUser
		}
	}

	container := os.Getenv("HEADSCALE_CONTAINER_NAME")
	if container == "" {
		container = "headscale"
	}

	// Get list of nodes first
	cmd := exec.Command("docker", "exec", container,
		"headscale", "nodes", "list",
		"--user", hsUser, "--output", "json",
	)
	out, err := cmd.CombinedOutput()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error":  "failed to list nodes",
			"detail": string(out),
		})
	}

	// DEBUG: Print raw list output
	fmt.Println("=== NODES LIST OUTPUT ===")
	fmt.Println(string(out))
	fmt.Println("=========================")

	var nodesList []HsNode
	if err := json.Unmarshal(out, &nodesList); err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error":  "failed to parse nodes list",
			"detail": err.Error(),
		})
	}

	// For each node, get detailed status
	var enrichedNodes []HsNode
	for _, node := range nodesList {
		statusCmd := exec.Command("docker", "exec", container,
			"headscale", "nodes", "get", node.Name, "--output", "json",
		)
		statusOut, err := statusCmd.CombinedOutput()

		// DEBUG: Print raw get output for each node
		fmt.Printf("=== NODE GET OUTPUT for %s ===\n", node.Name)
		fmt.Println(string(statusOut))
		fmt.Println("===============================")

		if err == nil {
			var detail HeadscaleNodeDetail
			if json.Unmarshal(statusOut, &detail) == nil {
				node.Online = detail.Online
				node.GivenName = detail.GivenName

				// Parse LastSeen
				if detail.LastSeen != "" {
					if t, err := time.Parse(time.RFC3339, detail.LastSeen); err == nil {
						node.LastSeen = &LastSeenTime{Seconds: t.Unix()}
					}
				}

				if detail.User.Name != "" {
					node.User = &NodeUser{Name: detail.User.Name}
				}

				// DEBUG: Print parsed values
				fmt.Printf("Parsed: Online=%v, GivenName=%s\n", detail.Online, detail.GivenName)
			} else {
				fmt.Printf("Failed to unmarshal detail: %v\n", err)
			}
		} else {
			fmt.Printf("Failed to get node detail: %v\n", err)
		}

		enrichedNodes = append(enrichedNodes, node)
	}

	// Add owner information
	response := fiber.Map{
		"nodes": enrichedNodes,
		"owner": fiber.Map{
			"name":           currentUser.Name,
			"email":          currentUser.Email,
			"is_owner":       currentUser.CreatedBy == 0,
			"headscale_user": hsUser,
		},
	}

	return c.JSON(response)
}

func DeleteNode(c *fiber.Ctx) error {
	nodeID := c.Params("id")
	if nodeID == "" {
		return c.Status(400).JSON(fiber.Map{"error": "node ID is required"})
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

	container := os.Getenv("HEADSCALE_CONTAINER_NAME")
	if container == "" {
		container = "headscale"
	}

	// First, get the list of nodes to find the node name by ID
	listCmd := exec.Command("docker", "exec", container,
		"headscale", "nodes", "list",
		"--user", hsUser, "--output", "json",
	)
	listOut, err := listCmd.CombinedOutput()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error":  "failed to list nodes",
			"detail": string(listOut),
		})
	}

	var nodes []map[string]interface{}
	if err := json.Unmarshal(listOut, &nodes); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to parse nodes"})
	}

	// Find the node name by ID
	var nodeName string
	nodeIDInt, _ := strconv.Atoi(nodeID)
	for _, n := range nodes {
		if id, ok := n["id"].(float64); ok && int(id) == nodeIDInt {
			if name, ok := n["name"].(string); ok {
				nodeName = name
				break
			}
		}
	}

	if nodeName == "" {
		return c.Status(404).JSON(fiber.Map{"error": "node not found"})
	}

	// Delete the node using headscale command
	cmd := exec.Command("docker", "exec", container,
		"headscale", "nodes", "delete",
		"--identifier", nodeName,
	)

	out, err := cmd.CombinedOutput()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error":  "failed to delete node",
			"detail": string(out),
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Node deleted successfully",
	})
}
