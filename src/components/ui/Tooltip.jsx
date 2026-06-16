import React, { useRef, useEffect } from 'react';
import { useColorMode } from '../../theme/ThemeContext';

// ── Global singleton portal ──────────────────────────────────────────────────
let _portal = null;
let _hideTimer = null;
let _showTimer = null;
let _targetEl = null;

function getPortal() {
  if (!_portal) {
    const div = document.createElement('div');
    div.style.cssText = [
      'position:fixed',
      'z-index:2147483647',
      'pointer-events:none',
      'padding:6px 12px',
      'border-radius:8px',
      'font-size:0.75rem',
      'font-weight:500',
      'max-width:280px',
      'line-height:1.55',
      'white-space:pre-line',
      'font-family:inherit',
      'display:none',
      'transition:opacity 0.12s ease',
    ].join(';');
    document.body.appendChild(div);
    _portal = div;
  }
  return _portal;
}

// ── Tooltip component ─────────────────────────────────────────────────────────
function hidePortal() {
  clearTimeout(_showTimer);
  clearTimeout(_hideTimer);
  const div = getPortal();
  div.style.opacity = '0';
  setTimeout(() => { div.style.display = 'none'; div.style.opacity = '1'; }, 120);
  _targetEl = null;
}

export default function Tooltip({ content, children, delay = 120 }) {
  const { isDarkMode, selectedAccent } = useColorMode();

  const isDarkRef  = useRef(isDarkMode);
  const accentRef  = useRef(selectedAccent?.primary || '#1a237e');
  isDarkRef.current = isDarkMode;
  accentRef.current = selectedAccent?.primary || '#1a237e';

  const contentRef = useRef(content);
  contentRef.current = content;

  const elemRef = useRef(null);

  useEffect(() => () => {
    // If this element was the active tooltip trigger, hide it on unmount
    if (_targetEl && _targetEl === elemRef.current) hidePortal();
    else { clearTimeout(_showTimer); clearTimeout(_hideTimer); }
  }, []);

  if (!content) return children;

  const child = React.cloneElement(React.Children.only(children), {
    onMouseEnter: (e) => {
      clearTimeout(_showTimer);
      clearTimeout(_hideTimer);

      _targetEl = e.currentTarget;
      elemRef.current = e.currentTarget;

      _showTimer = setTimeout(() => {
        const text = contentRef.current;
        if (!text || typeof text !== 'string' || !_targetEl) return;

        const dark   = isDarkRef.current;
        const accent = accentRef.current;
        const div    = getPortal();

        div.textContent      = text;
        div.style.background = dark ? '#1e293b' : '#ffffff';
        div.style.color      = dark ? '#e2e8f0' : '#1e293b';
        div.style.border     = `1px solid ${accent}55`;
        div.style.boxShadow  = `0 4px 24px rgba(0,0,0,0.22),0 0 0 1px ${accent}22`;

        // Measure tooltip size before positioning
        div.style.opacity    = '1';
        div.style.display    = 'block';
        div.style.visibility = 'hidden';

        const anchor  = _targetEl.getBoundingClientRect();
        const tipRect = div.getBoundingClientRect();

        // Center below element; flip above if too close to bottom
        let left = anchor.left + anchor.width / 2 - tipRect.width / 2;
        let top  = anchor.bottom + 8;

        if (top + tipRect.height > window.innerHeight - 8) {
          top = anchor.top - tipRect.height - 8;
        }
        if (left < 8) left = 8;
        if (left + tipRect.width > window.innerWidth - 8) {
          left = window.innerWidth - tipRect.width - 8;
        }

        div.style.left       = `${left}px`;
        div.style.top        = `${top}px`;
        div.style.visibility = 'visible';

        div.style.animation = 'none';
        void div.offsetHeight;
        div.style.animation = 'srTooltipIn 0.12s ease-out';
      }, delay);

      children.props.onMouseEnter?.(e);
    },

    onClick: (e) => {
      hidePortal();
      children.props.onClick?.(e);
    },

    onMouseLeave: (e) => {
      clearTimeout(_showTimer);
      clearTimeout(_hideTimer);
      _hideTimer = setTimeout(() => {
        const div = getPortal();
        div.style.opacity = '0';
        setTimeout(() => { div.style.display = 'none'; div.style.opacity = '1'; }, 120);
      }, 80);
      children.props.onMouseLeave?.(e);
    },

    title: undefined,
  });

  return child;
}
