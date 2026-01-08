import React, { useEffect, useRef } from 'react';
import Terminal from './components/Terminal';
import init, { retrojs_send_to_rust, send_test_pattern } from '../rustwasm/wasm_export/pkg/wasm_export.js';

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

    window.retrojs.sendToRust = function (msgType, payload) {
      log('sendToRust:', msgType, payload);
      retrojs_send_to_rust(msgType, payload);
    };

    // Define receiveFromRust before WASM init
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
        if (send_test_pattern) send_test_pattern();
        log('Rust WASM loaded');
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
