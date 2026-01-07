package cpu

type I8080Registers struct {
	A  byte
	B  byte
	C  byte
	D  byte
	E  byte
	H  byte
	L  byte
	F  byte
	PC uint16
	SP uint16
}

type I8080 struct {
	Regs   I8080Registers
	Memory []byte
}

func NewI8080(ramSize int) *I8080 {
	return &I8080{
		Regs:   I8080Registers{},
		Memory: make([]byte, ramSize),
	}
}

func (cpu *I8080) GetRegisters() interface{} {
	return cpu.Regs
}

func (cpu *I8080) GetMemory() []byte {
	return cpu.Memory
}

func (cpu *I8080) SetRegisters(regs interface{}) {
	if r, ok := regs.(I8080Registers); ok {
		cpu.Regs = r
	}
}
