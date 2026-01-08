import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { WebFontsAddon, loadFonts } from '@xterm/addon-web-fonts';
import '@xterm/xterm/css/xterm.css';
import '@fontsource/vt323';

const Terminal = forwardRef(function Terminal(props, ref) {
  const containerRef = useRef(null);
  const termRef = useRef(null);
  const outputBuffer = useRef([]);

  useImperativeHandle(ref, () => ({
    write: (text) => {
      console.log('[Terminal] write called with:', text);
      if (termRef.current) {
        termRef.current.write(text);
      } else {
        // Buffer output until terminal is ready
        outputBuffer.current.push(text);
      }
    },
    focus: () => {
      if (termRef.current) {
        termRef.current.focus();
      }
    }
  }), []);

  useEffect(() => {
    let term;
    let webFontsAddon;
    let disposed = false;

    async function setupTerminal() {
      let fontFamily = 'VT323, monospace';
      try {
        await loadFonts(['VT323']);
      } catch (e) {
        fontFamily = 'monospace';
      }
      term = new XTerm({
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
      term.open(containerRef.current);
      termRef.current = term;
      // Flush output buffer
      if (outputBuffer.current.length > 0) {
        outputBuffer.current.forEach(text => {
          term.write(text);
        });
        outputBuffer.current = [];
      }
      if (props.onData) {
        term.onData(props.onData);
      }
    }

    setupTerminal();
    return () => {
      disposed = true;
      console.log('[Terminal] cleanup: disposing terminal');
      if (term) term.dispose();
    };
  }, [props.onData]);

  return (
    <div className="terminal" id="terminal">
      <div className="inner" ref={containerRef}></div>
    </div>
  );
});

export default Terminal;
