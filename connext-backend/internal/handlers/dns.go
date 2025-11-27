package handlers

import (
	"os"
	"os/exec"
	"strings"

	"github.com/gofiber/fiber/v2"
)

type DNSConfig struct {
	BaseDomain      string   `json:"baseDomain"`
	Nameservers     []string `json:"nameservers"`
	MagicDNSEnabled bool     `json:"magicDNSEnabled"`
}

type HeadscaleConfig struct {
	DNSConfig struct {
		BaseDomain       string   `json:"base_domain"`
		MagicDNS         bool     `json:"magic_dns"`
		Nameservers      []string `json:"nameservers"`
		OverrideLocalDNS bool     `json:"override_local_dns"`
	} `json:"dns_config"`
}

// GetDNSConfig - retrieve current DNS configuration
func GetDNSConfig(c *fiber.Ctx) error {
	container := os.Getenv("HEADSCALE_CONTAINER_NAME")
	if container == "" {
		container = "headscale"
	}

	// Try to read the config file from the container
	cmd := exec.Command("docker", "exec", container,
		"cat", "/etc/headscale/config.yaml",
	)
	out, err := cmd.CombinedOutput()
	if err != nil {
		// Return default configuration if we can't read the file
		return c.JSON(DNSConfig{
			BaseDomain:      "headscale.local",
			Nameservers:     []string{"1.1.1.1", "8.8.8.8"},
			MagicDNSEnabled: false,
		})
	}

	// Parse the YAML config (basic parsing for DNS section)
	config := string(out)
	dnsConfig := DNSConfig{
		BaseDomain:      "headscale.local",
		Nameservers:     []string{"1.1.1.1", "8.8.8.8"},
		MagicDNSEnabled: false,
	}

	// Extract base_domain
	if strings.Contains(config, "base_domain:") {
		lines := strings.Split(config, "\n")
		for _, line := range lines {
			if strings.Contains(line, "base_domain:") {
				parts := strings.SplitN(line, ":", 2)
				if len(parts) == 2 {
					dnsConfig.BaseDomain = strings.TrimSpace(parts[1])
				}
			}
		}
	}

	// Extract magic_dns
	if strings.Contains(config, "magic_dns: true") {
		dnsConfig.MagicDNSEnabled = true
	}

	// Extract nameservers (simplified - assumes they're on one line or simple format)
	if strings.Contains(config, "nameservers:") {
		lines := strings.Split(config, "\n")
		inNameservers := false
		nameservers := []string{}
		for _, line := range lines {
			trimmed := strings.TrimSpace(line)
			if strings.HasPrefix(trimmed, "nameservers:") {
				inNameservers = true
				continue
			}
			if inNameservers {
				if strings.HasPrefix(trimmed, "-") {
					ns := strings.TrimPrefix(trimmed, "-")
					ns = strings.TrimSpace(ns)
					if ns != "" {
						nameservers = append(nameservers, ns)
					}
				} else if !strings.HasPrefix(trimmed, " ") && trimmed != "" {
					// End of nameservers section
					break
				}
			}
		}
		if len(nameservers) > 0 {
			dnsConfig.Nameservers = nameservers
		}
	}

	return c.JSON(dnsConfig)
}

// SetDNSConfig - update DNS configuration
func SetDNSConfig(c *fiber.Ctx) error {
	var config DNSConfig
	if err := c.BodyParser(&config); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	container := os.Getenv("HEADSCALE_CONTAINER_NAME")
	if container == "" {
		container = "headscale"
	}

	// Read current config with shell wrapper for Windows compatibility
	configPath := "/etc/headscale/config.yaml"

	readCmd := exec.Command("docker", "exec", container, "sh", "-c", "cat "+configPath)
	currentConfig, err := readCmd.CombinedOutput()
	if err != nil {
		// Try without shell wrapper
		readCmd = exec.Command("docker", "exec", container, "cat", configPath)
		currentConfig, err = readCmd.CombinedOutput()
		if err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error":     "Failed to read current configuration",
				"detail":    string(currentConfig),
				"path":      configPath,
				"container": container,
			})
		}
	}

	// Modify the DNS section
	configStr := string(currentConfig)
	lines := strings.Split(configStr, "\n")
	var newLines []string
	inDNSSection := false
	dnsConfigWritten := false

	for i, line := range lines {
		trimmed := strings.TrimSpace(line)

		// Detect DNS config section
		if strings.HasPrefix(trimmed, "dns_config:") || strings.HasPrefix(trimmed, "dns:") {
			inDNSSection = true
			newLines = append(newLines, line)

			// Write our DNS configuration
			indent := strings.Repeat(" ", len(line)-len(strings.TrimLeft(line, " "))+2)
			newLines = append(newLines, indent+"magic_dns: "+formatBool(config.MagicDNSEnabled))
			newLines = append(newLines, indent+"base_domain: "+config.BaseDomain)
			newLines = append(newLines, indent+"nameservers:")
			for _, ns := range config.Nameservers {
				newLines = append(newLines, indent+"  - "+ns)
			}
			dnsConfigWritten = true
			continue
		}

		// Skip old DNS config lines
		if inDNSSection {
			if i+1 < len(lines) {
				nextTrimmed := strings.TrimSpace(lines[i+1])
				// Check if next line is a new top-level section
				if !strings.HasPrefix(lines[i+1], " ") && !strings.HasPrefix(lines[i+1], "\t") && nextTrimmed != "" {
					inDNSSection = false
				} else {
					continue // Skip this line as it's part of old DNS config
				}
			}
		}

		newLines = append(newLines, line)
	}

	// If DNS section wasn't found, append it
	if !dnsConfigWritten {
		newLines = append(newLines, "dns_config:")
		newLines = append(newLines, "  magic_dns: "+formatBool(config.MagicDNSEnabled))
		newLines = append(newLines, "  base_domain: "+config.BaseDomain)
		newLines = append(newLines, "  nameservers:")
		for _, ns := range config.Nameservers {
			newLines = append(newLines, "    - "+ns)
		}
	}

	newConfig := strings.Join(newLines, "\n")

	// Write the new config back to the container
	writeCmd := exec.Command("docker", "exec", "-i", container, "sh", "-c", "cat > "+configPath)
	writeCmd.Stdin = strings.NewReader(newConfig)
	output, err := writeCmd.CombinedOutput()
	if err != nil {
		// Try with tee as fallback
		writeCmd = exec.Command("docker", "exec", "-i", container, "tee", configPath)
		writeCmd.Stdin = strings.NewReader(newConfig)
		output, err = writeCmd.CombinedOutput()
		if err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error":  "Failed to write configuration",
				"detail": string(output),
			})
		}
	}

	// Restart headscale to apply changes
	restartCmd := exec.Command("docker", "restart", container)
	if output, err := restartCmd.CombinedOutput(); err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error":  "Failed to restart headscale",
			"detail": string(output),
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "DNS configuration updated successfully",
	})
}

func formatBool(b bool) string {
	if b {
		return "true"
	}
	return "false"
}
