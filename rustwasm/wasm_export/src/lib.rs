use wasm_bindgen::prelude::*;
use serde::{Serialize, Deserialize};
use cpu_i8080::{I8080, I8080Registers};
use cpu_z80::{Z80, Z80Registers};

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = retrojs)]
    fn receiveFromRust(msg_type: &str, payload: &str);
}

#[derive(Serialize, Deserialize, Clone)]
pub struct EmulatorConfig {
    pub machine_type: String,
    pub cpu: String,
    pub ram: usize,
    pub peripherals: Vec<String>,
    pub front_panel: bool,
}

enum CpuType {
    I8080(I8080),
    Z80(Z80),
    None,
}

struct Emulator {
    config: EmulatorConfig,
    cpu: CpuType,
    debug_enabled: bool,
}

static mut EMULATOR: Option<Emulator> = None;

#[wasm_bindgen]
pub fn retrojs_send_to_rust(msg_type: &str, payload: &str) {
    match msg_type {
        "defineMachine" => {
            let config: Result<EmulatorConfig, _> = serde_json::from_str(payload);
            match config {
                Ok(cfg) => {
                    let cpu = match cfg.cpu.as_str() {
                        "i8080" => CpuType::I8080(I8080::new(cfg.ram)),
                        "z80" => CpuType::Z80(Z80::new(cfg.ram)),
                        _ => CpuType::None,
                    };
                    unsafe {
                        EMULATOR = Some(Emulator {
                            config: cfg,
                            cpu,
                            debug_enabled: false,
                        });
                    }
                    receiveFromRust("machineStatus", "ok");
                }
                Err(e) => {
                    receiveFromRust("machineStatus", &format!("error: {}", e));
                }
            }
        }
        "setDebug" => {
            let enabled = payload == "on";
            unsafe {
                if let Some(emulator) = EMULATOR.as_mut() {
                    emulator.debug_enabled = enabled;
                }
            }
            receiveFromRust("debugStatus", payload);
        }
        "memoryRead" => {
            let req: Result<serde_json::Value, _> = serde_json::from_str(payload);
            if let Ok(req) = req {
                if let Some(addr) = req.get("addr").and_then(|v| v.as_u64()) {
                    unsafe {
                        if let Some(emulator) = EMULATOR.as_ref() {
                            match &emulator.cpu {
                                CpuType::I8080(cpu) => {
                                    let mem = cpu.get_memory();
                                    if (addr as usize) < mem.len() {
                                        let msg = serde_json::json!({
                                            "addr": addr,
                                            "value": mem[addr as usize]
                                        });
                                        receiveFromRust("memoryReadResult", &msg.to_string());
                                    }
                                }
                                CpuType::Z80(cpu) => {
                                    let mem = cpu.get_memory();
                                    if (addr as usize) < mem.len() {
                                        let msg = serde_json::json!({
                                            "addr": addr,
                                            "value": mem[addr as usize]
                                        });
                                        receiveFromRust("memoryReadResult", &msg.to_string());
                                    }
                                }
                                _ => {}
                            }
                        }
                    }
                }
            }
        }
        "registersRead" => {
            unsafe {
                if let Some(emulator) = EMULATOR.as_ref() {
                    match &emulator.cpu {
                        CpuType::I8080(cpu) => {
                            let reg_json = serde_json::to_string(cpu.get_registers()).unwrap();
                            receiveFromRust("registers", &reg_json);
                        }
                        CpuType::Z80(cpu) => {
                            let reg_json = serde_json::to_string(cpu.get_registers()).unwrap();
                            receiveFromRust("registers", &reg_json);
                        }
                        _ => {}
                    }
                }
            }
        }
        "registersWrite" => {
            unsafe {
                if let Some(emulator) = EMULATOR.as_mut() {
                    match &mut emulator.cpu {
                        CpuType::I8080(cpu) => {
                            let regs: Result<I8080Registers, _> = serde_json::from_str(payload);
                            if let Ok(regs) = regs {
                                cpu.set_registers(regs);
                            }
                        }
                        CpuType::Z80(cpu) => {
                            let regs: Result<Z80Registers, _> = serde_json::from_str(payload);
                            if let Ok(regs) = regs {
                                cpu.set_registers(regs);
                            }
                        }
                        _ => {}
                    }
                }
            }
        }
        "memoryWrite" => {
            let req: Result<serde_json::Value, _> = serde_json::from_str(payload);
            if let Ok(req) = req {
                if let (Some(addr), Some(value)) = (req.get("addr").and_then(|v| v.as_u64()), req.get("value").and_then(|v| v.as_u64())) {
                    unsafe {
                        if let Some(emulator) = EMULATOR.as_mut() {
                            match &mut emulator.cpu {
                                CpuType::I8080(cpu) => {
                                    let mem = &mut cpu.memory;
                                    if (addr as usize) < mem.len() {
                                        mem[addr as usize] = value as u8;
                                        if emulator.debug_enabled {
                                            let msg = serde_json::json!({
                                                "addr": addr,
                                                "value": value
                                            });
                                            receiveFromRust("memoryWrite", &msg.to_string());
                                        }
                                    }
                                }
                                CpuType::Z80(cpu) => {
                                    let mem = &mut cpu.memory;
                                    if (addr as usize) < mem.len() {
                                        mem[addr as usize] = value as u8;
                                        if emulator.debug_enabled {
                                            let msg = serde_json::json!({
                                                "addr": addr,
                                                "value": value
                                            });
                                            receiveFromRust("memoryWrite", &msg.to_string());
                                        }
                                    }
                                }
                                _ => {}
                            }
                        }
                    }
                }
            }
        }
        "consoleIn" => {
            receiveFromRust("consoleOut", payload);
        }
        _ => {}
    }
}

#[wasm_bindgen]
pub fn send_test_pattern() {
    let pattern = generate_test_pattern();
    receiveFromRust("consoleOut", &pattern);
}

fn generate_test_pattern() -> String {
    let mut pattern = String::from(" ");
    for col in 0..79 {
        pattern.push((b'0' + (col % 10) as u8) as char);
    }
    pattern.push_str("\r\n");
    for row in 1..25 {
        pattern.push((b'0' + (row % 10) as u8) as char);
        for col in 1..80 {
            pattern.push((b'A' + ((col - 1) % 26) as u8) as char);
        }
        if row < 24 {
            pattern.push_str("\r\n");
        }
    }
    pattern
}
