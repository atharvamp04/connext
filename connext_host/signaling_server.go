package main

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

type SignalingServer struct {
	rooms    map[string]*Room
	roomsMux sync.RWMutex
	upgrader websocket.Upgrader
}

type Room struct {
	id      string
	clients map[*Client]bool
	mu      sync.RWMutex
}

type Client struct {
	conn *websocket.Conn
	room *Room
	role string // "host" or "client"
	send chan []byte
}

type SignalingMessage struct {
	Type      string                 `json:"type"`
	Room      string                 `json:"room"`
	Role      string                 `json:"role,omitempty"`
	SDP       map[string]interface{} `json:"sdp,omitempty"` // FIXED: Changed from string to map
	Candidate map[string]interface{} `json:"candidate,omitempty"`
}

func NewSignalingServer() *SignalingServer {
	return &SignalingServer{
		rooms: make(map[string]*Room),
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				return true // Allow all origins (restrict in production)
			},
		},
	}
}

func (s *SignalingServer) handleSignaling(w http.ResponseWriter, r *http.Request) {
	conn, err := s.upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}

	client := &Client{
		conn: conn,
		send: make(chan []byte, 256),
	}

	// Start goroutines
	go client.writePump()
	go client.readPump(s)
}

func (c *Client) readPump(server *SignalingServer) {
	defer func() {
		if c.room != nil {
			c.room.leave(c)
		}
		c.conn.Close()
	}()

	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}

		var msg SignalingMessage
		if err := json.Unmarshal(message, &msg); err != nil {
			log.Printf("JSON unmarshal error: %v | Raw: %s", err, string(message))
			continue
		}

		server.handleMessage(c, &msg)
	}
}

func (c *Client) writePump() {
	defer c.conn.Close()

	for {
		message, ok := <-c.send
		if !ok {
			c.conn.WriteMessage(websocket.CloseMessage, []byte{})
			return
		}

		if err := c.conn.WriteMessage(websocket.TextMessage, message); err != nil {
			return
		}
	}
}

func (s *SignalingServer) handleMessage(client *Client, msg *SignalingMessage) {
	log.Printf("📩 Received: %s (room: %s)", msg.Type, msg.Room)

	switch msg.Type {
	case "join":
		s.handleJoin(client, msg)
	case "offer", "answer", "ice-candidate": // FIXED: Changed from ice_candidate to ice-candidate
		s.handleRelay(client, msg)
	default:
		log.Printf("❓ Unknown message type: %s", msg.Type)
	}
}

func (s *SignalingServer) handleJoin(client *Client, msg *SignalingMessage) {
	s.roomsMux.Lock()
	room, exists := s.rooms[msg.Room]
	if !exists {
		room = &Room{
			id:      msg.Room,
			clients: make(map[*Client]bool),
		}
		s.rooms[msg.Room] = room
		log.Printf("🆕 Created room: %s", msg.Room)
	}
	s.roomsMux.Unlock()

	client.role = msg.Role
	room.join(client)

	// Count clients after join
	room.mu.RLock()
	clientCount := len(room.clients)
	room.mu.RUnlock()

	// Notify other clients
	room.broadcast(&SignalingMessage{
		Type: "peer-joined", // FIXED: Changed from peer_joined to peer-joined
		Room: msg.Room,
		Role: msg.Role,
	}, client)

	log.Printf("✅ Client joined room %s as %s (%d total)", msg.Room, msg.Role, clientCount)
}

func (s *SignalingServer) handleRelay(client *Client, msg *SignalingMessage) {
	if client.room == nil {
		log.Println("❌ Client not in a room")
		return
	}

	log.Printf("📤 Relaying %s to peers in room %s", msg.Type, client.room.id)

	// Relay to all other clients in the room
	client.room.broadcast(msg, client)
}

func (r *Room) join(client *Client) {
	r.mu.Lock()
	defer r.mu.Unlock()

	client.room = r
	r.clients[client] = true
}

func (r *Room) leave(client *Client) {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, ok := r.clients[client]; ok {
		delete(r.clients, client)
		close(client.send)

		clientCount := len(r.clients)

		// Notify others
		r.broadcastLocked(&SignalingMessage{
			Type: "peer-left", // FIXED: Changed from peer_left to peer-left
			Room: r.id,
			Role: client.role,
		}, client)

		log.Printf("👋 Client left room %s (%d remaining)", r.id, clientCount)
	}
}

func (r *Room) broadcast(msg *SignalingMessage, exclude *Client) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	r.broadcastLocked(msg, exclude)
}

func (r *Room) broadcastLocked(msg *SignalingMessage, exclude *Client) {
	data, err := json.Marshal(msg)
	if err != nil {
		log.Printf("JSON marshal error: %v", err)
		return
	}

	sentCount := 0
	for client := range r.clients {
		if client != exclude {
			select {
			case client.send <- data:
				sentCount++
			default:
				close(client.send)
				delete(r.clients, client)
			}
		}
	}

	if sentCount > 0 {
		log.Printf("   ↳ Sent to %d peer(s)", sentCount)
	}
}

func (s *SignalingServer) handleRooms(w http.ResponseWriter, r *http.Request) {
	s.roomsMux.RLock()
	defer s.roomsMux.RUnlock()

	rooms := make([]map[string]interface{}, 0)
	for id, room := range s.rooms {
		room.mu.RLock()
		rooms = append(rooms, map[string]interface{}{
			"id":      id,
			"clients": len(room.clients),
		})
		room.mu.RUnlock()
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"rooms": rooms,
	})
}
