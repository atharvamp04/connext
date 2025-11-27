package main

import (
	"bytes"
	"fmt"
	"image"
	"image/jpeg"
	"log"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/kbinani/screenshot"
)

type ScreenCaptureService struct {
	mu         sync.Mutex
	capturing  bool
	stopChan   chan struct{}
	frameCount int
	width      int
	height     int
}

func NewScreenCaptureService() *ScreenCaptureService {
	// Get primary display bounds
	n := screenshot.NumActiveDisplays()
	var width, height int
	if n > 0 {
		bounds := screenshot.GetDisplayBounds(0)
		width = bounds.Dx()
		height = bounds.Dy()
	}

	return &ScreenCaptureService{
		width:    width,
		height:   height,
		stopChan: make(chan struct{}),
	}
}

func (s *ScreenCaptureService) Start(conn *websocket.Conn) error {
	s.mu.Lock()
	if s.capturing {
		s.mu.Unlock()
		return fmt.Errorf("already capturing")
	}
	s.capturing = true
	s.frameCount = 0
	s.mu.Unlock()

	go s.captureLoop(conn)
	return nil
}

func (s *ScreenCaptureService) Stop() {
	s.mu.Lock()
	defer s.mu.Unlock()

	if !s.capturing {
		return
	}

	s.capturing = false
	close(s.stopChan)
	s.stopChan = make(chan struct{})

	log.Printf("Capture stopped. Total frames: %d", s.frameCount)
}

func (s *ScreenCaptureService) captureLoop(conn *websocket.Conn) {
	ticker := time.NewTicker(33 * time.Millisecond) // ~30 FPS
	defer ticker.Stop()

	log.Println("Screen capture loop started")

	for {
		select {
		case <-s.stopChan:
			return
		case <-ticker.C:
			if err := s.captureAndSendFrame(conn); err != nil {
				log.Printf("Capture error: %v", err)
			}
		}
	}
}

func (s *ScreenCaptureService) captureAndSendFrame(conn *websocket.Conn) error {
	// Capture screenshot
	img, err := screenshot.CaptureDisplay(0)
	if err != nil {
		return fmt.Errorf("screenshot failed: %w", err)
	}

	// Encode as JPEG (for now - we'll add H.264 later)
	buf := new(bytes.Buffer)
	if err := jpeg.Encode(buf, img, &jpeg.Options{Quality: 75}); err != nil {
		return fmt.Errorf("jpeg encode failed: %w", err)
	}

	// Send over WebSocket
	s.mu.Lock()
	s.frameCount++
	frameNum := s.frameCount
	s.mu.Unlock()

	if frameNum%30 == 0 {
		log.Printf("Sent frame %d (%d KB)", frameNum, buf.Len()/1024)
	}

	return conn.WriteMessage(websocket.BinaryMessage, buf.Bytes())
}

func (s *ScreenCaptureService) GetScreenInfo() map[string]interface{} {
	s.mu.Lock()
	defer s.mu.Unlock()

	return map[string]interface{}{
		"width":     s.width,
		"height":    s.height,
		"capturing": s.capturing,
	}
}

func (s *ScreenCaptureService) CaptureFrame() (image.Image, error) {
	return screenshot.CaptureDisplay(0)
}
