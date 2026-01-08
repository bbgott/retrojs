import React, { useEffect, useRef } from 'react';
import Terminal from './components/Terminal';

export default function App() {
  const terminalRef = useRef(null);

  // WASM and message-passing logic
  useEffect(() => {
    // Logging utility
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

    // JS<->Go message passing
    window.retrojs = window.retrojs || {};
    window.retrojs.terminalWrite = function (text) {
      log('terminalWrite:', text);
      if (terminalRef.current) terminalRef.current.write(text);
    };
    window.retrojs.sendToGo = function (msgType, payload) {
      log('sendToGo:', msgType, payload);
      if (typeof window.retrojs_sendToGo === 'function') {
        window.retrojs_sendToGo(msgType, payload);
      } else {
        warn('retrojs_sendToGo is not a function');
      }
    };
    window.retrojs_receiveFromGo = function (msgType, payload) {
      log('receiveFromGo:', msgType, payload);
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
          warn('Unknown message from Go:', msgType, payload);
      }
    };

    // Start Go WASM after everything is ready
    let go, goInstance;
    function startWasm() {
      const wasmUrl = isDev ? `main.wasm?v=${Date.now()}` : 'main.wasm';
      if (typeof Go !== 'undefined') {
        go = new Go();
        if ('instantiateStreaming' in WebAssembly) {
          WebAssembly.instantiateStreaming(fetch(wasmUrl), go.importObject).then(result => {
            log('WASM loaded via instantiateStreaming');
            goInstance = go.run(result.instance);
          }).catch(e => error('WASM instantiateStreaming failed:', e));
        } else {
          fetch(wasmUrl).then(response => response.arrayBuffer()).then(bytes => {
            WebAssembly.instantiate(bytes, go.importObject).then(result => {
              log('WASM loaded via instantiate');
              goInstance = go.run(result.instance);
            }).catch(e => error('WASM instantiate failed:', e));
          }).catch(e => error('Fetching main.wasm failed:', e));
        }
      } else {
        error('Go WASM runtime (wasm_exec.js) not loaded!');
      }
    }

    // Ensure message-passing is set up before WASM starts
    setTimeout(startWasm, 0);
    // No cleanup for WASM needed
  }, []);

  // Pass onData handler to Terminal for input
  const handleData = data => {
    window.retrojs.sendToGo && window.retrojs.sendToGo('consoleIn', data);
  };

  return <Terminal ref={terminalRef} onData={handleData} />;
}
