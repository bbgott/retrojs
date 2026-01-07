
# retrojs
An i8080/z80 retro computer emulator in JavaScript and Go

## Building and Running the Webapp

### Prerequisites
- Go (with WASM support)
- Node.js and npm

### 1. Build the Go WASM module

From the project root, run:

```bash
GOOS=js GOARCH=wasm go build -o static/main.wasm ./cmd/wasm
```

### 2. Copy wasm_exec.js

Copy the Go WASM runtime to the static directory:

```bash
cp $(go env GOROOT)/misc/wasm/wasm_exec.js static/
```

### 3. Install JS dependencies

```bash
npm install
```


### 4. Clean the build output (optional)

If you want to remove the `dist/` directory and start with a fresh build, run:

```bash
npm run clean
```

### 5. Build the production webapp

```bash
npm run build
```
The production-ready files will be in the `dist/` directory.

### 6. Run the production server for testing

```bash
npm run serve
```
This will serve the `dist/` directory at http://localhost:4173 (default).

### 7. Run the development server (hot reload)

```bash
npm run dev
```
This will serve the app with hot reload at http://localhost:3000 (default).
