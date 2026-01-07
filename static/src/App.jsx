import React, { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { WebFontsAddon, loadFonts } from '@xterm/addon-web-fonts';
import '@xterm/xterm/css/xterm.css';
import '@fontsource/vt323';

export default function App() {
  const terminalRef = useRef(null);

  useEffect(() => {
    let term;
    let webFontsAddon;
    let go;
    let goInstance;
    let wasmLoaded = false;

    async function setupTerminalAndWasm() {
      let fontFamily = 'VT323, monospace';
      try {
        await loadFonts(['VT323']);
      } catch (e) {
        fontFamily = 'monospace';
      }
      term = new Terminal({
        cols: 80,
        rows: 25,
        cursorBlink: true,
        fontFamily,
        theme: {
          foreground: '#39FF14',
          cursor: '#39FF14',
          cursorAccent: '#181a1b'
        },
        scrollback: 0
      });
      webFontsAddon = new WebFontsAddon();
      term.loadAddon(webFontsAddon);
      term.open(terminalRef.current);
      window.retrojs = window.retrojs || {};
      window.retrojs.term = term;
      term.onData(data => {
        window.retrojs.sendToGo && window.retrojs.sendToGo('consoleIn', data);
      });

      // JS<->Go message passing
      window.retrojs.terminalWrite = function (text) {
        if (term) term.write(text);
      };
      window.retrojs.sendToGo = function (msgType, payload) {
        if (typeof window.retrojs_sendToGo === 'function') {
          window.retrojs_sendToGo(msgType, payload);
        }
      };
      window.retrojs_receiveFromGo = function (msgType, payload) {
        switch (msgType) {
          case 'consoleOut':
            window.retrojs.terminalWrite(payload);
            break;
          case 'machineStatus':
            console.log('Machine status:', payload);
            break;
          case 'diskRead':
            break;
          case 'diskWrite':
            break;
          default:
            console.warn('Unknown message from Go:', msgType, payload);
        }
      };

      // Start Go WASM after everything is ready
      if (typeof Go !== 'undefined') {
        go = new Go();
        if ('instantiateStreaming' in WebAssembly) {
          const result = await WebAssembly.instantiateStreaming(fetch('main.wasm'), go.importObject);
          goInstance = go.run(result.instance);
        } else {
          const response = await fetch('main.wasm');
          const bytes = await response.arrayBuffer();
          const result = await WebAssembly.instantiate(bytes, go.importObject);
          goInstance = go.run(result.instance);
        }
        wasmLoaded = true;
      } else {
        console.error('Go WASM runtime (wasm_exec.js) not loaded!');
      }
    }

    setupTerminalAndWasm();
    return () => {
      if (term) term.dispose();
      // No need to clean up WASM for now
    };
  }, []);

  return (
    <div className="terminal" id="terminal">
      <div className="inner" ref={terminalRef}></div>
    </div>
  );
}
