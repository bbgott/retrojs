use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Clone, Default)]
pub struct I8080Registers {
    pub a: u8,
    pub b: u8,
    pub c: u8,
    pub d: u8,
    pub e: u8,
    pub h: u8,
    pub l: u8,
    pub f: u8,
    pub pc: u16,
    pub sp: u16,
}

#[derive(Clone)]
pub struct I8080 {
    pub regs: I8080Registers,
    pub memory: Vec<u8>,
}

impl I8080 {
    pub fn new(ram_size: usize) -> Self {
        Self {
            regs: I8080Registers::default(),
            memory: vec![0; ram_size],
        }
    }
    pub fn get_registers(&self) -> &I8080Registers {
        &self.regs
    }
    pub fn get_memory(&self) -> &Vec<u8> {
        &self.memory
    }
    pub fn set_registers(&mut self, regs: I8080Registers) {
        self.regs = regs;
    }
}
