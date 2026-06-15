import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useColorMode } from '../theme/ThemeContext';

export default function NotFound() {
  const navigate = useNavigate();
  const { isDarkMode, selectedAccent, selectedFont } = useColorMode();

  const accent    = selectedAccent?.primary   || '#1a237e';
  const accent2   = selectedAccent?.secondary || '#283593';
  const cardBg    = isDarkMode ? '#1e293b' : 'white';
  const textClr   = isDarkMode ? '#e2e8f0' : '#1e293b';
  const mutedClr  = isDarkMode ? '#94a3b8' : '#64748b';
  const pageBg    = isDarkMode ? '#0f172a' : '#f8fafc';
  const fontFamily = selectedFont?.body || "'Manrope', sans-serif";

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: pageBg, fontFamily,
    }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          background: cardBg, borderRadius: 16, padding: '3rem 3.5rem',
          textAlign: 'center', maxWidth: 420,
          boxShadow: isDarkMode ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 32px rgba(0,0,0,0.08)',
        }}
      >
        <div style={{
          fontSize: '4.5rem', fontWeight: 900, lineHeight: 1,
          background: `linear-gradient(135deg, ${accent}, ${accent2})`,
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          marginBottom: '0.5rem',
        }}>
          404
        </div>

        <div style={{ fontSize: '1.15rem', fontWeight: 700, color: textClr, marginBottom: '0.5rem' }}>
          Page not found
        </div>

        <div style={{ fontSize: '0.85rem', color: mutedClr, marginBottom: '2rem', lineHeight: 1.6 }}>
          The page you're looking for doesn't exist or has been moved.
        </div>

        <button
          onClick={() => navigate('/dashboard')}
          style={{
            background: `linear-gradient(135deg, ${accent}, ${accent2})`,
            color: 'white', border: 'none', borderRadius: 8,
            padding: '0.55rem 1.5rem', fontSize: '0.88rem', fontWeight: 600,
            cursor: 'pointer', fontFamily,
          }}
        >
          <i className="bi bi-house" style={{ marginRight: 6 }} />
          Go to Dashboard
        </button>
      </motion.div>
    </div>
  );
}
