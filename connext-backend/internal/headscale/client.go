package headscale

import (
	"bytes"
	"fmt"
	"os"
	"os/exec"
)

func NewPreauth() (string, error) {
	cmd := exec.Command("docker", "exec", "headscale", "headscale", "preauthkeys", "create", "--user", "1", "--reusable")
	out, err := cmd.Output()
	if err != nil {
		return "", err
	}
	return string(bytes.TrimSpace(out)), nil
}
