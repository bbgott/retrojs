use wasm_bindgen::prelude::*;
use serde::{Serialize, Deserialize};

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = retrojs)]
    fn receiveFromGo(msg_type: &str, payload: &str);
}

#[derive(Serialize, Deserialize, Clone)]
pub struct EmulatorConfig {
    pub machine_type: String,
    pub cpu: String,
    pub ram: usize,
    pub peripherals: Vec<String>,
    pub front_panel: bool,
}

#[wasm_bindgen]
pub struct Emulator {
    config: EmulatorConfig,
    // cpu: Box<dyn Cpu>, // To be implemented
}

#[wasm_bindgen]
pub fn retrojs_send_to_rust(msg_type: &str, payload: &str) {
    match msg_type {
        "defineMachine" => {
            let config: Result<EmulatorConfig, _> = serde_json::from_str(payload);
            match config {
                Ok(cfg) => {
                    // TODO: Instantiate CPU based on cfg.cpu
                    let _emulator = Emulator { config: cfg };
                    receiveFromGo("machineStatus", "ok");
                }
                Err(e) => {
                    receiveFromGo("machineStatus", &format!("error: {}", e));
                }
            }
        }
        "consoleIn" => {
            // Echo input back to terminal
            receiveFromGo("consoleOut", payload);
        }
        _ => {}
    }
}

#[wasm_bindgen]
pub fn send_test_pattern() {
    let pattern = generate_test_pattern();
    receiveFromGo("consoleOut", &pattern);
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
