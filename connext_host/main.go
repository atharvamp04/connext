package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/gorilla/websocket"
)

const (
	Host = "localhost"
	Port = "8080"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for now (restrict in production)
	},
}

type HostServer struct {
	screenCapture *ScreenCaptureService
	inputHandler  *InputHandler
	fileService   *FileService
}

func NewHostServer() *HostServer {
	return &HostServer{
		screenCapture: NewScreenCaptureService(),
		inputHandler:  NewInputHandler(),
		fileService:   NewFileService(),
	}
}

func (h *HostServer) handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}
	defer conn.Close()

	log.Println("Client connected")

	for {
		messageType, message, err := conn.ReadMessage()
		if err != nil {
			log.Printf("Read error: %v", err)
			break
		}

		// Handle different message types
		var msg map[string]interface{}
		if err := json.Unmarshal(message, &msg); err != nil {
			log.Printf("JSON unmarshal error: %v", err)
			continue
		}

		msgType, ok := msg["type"].(string)
		if !ok {
			continue
		}

		switch msgType {
		case "start_capture":
			h.handleStartCapture(conn)
		case "stop_capture":
			h.handleStopCapture(conn)
		case "mouse_event":
			h.handleMouseEvent(msg)
		case "keyboard_event":
			h.handleKeyboardEvent(msg)
		case "file_request":
			h.handleFileRequest(conn, msg)
		default:
			log.Printf("Unknown message type: %s", msgType)
		}

		_ = messageType // Avoid unused variable warning
	}

	log.Println("Client disconnected")
}

func (h *HostServer) handleStartCapture(conn *websocket.Conn) {
	log.Println("Starting screen capture")
	if err := h.screenCapture.Start(conn); err != nil {
		log.Printf("Failed to start capture: %v", err)
		h.sendError(conn, "Failed to start capture")
	}
}

func (h *HostServer) handleStopCapture(conn *websocket.Conn) {
	log.Println("Stopping screen capture")
	h.screenCapture.Stop()
	h.sendMessage(conn, map[string]interface{}{
		"type":    "capture_stopped",
		"success": true,
	})
}

func (h *HostServer) handleMouseEvent(msg map[string]interface{}) {
	x, xOk := msg["x"].(float64)
	y, yOk := msg["y"].(float64)
	action, _ := msg["action"].(string)

	if !xOk || !yOk {
		log.Printf("Invalid mouse coordinates")
		return
	}

	if action == "move" {
		h.inputHandler.HandleMouseMove(int(x), int(y))
	} else if action == "click" || action == "down" || action == "up" {
		button, _ := msg["button"].(string)
		if button == "" {
			button = "left"
		}
		h.inputHandler.HandleMouseClick(button, action)
	} else if action == "scroll" {
		deltaX, _ := msg["deltaX"].(float64)
		deltaY, _ := msg["deltaY"].(float64)
		h.inputHandler.HandleMouseScroll(int(deltaX), int(deltaY))
	}
}

func (h *HostServer) handleKeyboardEvent(msg map[string]interface{}) {
	key, keyOk := msg["key"].(string)
	action, _ := msg["action"].(string)

	if !keyOk {
		log.Printf("Invalid keyboard event")
		return
	}

	if action == "type" {
		text, _ := msg["text"].(string)
		if text != "" {
			h.inputHandler.HandleKeyType(text)
		}
	} else {
		h.inputHandler.HandleKeyPress(key, action)
	}
}

func (h *HostServer) handleFileRequest(conn *websocket.Conn, msg map[string]interface{}) {
	// Will implement in next step
	log.Printf("File request: %v", msg)
}

func (h *HostServer) sendMessage(conn *websocket.Conn, msg map[string]interface{}) {
	data, _ := json.Marshal(msg)
	conn.WriteMessage(websocket.TextMessage, data)
}

func (h *HostServer) sendError(conn *websocket.Conn, errMsg string) {
	h.sendMessage(conn, map[string]interface{}{
		"type":  "error",
		"error": errMsg,
	})
}

// API Handlers
func (h *HostServer) handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":  "ok",
		"service": "connext_host",
		"version": "0.3.0",
	})
}

func (h *HostServer) handleScreenInfo(w http.ResponseWriter, r *http.Request) {
	info := h.screenCapture.GetScreenInfo()
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*") // For CORS
	json.NewEncoder(w).Encode(info)
}

// HTTP API Handlers for remote input (WebRTC)
func (h *HostServer) handleMouseInput(w http.ResponseWriter, r *http.Request) {
	// Enable CORS
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var input struct {
		Action string `json:"action"`
		X      int    `json:"x"`
		Y      int    `json:"y"`
		Button string `json:"button"`
		DeltaX int    `json:"deltaX"`
		DeltaY int    `json:"deltaY"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	switch input.Action {
	case "move":
		h.inputHandler.HandleMouseMove(input.X, input.Y)
		// log.Printf("🖱️  Mouse move: (%d, %d)", input.X, input.Y)
	case "down", "up", "click":
		h.inputHandler.HandleMouseClick(input.Button, input.Action)
		log.Printf("🖱️  Mouse %s: %s", input.Action, input.Button)
	case "scroll":
		h.inputHandler.HandleMouseScroll(input.DeltaX, input.DeltaY)
		log.Printf("🖱️  Mouse scroll: (%d, %d)", input.DeltaX, input.DeltaY)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
	})
}

func (h *HostServer) handleKeyboardInput(w http.ResponseWriter, r *http.Request) {
	// Enable CORS
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var input struct {
		Action string `json:"action"`
		Key    string `json:"key"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	h.inputHandler.HandleKeyPress(input.Key, input.Action)
	log.Printf("⌨️  Keyboard %s: %s", input.Action, input.Key)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
	})
}

// Mock nodes API for Tailscale integration
func handleNodesAPI(w http.ResponseWriter, r *http.Request) {
	// TODO: Integrate with actual Tailscale API
	// For now, return mock data
	nodes := []map[string]interface{}{
		{
			"name":         "desktop-main",
			"ip_addresses": []string{"100.64.0.1"},
			"online":       true,
		},
		{
			"name":         "laptop-work",
			"ip_addresses": []string{"100.64.0.2"},
			"online":       true,
		},
		{
			"name":         "server-home",
			"ip_addresses": []string{"100.64.0.3"},
			"online":       false,
		},
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"nodes": nodes,
	})
}

func main() {
	server := NewHostServer()

	// Create signaling server for WebRTC
	signalingServer := NewSignalingServer()

	// HTTP API routes
	http.HandleFunc("/health", server.handleHealth)
	http.HandleFunc("/api/screen/info", server.handleScreenInfo)
	http.HandleFunc("/api/nodes", handleNodesAPI)

	// WebSocket routes
	http.HandleFunc("/ws", server.handleWebSocket)                 // Legacy direct connection
	http.HandleFunc("/signaling", signalingServer.handleSignaling) // WebRTC signaling
	http.HandleFunc("/api/rooms", signalingServer.handleRooms)     // Room list API

	// Input API routes for WebRTC remote control
	http.HandleFunc("/api/input/mouse", server.handleMouseInput)
	http.HandleFunc("/api/input/keyboard", server.handleKeyboardInput)

	addr := fmt.Sprintf("%s:%s", Host, Port)
	log.Printf("🚀 Connext Host starting on %s", addr)
	log.Printf("📡 Direct WebSocket: ws://%s/ws", addr)
	log.Printf("📡 WebRTC Signaling: ws://%s/signaling", addr)
	log.Printf("🖱️  Input API: http://%s/api/input/*", addr)
	log.Printf("🏥 Health check: http://%s/health", addr)
	log.Printf("🌐 Nodes API: http://%s/api/nodes", addr)

	// Graceful shutdown
	go func() {
		if err := http.ListenAndServe(addr, nil); err != nil {
			log.Fatal(err)
		}
	}()

	// Wait for interrupt signal
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)
	<-sigChan

	log.Println("Shutting down...")
	server.screenCapture.Stop()
}
