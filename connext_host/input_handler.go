package main

import (
	"log"

	"github.com/go-vgo/robotgo"
)

type InputHandler struct {
	screenWidth  int
	screenHeight int
}

func NewInputHandler() *InputHandler {
	width, height := robotgo.GetScreenSize()
	return &InputHandler{
		screenWidth:  width,
		screenHeight: height,
	}
}

func (i *InputHandler) HandleMouseMove(x, y int) {
	robotgo.Move(x, y)
}

func (i *InputHandler) HandleMouseClick(button string, action string) {
	if action == "down" {
		robotgo.MouseDown(button)
	} else if action == "up" {
		robotgo.MouseUp(button)
	} else {
		robotgo.Click(button)
	}
}

func (i *InputHandler) HandleMouseScroll(deltaX, deltaY int) {
	if deltaY != 0 {
		robotgo.Scroll(0, deltaY)
	}
	if deltaX != 0 {
		robotgo.Scroll(deltaX, 0)
	}
}

func (i *InputHandler) HandleKeyPress(key string, action string) {
	// Map common keys
	mappedKey := mapKey(key)

	if action == "down" {
		robotgo.KeyDown(mappedKey)
	} else if action == "up" {
		robotgo.KeyUp(mappedKey)
	} else {
		robotgo.KeyTap(mappedKey)
	}
}

func (i *InputHandler) HandleKeyType(text string) {
	robotgo.TypeStr(text)
}

// Map Flutter key labels to robotgo key names
func mapKey(key string) string {
	keyMap := map[string]string{
		"enter":     "enter",
		"escape":    "esc",
		"backspace": "backspace",
		"tab":       "tab",
		"space":     "space",
		"delete":    "delete",
		"up":        "up",
		"down":      "down",
		"left":      "left",
		"right":     "right",
		"shift":     "shift",
		"ctrl":      "ctrl",
		"alt":       "alt",
		"meta":      "cmd",
		"f1":        "f1",
		"f2":        "f2",
		"f3":        "f3",
		"f4":        "f4",
		"f5":        "f5",
		"f6":        "f6",
		"f7":        "f7",
		"f8":        "f8",
		"f9":        "f9",
		"f10":       "f10",
		"f11":       "f11",
		"f12":       "f12",
	}

	if mapped, ok := keyMap[key]; ok {
		return mapped
	}

	// For regular characters, return as-is
	if len(key) == 1 {
		return key
	}

	log.Printf("⚠️  Unmapped key: %s", key)
	return key
}
