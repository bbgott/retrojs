import { Terminal } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';


// --- JS<->Go message passing framework ---
window.retrojs_receiveFromGo = function(msgType, payload) {
  switch (msgType) {
    case 'consoleOut':
      retrojs.terminalWrite(payload);
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

window.retrojs = {
  term: null,
  terminalWrite: function(text) {
    if (this.term) {
      this.term.write(text);
    }
  },
  sendToGo: function(msgType, payload) {
    if (typeof window.retrojs_sendToGo === 'function') {
      window.retrojs_sendToGo(msgType, payload);
    }
  }
};

window.addEventListener('DOMContentLoaded', () => {
  const term = new Terminal({
    cols: 80,
    rows: 25,
    cursorBlink: true
  });
  window.retrojs.term = term;
  const container = document.querySelector('.terminal .inner');
  if (container) {
    term.open(container);
    // Handle user input and send to Go
    term.onData(data => {
      window.retrojs.sendToGo('consoleIn', data);
    });
  } else {
    console.error('Terminal container element not found!');
  }
});
