
use wasm_bindgen::prelude::*;
use serde::{Serialize, Deserialize};
use cpu_i8080::{I8080, I8080Registers};
use cpu_z80::{Z80, Z80Registers};

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

#[wasm_bindgen]
pub struct Emulator {
    config: EmulatorConfig,
    cpu: CpuType,
    debug_enabled: bool,
}

#[wasm_bindgen]
impl Emulator {
    #[wasm_bindgen(constructor)]
    pub fn new(config_json: &str) -> Result<Emulator, JsValue> {
        let config: EmulatorConfig = serde_json::from_str(config_json)
            .map_err(|e| JsValue::from_str(&format!("Config error: {}", e)))?;
        let cpu = match config.cpu.as_str() {
            "i8080" => CpuType::I8080(I8080::new(config.ram)),
            "z80" => CpuType::Z80(Z80::new(config.ram)),
            _ => CpuType::None,
        };
        Ok(Emulator { config, cpu, debug_enabled: false })
    }

    pub fn set_debug(&mut self, enabled: bool) {
        self.debug_enabled = enabled;
    }

    pub fn memory_read(&self, addr: usize) -> Result<u8, JsValue> {
        match &self.cpu {
            CpuType::I8080(cpu) => cpu.memory.get(addr).copied().ok_or(JsValue::from_str("Out of bounds")),
            CpuType::Z80(cpu) => cpu.memory.get(addr).copied().ok_or(JsValue::from_str("Out of bounds")),
            _ => Err(JsValue::from_str("No CPU")),
        }
    }

    pub fn memory_write(&mut self, addr: usize, value: u8) -> Result<(), JsValue> {
        match &mut self.cpu {
            CpuType::I8080(cpu) => {
                if addr < cpu.memory.len() {
                    cpu.memory[addr] = value;
                    Ok(())
                } else {
                    Err(JsValue::from_str("Out of bounds"))
                }
            }
            CpuType::Z80(cpu) => {
                if addr < cpu.memory.len() {
                    cpu.memory[addr] = value;
                    Ok(())
                } else {
                    Err(JsValue::from_str("Out of bounds"))
                }
            }
            _ => Err(JsValue::from_str("No CPU")),
        }
    }

    pub fn registers_read(&self) -> Result<JsValue, JsValue> {
        match &self.cpu {
            CpuType::I8080(cpu) => {
                let reg_json = serde_wasm_bindgen::to_value(cpu.get_registers())?;
                Ok(reg_json)
            }
            CpuType::Z80(cpu) => {
                let reg_json = serde_wasm_bindgen::to_value(cpu.get_registers())?;
                Ok(reg_json)
            }
            _ => Err(JsValue::from_str("No CPU")),
        }
    }

    pub fn registers_write(&mut self, regs: JsValue) -> Result<(), JsValue> {
        match &mut self.cpu {
            CpuType::I8080(cpu) => {
                let regs: I8080Registers = serde_wasm_bindgen::from_value(regs)?;
                cpu.set_registers(regs);
                Ok(())
            }
            CpuType::Z80(cpu) => {
                let regs: Z80Registers = serde_wasm_bindgen::from_value(regs)?;
                cpu.set_registers(regs);
                Ok(())
            }
            _ => Err(JsValue::from_str("No CPU")),
        }
    }

    pub fn send_test_pattern(&self) -> String {
        generate_test_pattern()
    }
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
