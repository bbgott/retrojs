package cpu

type Z80Registers struct {
	A    byte
	B    byte
	C    byte
	D    byte
	E    byte
	H    byte
	L    byte
	F    byte
	SP   uint16
	PC   uint16
	A_   byte
	B_   byte
	C_   byte
	D_   byte
	E_   byte
	H_   byte
	L_   byte
	F_   byte
	IFF1 byte
	IFF2 byte
	I    byte
	R    byte
	IX   uint16
	IY   uint16
}

type Z80 struct {
	Regs   Z80Registers
	Memory []byte
}

func NewZ80(ramSize int) *Z80 {
	return &Z80{
		Regs:   Z80Registers{},
		Memory: make([]byte, ramSize),
	}
}

func (cpu *Z80) GetRegisters() interface{} {
	return cpu.Regs
}

func (cpu *Z80) GetMemory() []byte {
	return cpu.Memory
}

func (cpu *Z80) SetRegisters(regs interface{}) {
	if r, ok := regs.(Z80Registers); ok {
		cpu.Regs = r
	}
}
