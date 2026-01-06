package main

import (
	"syscall/js"
)

// sendMessageToJS sends a message to JS with a type and payload (as string)
func sendMessageToJS(msgType, payload string) {
	js.Global().Call("retrojs_receiveFromGo", msgType, payload)
}

// receiveMessageFromJS is a Go function exposed to JS for receiving messages from JS
func receiveMessageFromJS(_ js.Value, args []js.Value) interface{} {
	if len(args) < 2 {
		return nil
	}
	msgType := args[0].String()
	payload := args[1].String()
	// Handle different message types here
	switch msgType {
	case "consoleIn":
		// For now, just echo input back to terminal
		sendMessageToJS("consoleOut", payload)
	case "diskRead":
		// Future: handle disk read
	case "diskWrite":
		// Future: handle disk write
	}
	return nil
}

func generateTestPattern() string {
	// Generate an 80x25 test pattern with header and left row digits
	pattern := " "
	for col := 0; col < 79; col++ {
		pattern += string('0' + (col % 10))
	}
	pattern += "\r\n"
	for row := 1; row < 25; row++ {
		pattern += string('0' + (row % 10))
		for col := 1; col < 80; col++ {
			pattern += string('A' + ((col - 1) % 26))
		}
		if row < 24 {
			pattern += "\r\n"
		}
	}
	return pattern
}

func main() {
	// Register Go function for JS to call
	js.Global().Set("retrojs_sendToGo", js.FuncOf(receiveMessageFromJS))

	// On startup, send test pattern to JS for terminal output
	testPattern := generateTestPattern()
	sendMessageToJS("consoleOut", testPattern)

	// Prevent Go from exiting
	select {}
}
