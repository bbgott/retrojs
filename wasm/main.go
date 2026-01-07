package main

import (
	"encoding/json"
	"syscall/js"
)

// sendMessageToJS sends a message to JS with a type and payload (as string)
func sendMessageToJS(msgType, payload string) {
	js.Global().Call("retrojs_receiveFromGo", msgType, payload)
}

// EmulatorConfig holds the machine definition/configuration
type EmulatorConfig struct {
	MachineType string   `json:"machineType"`
	CPU         string   `json:"cpu"`
	RAM         int      `json:"ram"`
	Peripherals []string `json:"peripherals"`
	FrontPanel  bool     `json:"frontPanel"`
}

// Emulator is a stub for the emulator core
type Emulator struct {
	Config EmulatorConfig
	// TODO: Add registers, memory, peripherals, etc.
}

var emulator *Emulator

// receiveMessageFromJS is a Go function exposed to JS for receiving messages from JS
func receiveMessageFromJS(_ js.Value, args []js.Value) interface{} {
	if len(args) < 2 {
		return nil
	}
	msgType := args[0].String()
	payload := args[1].String()
	switch msgType {
	case "defineMachine":
		// Parse config and (re)initialize emulator
		var config EmulatorConfig
		err := json.Unmarshal([]byte(payload), &config)
		if err != nil {
			sendMessageToJS("machineStatus", "error: "+err.Error())
			return nil
		}
		emulator = &Emulator{Config: config}
		sendMessageToJS("machineStatus", "ok")
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
