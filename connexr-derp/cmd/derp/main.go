package main

import (
	"log"
	"os"

	"connexr-derp/internal/derpserver"
)

func main() {
	if len(os.Args) < 2 {
		log.Fatal("usage: derp <config.yaml>")
	}

	cfg, err := derpserver.LoadConfig(os.Args[1])
	if err != nil {
		log.Fatal("config load error:", err)
	}

	err = derpserver.Start(cfg)
	if err != nil {
		log.Fatal("server error:", err)
	}
}
