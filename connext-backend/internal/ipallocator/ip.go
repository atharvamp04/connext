package ipallocator

import "fmt"

// Allocates IPs like headscale/tailscale
// 100.64.0.1 → 100.64.255.255
func AllocateIP(id uint) string {
	o3 := id / 255
	o4 := id % 255
	return fmt.Sprintf("100.64.%d.%d", o3, o4+1)
}
