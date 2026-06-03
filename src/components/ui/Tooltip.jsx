import React, { useRef, useEffect, useCallback } from 'react';
import { useColorMode } from '../../theme/ThemeContext';

// Zero-useState tooltip — all show/hide/move via direct DOM manipulation.
// Mouse events never call setState → no React re-renders on hover/move → no flicker.
export default function Tooltip({ content, children, delay = 120 }) {
  const { isDarkMode, selectedAccent } = useColorMode();

  // Sync theme to refs each render so event handlers always read current values
  const isDarkRef  = useRef(isDarkMode);
  const accentRef  = useRef(selectedAccent?.primary || '#1a237e');
  isDarkRef.current = isDarkMode;
  accentRef.current = selectedAccent?.primary || '#1a237e';

  const portalRef  = useRef(null);
  const timerRef   = useRef(null);
  const visibleRef = useRef(false);

  const getOrCreatePortal = useCallback(() => {
    if (!portalRef.current) {
      const div = document.createElement('div');
      div.style.cssText = 'position:fixed;z-index:2147483647;pointer-events:none;padding:6px 12px;border-radius:8px;font-size:0.75rem;font-weight:500;max-width:280px;line-height:1.55;white-space:pre-line;font-family:inherit;display:none';
      document.body.appendChild(div);
      portalRef.current = div;
    }
    return portalRef.current;
  }, []);

  const showTooltip = useCallback((x, y) => {
    if (!content || typeof content !== 'string') return;
    const dark   = isDarkRef.current;
    const accent = accentRef.current;
    const div    = getOrCreatePortal();
    div.textContent      = content;
    div.style.background = dark ? '#1e293b' : '#ffffff';
    div.style.color      = dark ? '#e2e8f0' : '#1e293b';
    div.style.border     = `1px solid ${accent}55`;
    div.style.boxShadow  = `0 4px 24px rgba(0,0,0,0.22),0 0 0 1px ${accent}22`;
    const left = x + 14 > window.innerWidth  - 240 ? x - 250 : x + 14;
    const top  = y + 36 > window.innerHeight - 20  ? y - 46  : y + 20;
    div.style.left      = `${left}px`;
    div.style.top       = `${top}px`;
    div.style.display   = 'block';
    div.style.animation = 'srTooltipIn 0.12s ease-out';
    visibleRef.current  = true;
  }, [content, getOrCreatePortal]);

  const hideTooltip = useCallback(() => {
    clearTimeout(timerRef.current);
    if (portalRef.current) portalRef.current.style.display = 'none';
    visibleRef.current = false;
  }, []);

  const updatePosition = useCallback((x, y) => {
    if (!visibleRef.current || !portalRef.current) return;
    const left = x + 14 > window.innerWidth  - 240 ? x - 250 : x + 14;
    const top  = y + 36 > window.innerHeight - 20  ? y - 46  : y + 20;
    portalRef.current.style.left = `${left}px`;
    portalRef.current.style.top  = `${top}px`;
  }, []);

  // Remove the portal div from document.body on unmount
  useEffect(() => () => {
    clearTimeout(timerRef.current);
    if (portalRef.current) { portalRef.current.remove(); portalRef.current = null; }
  }, []);

  if (!content) return children;

  const child = React.cloneElement(React.Children.only(children), {
    onMouseEnter: (e) => {
      clearTimeout(timerRef.current);
      const x = e.clientX, y = e.clientY;
      timerRef.current = setTimeout(() => showTooltip(x, y), delay);
      children.props.onMouseEnter?.(e);
    },
    onMouseLeave: (e) => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(hideTooltip, 80);
      children.props.onMouseLeave?.(e);
    },
    onMouseMove: (e) => {
      updatePosition(e.clientX, e.clientY);
      children.props.onMouseMove?.(e);
    },
    title: undefined,
  });

  // Return child directly — portal div lives on document.body, not in React tree
  return child;
}
