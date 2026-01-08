use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Clone, Default)]
pub struct Z80Registers {
    pub a: u8,
    pub b: u8,
    pub c: u8,
    pub d: u8,
    pub e: u8,
    pub h: u8,
    pub l: u8,
    pub f: u8,
    pub sp: u16,
    pub pc: u16,
    pub a_: u8,
    pub b_: u8,
    pub c_: u8,
    pub d_: u8,
    pub e_: u8,
    pub h_: u8,
    pub l_: u8,
    pub f_: u8,
    pub iff1: u8,
    pub iff2: u8,
    pub i: u8,
    pub r: u8,
    pub ix: u16,
    pub iy: u16,
}

#[derive(Clone)]
pub struct Z80 {
    pub regs: Z80Registers,
    pub memory: Vec<u8>,
}

impl Z80 {
    pub fn new(ram_size: usize) -> Self {
        Self {
            regs: Z80Registers::default(),
            memory: vec![0; ram_size],
        }
    }
    pub fn get_registers(&self) -> &Z80Registers {
        &self.regs
    }
    pub fn get_memory(&self) -> &Vec<u8> {
        &self.memory
    }
    pub fn set_registers(&mut self, regs: Z80Registers) {
        self.regs = regs;
    }
}
