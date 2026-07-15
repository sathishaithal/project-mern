import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';

const ALL_IMAGES = [
  'ChatGPT Image Mar 3, 2026, 05_33_21 PM.png',
  'ChatGPT Image Mar 3, 2026, 05_35_58 PM.png',
  'ChatGPT Image Mar 3, 2026, 05_38_36 PM.png',
  'ChatGPT Image Mar 3, 2026, 05_40_33 PM.png',
  'ChatGPT Image Mar 5, 2026, 10_46_52 AM.png',
  'ChatGPT Image Mar 5, 2026, 11_08_11 AM.png',
  'Flours-01.png',
  'Flours-04.png',
  'Flours-07.png',
  'Spices-01.png',
  'Spices-06.png',
  'Spices-11.png',
  'Ricee-01.png',
  'Ricee-06.png',
  'Ricee-12.png',
  'Dry Fruits-01.png',
  'OIL 3D POUCH 500ml.png',
  'bengal gram.png',
  'fried gram.png',
  'Product Image-04.jpg',
];

// Daily seeded Fisher-Yates — same order all day, new order each day
function seededShuffle(arr, seed) {
  let s = seed >>> 0;
  const rng = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s; };
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rng() % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function slotProps(offset) {
  const abs = Math.abs(offset);
  return {
    rotateY:   -offset * 30,
    scale:     abs === 0 ? 1 : abs === 1 ? 0.84 : 0.68,
    opacity:   abs === 0 ? 1 : abs === 1 ? 0.82 : 0.38,
    zIndex:    abs === 0 ? 6 : abs === 1 ? 3 : 1,
    dimAmount: abs === 0 ? 0 : abs === 1 ? 0.22 : 0.48,
  };
}

const OFFSETS   = [-2, -1, 0, 1, 2];
const CARD_H    = 310;
const ACCENT    = '#2563eb';
const ACCENT2   = '#1e40af';
const SLIDE_MS  = 4200;
const TICK_MS   = 40;
const FILL_INC  = 100 / (SLIDE_MS / TICK_MS); // percent per tick

export default function ProductCarousel() {
  const containerRef = useRef(null);
  const [cw, setCw]  = useState(900);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setCw(e.contentRect.width));
    ro.observe(el);
    setCw(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const seed = useMemo(() => {
    const d = new Date();
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  }, []);
  const images = useMemo(() => seededShuffle(ALL_IMAGES, seed), [seed]);
  const n = images.length;

  const [idx,     setIdx]     = useState(0);
  const [paused,  setPaused]  = useState(false);
  const [fillPct, setFillPct] = useState(0);

  const fillRef    = useRef(null);
  const fillPctRef = useRef(0);
  const pausedRef  = useRef(false);

  useEffect(() => { pausedRef.current = paused; }, [paused]);

  // Fill interval drives both the bar animation and slide advance
  const startFill = useCallback(() => {
    clearInterval(fillRef.current);
    fillPctRef.current = 0;
    setFillPct(0);
    fillRef.current = setInterval(() => {
      if (pausedRef.current) return;
      fillPctRef.current += FILL_INC;
      if (fillPctRef.current >= 100) {
        clearInterval(fillRef.current);
        setFillPct(100);
        setIdx(i => (i + 1) % n);
      } else {
        setFillPct(fillPctRef.current);
      }
    }, TICK_MS);
  }, [n]);

  // Restart fill whenever slide changes
  useEffect(() => {
    startFill();
    return () => clearInterval(fillRef.current);
  }, [idx, startFill]);

  const goTo = useCallback((newIdx) => {
    setIdx(((newIdx % n) + n) % n);
  }, [n]);

  const cardW = Math.min(cw * 0.60, 680);
  const step  = Math.min(cw * 0.50, 550);

  const visible = OFFSETS.map(offset => {
    const imgIdx = ((idx + offset) % n + n) % n;
    return { offset, imgIdx, src: `/products/${encodeURIComponent(images[imgIdx])}` };
  });

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', width: '100%', height: CARD_H + 20, marginBottom: 24 }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Ambient glow */}
      <motion.div
        animate={{ background: `radial-gradient(ellipse 80% 110% at 50% 48%, ${ACCENT}18, transparent 68%)` }}
        transition={{ duration: 0.8 }}
        style={{ position: 'absolute', inset: 0, borderRadius: 24, pointerEvents: 'none' }}
      />

      {/* 3D stage */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: CARD_H,
        perspective: '1100px',
        overflow: 'hidden',
      }}>
        {visible.map(({ offset, imgIdx, src }) => {
          const sp = slotProps(offset);
          return (
            <motion.div
              key={imgIdx}
              animate={{ x: offset * step, rotateY: sp.rotateY, scale: sp.scale, opacity: sp.opacity }}
              transition={{ duration: 0.62, ease: [0.25, 0.46, 0.45, 0.94] }}
              initial={false}
              onClick={() => offset !== 0 && goTo(imgIdx)}
              style={{
                position:       'absolute',
                top:            0,
                left:           '50%',
                marginLeft:     -(cardW / 2),
                width:          cardW,
                height:         CARD_H,
                borderRadius:   18,
                overflow:       'hidden',
                cursor:         offset !== 0 ? 'pointer' : 'default',
                transformStyle: 'preserve-3d',
                zIndex:         sp.zIndex,
                boxShadow:      offset === 0
                  ? `0 0 55px ${ACCENT}45, 0 16px 48px rgba(0,0,0,0.45)`
                  : '0 4px 22px rgba(0,0,0,0.30)',
              }}
            >
              {/* Blurred background — fills letterbox for portrait images */}
              <img
                src={src}
                alt=""
                draggable={false}
                aria-hidden
                style={{
                  position: 'absolute', inset: 0,
                  width: '100%', height: '100%',
                  objectFit: 'cover',
                  filter: `blur(22px) brightness(${offset === 0 ? 0.45 : 0.3})`,
                  transform: 'scale(1.1)',
                  pointerEvents: 'none',
                }}
              />

              {/* Main image — fully contained, never cropped */}
              <img
                src={src}
                alt=""
                draggable={false}
                style={{
                  position: 'relative', zIndex: 1,
                  width: '100%', height: '100%',
                  objectFit: 'contain',
                  display: 'block',
                  pointerEvents: 'none',
                }}
              />

              {/* Dim overlay for side cards */}
              {sp.dimAmount > 0 && (
                <div style={{
                  position: 'absolute', inset: 0, zIndex: 2,
                  background: `rgba(0,0,0,${sp.dimAmount})`,
                  borderRadius: 18,
                  pointerEvents: 'none',
                }} />
              )}

              {/* Animated glow border on centre card */}
              {offset === 0 && (
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                  style={{
                    position: 'absolute', inset: 0, zIndex: 3,
                    borderRadius: 18,
                    border: `2.5px solid ${ACCENT}`,
                    boxShadow: `inset 0 0 30px ${ACCENT}28`,
                    pointerEvents: 'none',
                  }}
                />
              )}

              {/* Corner shimmer on centre card */}
              {offset === 0 && (
                <motion.div
                  animate={{ opacity: [0.25, 0.65, 0.25] }}
                  transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay: 1.3 }}
                  style={{
                    position: 'absolute', inset: 0, zIndex: 3,
                    borderRadius: 18,
                    background: `linear-gradient(135deg, ${ACCENT}22 0%, transparent 38%, transparent 62%, ${ACCENT2}22 100%)`,
                    pointerEvents: 'none',
                  }}
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Left arrow */}
      <motion.button
        whileHover={{ scale: 1.12, boxShadow: `0 0 18px ${ACCENT}55` }}
        whileTap={{ scale: 0.93 }}
        onClick={() => goTo(idx - 1)}
        style={arrowStyle('left', CARD_H)}
      >
        <i className="bi bi-chevron-left" style={{ fontSize: '1rem' }} />
      </motion.button>

      {/* Right arrow */}
      <motion.button
        whileHover={{ scale: 1.12, boxShadow: `0 0 18px ${ACCENT}55` }}
        whileTap={{ scale: 0.93 }}
        onClick={() => goTo(idx + 1)}
        style={arrowStyle('right', CARD_H)}
      >
        <i className="bi bi-chevron-right" style={{ fontSize: '1rem' }} />
      </motion.button>

      {/* Stories bars indicator */}
      <div style={{
        position: 'absolute',
        bottom: 6,
        left: 24,
        right: 24,
        display: 'flex',
        gap: 3,
        zIndex: 20,
        alignItems: 'center',
      }}>
        {images.map((_, i) => (
          <div
            key={i}
            onClick={() => goTo(i)}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 2,
              background: 'rgba(37,99,235,0.15)',
              overflow: 'hidden',
              cursor: 'pointer',
            }}
          >
            <div style={{
              height: '100%',
              background: ACCENT,
              borderRadius: 2,
              width: i < idx ? '100%' : i === idx ? `${fillPct}%` : '0%',
            }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function arrowStyle(side, cardH) {
  return {
    position:       'absolute',
    [side]:         14,
    top:            cardH / 2,
    y:              '-50%',
    zIndex:         20,
    width:          40,
    height:         40,
    borderRadius:   '50%',
    border:         '1.5px solid rgba(148,163,184,0.3)',
    background:     'rgba(255,255,255,0.92)',
    color:          ACCENT,
    cursor:         'pointer',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    boxShadow:      '0 2px 14px rgba(0,0,0,0.22)',
    backdropFilter: 'blur(8px)',
    padding:        0,
  };
}
