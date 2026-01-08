import React, { useEffect, useRef } from 'react';
import Terminal from './components/Terminal';
import init, { Emulator } from '../rustwasm/wasm_export/pkg/wasm_export.js';

export default function App() {
  const terminalRef = useRef(null);

  useEffect(() => {
    const isDev = import.meta.env.MODE === 'development';
    function log(...args) {
      if (isDev) console.log('[retrojs]', ...args);
    }
    function warn(...args) {
      if (isDev) console.warn('[retrojs]', ...args);
    }
    function error(...args) {
      console.error('[retrojs]', ...args);
    }


    window.retrojs = window.retrojs || {};
    window.retrojs.terminalWrite = function (text) {
      log('terminalWrite:', text);
      if (terminalRef.current) terminalRef.current.write(text);
    };

    // Emulator instance will be created after WASM loads
    let emulatorInstance = null;
    window.retrojs.emulator = null;

    // Example config, should be replaced with real config as needed
    const defaultConfig = JSON.stringify({
      machine_type: 'example',
      cpu: 'i8080',
      ram: 0x10000,
      peripherals: [],
      front_panel: false,
    });

    window.retrojs.sendToRust = async function (msgType, payload) {
      log('sendToRust:', msgType, payload);
      if (!emulatorInstance) {
        warn('Emulator not initialized');
        return;
      }
      try {
        switch (msgType) {
          case 'defineMachine': {
            // Re-create emulator with new config
            emulatorInstance = new Emulator(payload);
            window.retrojs.emulator = emulatorInstance;
            window.retrojs.receiveFromRust && window.retrojs.receiveFromRust('machineStatus', 'ok');
            break;
          }
          case 'setDebug': {
            emulatorInstance.set_debug(payload === 'on');
            window.retrojs.receiveFromRust && window.retrojs.receiveFromRust('debugStatus', payload);
            break;
          }
          case 'memoryRead': {
            const req = JSON.parse(payload);
            const value = emulatorInstance.memory_read(req.addr);
            const msg = JSON.stringify({ addr: req.addr, value });
            window.retrojs.receiveFromRust && window.retrojs.receiveFromRust('memoryReadResult', msg);
            break;
          }
          case 'memoryWrite': {
            const req = JSON.parse(payload);
            emulatorInstance.memory_write(req.addr, req.value);
            if (emulatorInstance.debug_enabled) {
              const msg = JSON.stringify({ addr: req.addr, value: req.value });
              window.retrojs.receiveFromRust && window.retrojs.receiveFromRust('memoryWrite', msg);
            }
            break;
          }
          case 'registersRead': {
            const regs = emulatorInstance.registers_read();
            window.retrojs.receiveFromRust && window.retrojs.receiveFromRust('registers', JSON.stringify(regs));
            break;
          }
          case 'registersWrite': {
            emulatorInstance.registers_write(JSON.parse(payload));
            break;
          }
          case 'consoleIn': {
            // For now, just echo to output
            window.retrojs.receiveFromRust && window.retrojs.receiveFromRust('consoleOut', payload);
            break;
          }
          default:
            warn('Unknown message to Rust:', msgType, payload);
        }
      } catch (e) {
        error('Error in sendToRust:', e);
      }
    };

    window.retrojs.receiveFromRust = function (msgType, payload) {
      log('receiveFromRust:', msgType, payload);
      switch (msgType) {
        case 'consoleOut':
          window.retrojs.terminalWrite(payload);
          break;
        case 'machineStatus':
          log('Machine status:', payload);
          break;
        case 'diskRead':
          break;
        case 'diskWrite':
          break;
        default:
          warn('Unknown message from Rust:', msgType, payload);
      }
    };

    async function startRustWasm() {
      try {
        await init();
        emulatorInstance = new Emulator(defaultConfig);
        window.retrojs.emulator = emulatorInstance;
        log('Rust WASM loaded and Emulator instance created');
        // Output test pattern to terminal on startup
        if (window.retrojs.receiveFromRust && emulatorInstance.send_test_pattern) {
          const pattern = emulatorInstance.send_test_pattern();
          window.retrojs.receiveFromRust('consoleOut', pattern);
        }
      } catch (e) {
        error('Rust WASM load failed:', e);
      }
    }
    setTimeout(startRustWasm, 0);
  }, []);

  const handleData = data => {
    window.retrojs.sendToRust && window.retrojs.sendToRust('consoleIn', data);
  };

  return <Terminal ref={terminalRef} onData={handleData} />;
}
