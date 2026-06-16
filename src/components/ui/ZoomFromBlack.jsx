import React from 'react';
import { motion } from 'framer-motion';
import { useColorMode } from '../../theme/ThemeContext';
import bhagyaLogo from '../../assets/bhagya.png';

export default function ZoomFromBlack({ holdMs = 1400 }) {
  const { selectedAccent } = useColorMode();
  const accent = selectedAccent?.primary || '#2563eb';

  return (
    <motion.div
      initial={{ scale: 1, opacity: 1 }}
      animate={{ scale: 1.45, opacity: 0 }}
      transition={{ delay: holdMs / 1000, duration: 0.75, ease: [0.55, 0, 1, 0.4] }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'radial-gradient(ellipse at center, #141e3a 0%, #080d1e 55%, #000 100%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Ambient glow */}
      <motion.div
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.12, duration: 0.65 }}
        style={{
          position: 'absolute', width: 300, height: 300, borderRadius: '50%',
          background: `radial-gradient(circle, ${accent}38 0%, transparent 70%)`,
          filter: 'blur(28px)', pointerEvents: 'none',
        }}
      />

      {/* Pulsing rings */}
      {[220, 380].map((size, i) => (
        <motion.div key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.5, 0] }}
          transition={{ delay: 0.3 + i * 0.25, duration: 1.6, repeat: Infinity }}
          style={{
            position: 'absolute', width: size, height: size, borderRadius: '50%',
            border: `1px solid ${accent}30`, pointerEvents: 'none',
          }}
        />
      ))}

      {/* Logo */}
      <motion.div
        initial={{ scale: 0.45, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6, type: 'spring', stiffness: 175, damping: 14 }}
        style={{
          width: 104, height: 104, borderRadius: 28, background: 'white', padding: 10,
          boxShadow: `0 0 80px ${accent}70, 0 0 160px ${accent}30, 0 24px 56px rgba(0,0,0,0.6)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 28, zIndex: 1, position: 'relative',
        }}
      >
        <motion.img
          src={bhagyaLogo}
          alt="logo"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ delay: 0.9, duration: 1.0, repeat: 1, ease: 'easeInOut' }}
          style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 18 }}
        />
      </motion.div>

      {/* Company name */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.68, duration: 0.45 }}
        style={{
          fontSize: '1.48rem', fontWeight: 800, color: 'white',
          letterSpacing: '0.025em', textAlign: 'center', marginBottom: 8,
          textShadow: `0 0 50px ${accent}90`, zIndex: 1, position: 'relative',
        }}
      >
        Sri Bhagyalakshmi Groups
      </motion.div>

      {/* Tagline */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.42 }}
        transition={{ delay: 0.98, duration: 0.4 }}
        style={{
          fontSize: '0.7rem', color: 'white',
          letterSpacing: '0.24em', textTransform: 'uppercase',
          zIndex: 1, position: 'relative',
        }}
      >
        Tested · Tasted · Trusted
      </motion.div>
    </motion.div>
  );
}
