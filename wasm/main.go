package main

import (
	"encoding/json"
	"syscall/js"

	"github.com/bbgott/retrojs/wasm/cpu"
)

// Debugging flag
var debugEnabled bool

// Helper for memory write with debug message passing
func memoryWrite(addr int, value byte) {
	if emulator == nil || emulator.CPU == nil {
		return
	}
	mem := emulator.CPU.GetMemory()
	if addr < 0 || addr >= len(mem) {
		return
	}
	mem[addr] = value
	if debugEnabled {
		// Send memoryWrite message to JS
		msg := struct {
			Addr  int  `json:"addr"`
			Value byte `json:"value"`
		}{Addr: addr, Value: value}
		payload, _ := json.Marshal(msg)
		sendMessageToJS("memoryWrite", string(payload))
	}
}

// Helper to enable/disable debugging
func setDebugEnabled(enabled bool) {
	debugEnabled = enabled
}

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
	CPU    CPU
}

// CPU is an interface for CPU implementations
type CPU interface {
	GetRegisters() interface{}
	GetMemory() []byte
	SetRegisters(regs interface{})
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
	case "setDebug":
		// Enable or disable debugging
		if payload == "on" {
			setDebugEnabled(true)
		} else {
			setDebugEnabled(false)
		}
		sendMessageToJS("debugStatus", payload)
	case "memoryRead":
		// Read a memory address and send value back
		var req struct {
			Addr int `json:"addr"`
		}
		if err := json.Unmarshal([]byte(payload), &req); err == nil {
			if emulator != nil && emulator.CPU != nil {
				mem := emulator.CPU.GetMemory()
				if req.Addr >= 0 && req.Addr < len(mem) {
					msg := struct {
						Addr  int  `json:"addr"`
						Value byte `json:"value"`
					}{Addr: req.Addr, Value: mem[req.Addr]}
					resp, _ := json.Marshal(msg)
					sendMessageToJS("memoryReadResult", string(resp))
				}
			}
		}
	case "registersRead":
		// Send current registers to JS
		if emulator != nil && emulator.CPU != nil {
			regJson, _ := json.Marshal(emulator.CPU.GetRegisters())
			sendMessageToJS("registers", string(regJson))
		}
	case "registersWrite":
		// Update registers from JS
		if emulator != nil && emulator.CPU != nil {
			switch c := emulator.CPU.(type) {
			case *cpu.I8080:
				var regs cpu.I8080Registers
				if err := json.Unmarshal([]byte(payload), &regs); err == nil {
					c.SetRegisters(regs)
				}
			case *cpu.Z80:
				var regs cpu.Z80Registers
				if err := json.Unmarshal([]byte(payload), &regs); err == nil {
					c.SetRegisters(regs)
				}
			}
		}
	case "defineMachine":
		// Parse config and (re)initialize emulator
		var config EmulatorConfig
		err := json.Unmarshal([]byte(payload), &config)
		if err != nil {
			sendMessageToJS("machineStatus", "error: "+err.Error())
			return nil
		}
		var cpuImpl CPU
		switch config.CPU {
		case "i8080":
			cpuImpl = cpu.NewI8080(config.RAM)
		case "z80":
			cpuImpl = cpu.NewZ80(config.RAM)
		default:
			sendMessageToJS("machineStatus", "error: unsupported CPU type")
			return nil
		}
		emulator = &Emulator{Config: config, CPU: cpuImpl}
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
