package handlers

import (
	"connext-backend/internal/models"
	"fmt"
)

// Generates WG config returned to daemon
func BuildWGConfig(d models.ConnexrDevice) string {
	return fmt.Sprintf(`
[Interface]
PrivateKey = <set-by-daemon>
Address = %s/32

[Peer]
PublicKey = %s
AllowedIPs = 100.64.0.0/10
Endpoint = your-derp-server.com:443
PersistentKeepalive = 25
`, d.IP, "controller-public-key-here")
}
