

# retrojs
An i8080/z80 retro computer emulator with a modular Rust core, WASM frontend, and future support for embedded targets.


## Project Overview

- **Core:** Modular Rust crates for CPU emulation (`emucore`, `cpu_i8080`, `cpu_z80`).
- **Frontend:** React + Vite webapp using Rust WASM via `wasm-bindgen`.
- **WASM Interface:** Thin Rust crate (`wasm_export`) exposes the emulator to JS as a class-based API.
- **Future Direction:** Core crates are being refactored for full `no_std` compatibility, enabling embedded targets (microcontrollers, bare metal, etc.).

## Building and Running the Webapp

### Prerequisites
- Rust (with wasm-pack)
- Node.js and npm


### 1. Build the Rust WASM module

From the project root, run:

```bash
wasm-pack build ./rustwasm/wasm_export --target web
```

This will generate the WASM package in `rustwasm/wasm_export/pkg`.

### 2. Install JS dependencies

```bash
npm install
```



### 3. Clean the build output (optional)

```bash
npm run clean
```


### 4. Build the production webapp

```bash
npm run build
```
The production-ready files will be in the `dist/` directory.


### 5. Run the production server for testing

```bash
npm run serve
```
This will serve the `dist/` directory at http://localhost:4173 (default).


### 6. Run the development server (hot reload)

```bash
npm run dev
```


## Architecture Notes

- The Rust core is designed for portability and future embedded use. WASM-specific code is isolated in the `wasm_export` crate.
- The frontend currently interacts with the emulator via a compatibility/message-passing layer, maintaining legacy patterns for now.
- Direct method calls on the Rust WASM API (Emulator instance) are planned for a future refactor, which will further simplify and modernize the integration.
- Legacy Go WASM code has been fully removed.

## Future Plans

- Refactor core crates for full `no_std` support.
- Add more peripherals as modular Rust crates.
- Support for embedded targets and desktop builds.
This will serve the app with hot reload at http://localhost:3000 (default).
