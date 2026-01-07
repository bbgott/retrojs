import { Terminal } from '@xterm/xterm';
import { WebFontsAddon, loadFonts } from '@xterm/addon-web-fonts';
import '@xterm/xterm/css/xterm.css';
import '@fontsource/vt323';

window.retrojs = {
  term: null,
  terminalWrite: function (text) {
    if (this.term) {
      this.term.write(text);
    }
  },
  sendToGo: function (msgType, payload) {
    if (typeof window.retrojs_sendToGo === 'function') {
      window.retrojs_sendToGo(msgType, payload);
    }
  }
};

// --- JS<->Go message passing framework ---
window.retrojs_receiveFromGo = function (msgType, payload) {
  switch (msgType) {
    case 'consoleOut':
      window.retrojs.terminalWrite(payload);
      break;
    case 'machineStatus':
      // Handle machine status (ok/error)
      console.log('Machine status:', payload);
      break;
    case 'diskRead':
      // Future: handle disk read
      break;
    case 'diskWrite':
      // Future: handle disk write
      break;
    default:
      console.warn('Unknown message from Go:', msgType, payload);
  }
};

window.addEventListener('DOMContentLoaded', async () => {
  // 1. Load VT323 font
  let fontFamily = 'VT323, monospace';
  try {
    await loadFonts(['VT323']);
  } catch (e) {
    fontFamily = 'monospace';
  }

  // 2. Setup xterm.js
  const term = new Terminal({
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
  const webFontsAddon = new WebFontsAddon();
  term.loadAddon(webFontsAddon);
  window.retrojs.term = term;
  const container = document.querySelector('.terminal .inner');
  if (container) {
    term.open(container);
    term.onData(data => {
      window.retrojs.sendToGo('consoleIn', data);
    });
  } else {
    console.error('Terminal container element not found!');
  }

  // 3. Start Go WASM after everything is ready
  if (typeof Go !== 'undefined') {
    const go = new Go();
    if ('instantiateStreaming' in WebAssembly) {
      const result = await WebAssembly.instantiateStreaming(fetch('main.wasm'), go.importObject);
      go.run(result.instance);
    } else {
      const response = await fetch('main.wasm');
      const bytes = await response.arrayBuffer();
      const result = await WebAssembly.instantiate(bytes, go.importObject);
      go.run(result.instance);
    }
  } else {
    console.error('Go WASM runtime (wasm_exec.js) not loaded!');
  }
});