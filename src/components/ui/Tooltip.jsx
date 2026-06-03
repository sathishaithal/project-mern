import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useColorMode } from '../../theme/ThemeContext';

export default function Tooltip({ content, children, delay = 120 }) {
  const { isDarkMode, selectedAccent } = useColorMode();
  const accent  = selectedAccent?.primary || '#1a237e';
  const [show, setShow] = useState(false);
  const [pos,  setPos]  = useState({ x: 0, y: 0 });
  const timerRef        = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const handleEnter = useCallback((e) => {
    clearTimeout(timerRef.current);
    setPos({ x: e.clientX, y: e.clientY });
    timerRef.current = setTimeout(() => setShow(true), delay);
  }, [delay]);

  const handleLeave = useCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setShow(false), 80);
  }, []);

  const handleMove = useCallback((e) => {
    setPos({ x: e.clientX, y: e.clientY });
  }, []);

  if (!content) return children;

  const left = pos.x + 14 > window.innerWidth  - 240 ? pos.x - 250 : pos.x + 14;
  const top  = pos.y + 36 > window.innerHeight - 20  ? pos.y - 46  : pos.y + 20;

  const child = React.cloneElement(React.Children.only(children), {
    onMouseEnter: handleEnter,
    onMouseLeave: handleLeave,
    onMouseMove:  handleMove,
    title: undefined,
  });

  const tooltipEl = show && content
    ? ReactDOM.createPortal(
        <div
          style={{
            position: 'fixed',
            left,
            top,
            zIndex: 2147483647,
            pointerEvents: 'none',
            background: isDarkMode ? '#1e293b' : '#ffffff',
            border: `1px solid ${accent}55`,
            borderRadius: 8,
            boxShadow: `0 4px 24px rgba(0,0,0,0.22), 0 0 0 1px ${accent}22`,
            padding: '6px 12px',
            fontSize: '0.75rem',
            fontWeight: 500,
            color: isDarkMode ? '#e2e8f0' : '#1e293b',
            maxWidth: 280,
            lineHeight: 1.55,
            animation: 'srTooltipIn 0.12s ease-out',
            fontFamily: 'inherit',
            whiteSpace: typeof content === 'string' ? 'pre-line' : 'normal',
          }}
        >
          {typeof content === 'string' ? <span>{content}</span> : content}
        </div>,
        document.body
      )
    : null;

  return (
    <>
      {child}
      {tooltipEl}
    </>
  );
}
