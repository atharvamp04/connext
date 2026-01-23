package handlers

import (
	"fmt"
	"net"
)

// Simple IP allocator — **replace** with your real allocator
// This is only a demonstrator: it picks next free IP in 100.64.0.0/10 (naive)
var nextIPOctet = 1

func allocateNextIP() string {
	// WARNING: naive incrementer for testing only
	ip := fmt.Sprintf("100.64.0.%d/32", nextIPOctet)
	nextIPOctet++
	if nextIPOctet > 250 {
		nextIPOctet = 2
	}
	return ip
}

func generateWireguardConfig(publicKey, nodeID, ip string) string {
	// Minimal single-peer config — replace with your templating/headscale integration
	privatePlaceholder := "PRIVATE_KEY_REPLACE_ME"
	return fmt.Sprintf("[Interface]\nPrivateKey = %s\nAddress = %s\n\n[Peer]\nPublicKey = %s\nAllowedIPs = 100.64.0.0/10\nPersistentKeepalive = 25\n", privatePlaceholder, ip, publicKey)
}

// validate ip string helper
func validIP(ip string) bool {
	_, _, err := net.ParseCIDR(ip)
	return err == nil
}
