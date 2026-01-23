package derpserver

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"sync"

	"github.com/gorilla/websocket"
	"gopkg.in/yaml.v3"
)

type Config struct {
	ListenAddr string `yaml:"listen_addr"`
	CertFile   string `yaml:"cert_file"`
	KeyFile    string `yaml:"key_file"`
	Region     string `yaml:"region"`
}

// ---------------- Message Types ----------------

type DerpMessage struct {
	Type     string `json:"type"`
	NodeID   string `json:"node_id,omitempty"`
	FromNode string `json:"from_node,omitempty"`
	ToNode   string `json:"to_node,omitempty"`
	Endpoint string `json:"endpoint,omitempty"`
	Data     string `json:"data,omitempty"`
}

// ---------------- Clients ----------------

type Client struct {
	ID       string
	Conn     *websocket.Conn
	Endpoint string
}

var (
	clients   = make(map[string]*Client)
	clientsMu sync.RWMutex
)

// ---------------- Config Loader ----------------

func LoadConfig(path string) (*Config, error) {
	b, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var c Config
	return &c, yaml.Unmarshal(b, &c)
}

// ---------------- WebSocket Upgrade ----------------

var upgrader = websocket.Upgrader{
	ReadBufferSize:  4096,
	WriteBufferSize: 4096,
	CheckOrigin:     func(r *http.Request) bool { return true },
}

// ---------------- WebSocket Handler ----------------

func HandleWS(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("❌ Upgrade failed:", err)
		return
	}

	msgType, regMsg, err := conn.ReadMessage()
	if err != nil {
		log.Println("❌ Registration read failed:", err)
		conn.Close()
		return
	}

	log.Printf("📩 Received message (type=%d, len=%d): %s", msgType, len(regMsg), string(regMsg))

	var msg DerpMessage
	if err := json.Unmarshal(regMsg, &msg); err != nil {
		log.Printf("❌ JSON unmarshal failed: %v | Raw: %s", err, string(regMsg))
		conn.Close()
		return
	}

	log.Printf("📦 Parsed: Type='%s', NodeID='%s'", msg.Type, msg.NodeID)

	if msg.Type != "register" {
		log.Printf("❌ Wrong type: expected 'register', got '%s'", msg.Type)
		conn.Close()
		return
	}

	if msg.NodeID == "" {
		log.Printf("❌ Empty node_id")
		conn.Close()
		return
	}

	nodeID := msg.NodeID
	log.Println("✅ Client registered:", nodeID)

	client := &Client{
		ID:   nodeID,
		Conn: conn,
	}

	clientsMu.Lock()
	clients[nodeID] = client
	clientsMu.Unlock()

	response := DerpMessage{
		Type:   "registered",
		NodeID: nodeID,
	}
	responseJSON, _ := json.Marshal(response)

	log.Printf("📤 Sending registration response: %s", string(responseJSON))

	if err := conn.WriteMessage(websocket.TextMessage, responseJSON); err != nil {
		log.Println("❌ Failed to send response:", err)
		conn.Close()
		return
	}

	log.Printf("✅ Registration complete for %s", nodeID)

	notifyPeerOnline(nodeID, "")

	log.Printf("📊 Total clients: %d", len(clients))

	go readLoop(nodeID, conn)
}

func readLoop(nodeID string, conn *websocket.Conn) {
	defer func() {
		conn.Close()
		clientsMu.Lock()
		delete(clients, nodeID)
		clientsMu.Unlock()

		notifyPeerOffline(nodeID)

		log.Println("❌ Client disconnected:", nodeID)
		log.Printf("📊 Total clients: %d", len(clients))
	}()

	for {
		_, data, err := conn.ReadMessage()
		if err != nil {
			return
		}

		var msg DerpMessage
		if err := json.Unmarshal(data, &msg); err != nil {
			log.Println("❌ Invalid message JSON:", err)
			continue
		}

		log.Printf("📨 Message from %s: type=%s", nodeID, msg.Type)

		switch msg.Type {
		case "ping":
			pong := DerpMessage{Type: "pong"}
			pongJSON, _ := json.Marshal(pong)
			conn.WriteMessage(websocket.TextMessage, pongJSON)
			log.Printf("🏓 Pong sent to %s", nodeID)

		case "endpoint_exchange":
			handleEndpointExchange(nodeID, &msg)

		case "relay":
			handleRelay(nodeID, &msg)

		default:
			log.Printf("⚠️ Unknown message type: %s from %s", msg.Type, nodeID)
		}
	}
}

// ---------------- Endpoint Exchange ----------------

func handleEndpointExchange(fromNode string, msg *DerpMessage) {
	log.Printf("🔍 Endpoint exchange from %s: ToNode='%s', Endpoint='%s'", fromNode, msg.ToNode, msg.Endpoint)

	clientsMu.Lock()
	defer clientsMu.Unlock()

	// If this is a request (empty endpoint), send back the TARGET's endpoint
	if msg.ToNode != "" && msg.Endpoint == "" {
		target, ok := clients[msg.ToNode]
		if !ok {
			log.Printf("⚠️ Target not found: %s", msg.ToNode)
			return
		}

		// Send target's endpoint back to requester
		if target.Endpoint != "" {
			requester, ok := clients[fromNode]
			if !ok {
				return
			}

			response := DerpMessage{
				Type:     "endpoint_exchange",
				FromNode: msg.ToNode, // Make it look like it came from target
				ToNode:   fromNode,   // Send to requester
				Endpoint: target.Endpoint,
			}
			responseJSON, _ := json.Marshal(response)
			requester.Conn.WriteMessage(websocket.TextMessage, responseJSON)
			log.Printf("📤 Sent %s's endpoint to %s: %s", msg.ToNode, fromNode, target.Endpoint)
		} else {
			log.Printf("⚠️ Target %s has no endpoint yet", msg.ToNode)
		}
		return
	}

	// If announcing own endpoint, store it and broadcast
	if msg.Endpoint != "" {
		if client, ok := clients[fromNode]; ok {
			client.Endpoint = msg.Endpoint
			log.Printf("📍 Updated endpoint for %s: %s", fromNode, msg.Endpoint)
		}

		// Broadcast to specific peer or all
		if msg.ToNode != "" {
			if target, ok := clients[msg.ToNode]; ok {
				forward := DerpMessage{
					Type:     "endpoint_exchange",
					FromNode: fromNode,
					ToNode:   msg.ToNode,
					Endpoint: msg.Endpoint,
				}
				forwardJSON, _ := json.Marshal(forward)
				target.Conn.WriteMessage(websocket.TextMessage, forwardJSON)
				log.Printf("📤 Forwarded endpoint %s -> %s: %s", fromNode, msg.ToNode, msg.Endpoint)
			}
		} else {
			// Broadcast to all peers
			for peerID, peer := range clients {
				if peerID != fromNode {
					announce := DerpMessage{
						Type:     "endpoint_exchange",
						FromNode: fromNode,
						ToNode:   peerID,
						Endpoint: msg.Endpoint,
					}
					announceJSON, _ := json.Marshal(announce)
					peer.Conn.WriteMessage(websocket.TextMessage, announceJSON)
				}
			}
			log.Printf("📢 Broadcasted endpoint from %s: %s", fromNode, msg.Endpoint)
		}
	}
}

// ---------------- Relay ----------------

func handleRelay(fromNode string, msg *DerpMessage) {
	if msg.ToNode == "" {
		log.Printf("⚠️ Relay missing target from %s", fromNode)
		return
	}

	clientsMu.RLock()
	target, ok := clients[msg.ToNode]
	clientsMu.RUnlock()

	if !ok {
		log.Printf("⚠️ Relay target not found: %s (from %s)", msg.ToNode, fromNode)
		return
	}

	forward := DerpMessage{
		Type:     "relay",
		FromNode: fromNode,
		ToNode:   msg.ToNode,
		Data:     msg.Data,
	}

	forwardJSON, _ := json.Marshal(forward)
	target.Conn.WriteMessage(websocket.TextMessage, forwardJSON)
	log.Printf("📨 Relayed packet from %s to %s", fromNode, msg.ToNode)
}

// ---------------- Peer Notifications ----------------

func notifyPeerOnline(nodeID string, endpoint string) {
	clientsMu.RLock()
	defer clientsMu.RUnlock()

	notification := DerpMessage{
		Type:     "peer_online",
		NodeID:   nodeID,
		Endpoint: endpoint,
	}

	notificationJSON, _ := json.Marshal(notification)

	for peerID, peer := range clients {
		if peerID != nodeID {
			peer.Conn.WriteMessage(websocket.TextMessage, notificationJSON)
		}
	}

	log.Printf("📢 Notified %d peers that %s came online", len(clients)-1, nodeID)
}

func notifyPeerOffline(nodeID string) {
	clientsMu.RLock()
	defer clientsMu.RUnlock()

	notification := DerpMessage{
		Type:   "peer_offline",
		NodeID: nodeID,
	}

	notificationJSON, _ := json.Marshal(notification)

	for peerID, peer := range clients {
		if peerID != nodeID {
			peer.Conn.WriteMessage(websocket.TextMessage, notificationJSON)
		}
	}

	log.Printf("📢 Notified peers that %s went offline", nodeID)
}

// ---------------- Server Start ----------------

func Start(cfg *Config) error {
	http.HandleFunc("/derp", HandleWS)

	log.Println("🚀 DERP relay listening on", cfg.ListenAddr)
	log.Println("📍 Region:", cfg.Region)

	if cfg.CertFile != "" && cfg.KeyFile != "" {
		log.Println("🔒 Using TLS")
		return http.ListenAndServeTLS(cfg.ListenAddr, cfg.CertFile, cfg.KeyFile, nil)
	} else {
		log.Println("⚠️ Running in HTTP mode (no TLS)")
		return http.ListenAndServe(cfg.ListenAddr, nil)
	}
}
