import { Terminal } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';

window.addEventListener('DOMContentLoaded', () => {
  const term = new Terminal({
    cols: 80,
    rows: 25,
    cursorBlink: true
  });
  const container = document.querySelector('.terminal .inner');
  if (container) {
    term.open(container);

    // Header row: 0-9 repeated across 80 columns (first cell blank for row labels)
    let header = ' ';
    for (let col = 0; col < 79; col++) {
      header += (col % 10).toString();
    }
    term.write(header + '\r\n');

    // Fill the terminal with a visible pattern and left row numbers
    for (let row = 1; row < 25; row++) {
      let line = (row % 10).toString();
      for (let col = 1; col < 80; col++) {
        line += String.fromCharCode(65 + ((col - 1) % 26)); // A-Z
      }
      term.write(line + '\r\n');
    }
  } else {
    console.error('Terminal container element not found!');
  }
});
