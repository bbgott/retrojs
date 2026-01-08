BINARY_NAME=main

build:
	GOARCH=wasm GOOS=js go build -o static/${BINARY_NAME}.wasm wasm/main.go
	cp $(shell go env GOROOT)/lib/wasm/wasm_exec.js static/

run: build
	go run cmd/server/main.go

clean:
	go clean
	rm static/${BINARY_NAME}.wasm