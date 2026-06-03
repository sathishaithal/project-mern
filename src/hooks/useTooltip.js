import { useEffect, useRef } from 'react';

// Attach a themed tooltip to any element via ref — use this when wrapping
// with <Tooltip> is not practical (e.g. elements inside <tr>, canvas, third-party).
// Note: uses a fixed dark background; for full accent-color theming use <Tooltip> instead.
export function useTooltip(text, { delay = 120 } = {}) {
  const ref      = useRef(null);
  const timerRef = useRef(null);
  const divRef   = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !text) return;

    el.removeAttribute('title');

    const show = (e) => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        const div = document.createElement('div');
        div.className = 'global-tooltip-card';
        div.textContent = text;
        div.style.cssText = `
          position:fixed; z-index:2147483647; pointer-events:none;
          left:${e.clientX + 12}px; top:${e.clientY - 40}px;
          background:#1e293b; color:#e2e8f0;
          padding:6px 10px; border-radius:8px; font-size:0.75rem;
          box-shadow:0 4px 20px rgba(0,0,0,0.25);
          animation:srTooltipIn 0.12s ease-out;
          max-width:260px; line-height:1.5; white-space:pre-line;
        `;
        document.body.appendChild(div);
        divRef.current = div;
      }, delay);
    };

    const move = (e) => {
      if (divRef.current) {
        divRef.current.style.left = `${e.clientX + 12}px`;
        divRef.current.style.top  = `${e.clientY - 40}px`;
      }
    };

    const hide = () => {
      clearTimeout(timerRef.current);
      if (divRef.current) { divRef.current.remove(); divRef.current = null; }
    };

    el.addEventListener('mouseenter', show);
    el.addEventListener('mousemove',  move);
    el.addEventListener('mouseleave', hide);
    return () => {
      el.removeEventListener('mouseenter', show);
      el.removeEventListener('mousemove',  move);
      el.removeEventListener('mouseleave', hide);
      hide();
    };
  }, [text, delay]);

  return ref;
}
