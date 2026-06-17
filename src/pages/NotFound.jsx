import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useColorMode } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function NotFound() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.4 }}>
          <div style={{
            fontSize: '4.5rem', fontWeight: 900, lineHeight: 1,
            background: `linear-gradient(135deg, ${accent}, ${accent2})`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            marginBottom: '0.5rem',
          }}>
            404
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.35 }}>
          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: textClr, marginBottom: '0.5rem' }}>
            Page not found
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.32, duration: 0.3 }}>
          <div style={{ fontSize: '0.85rem', color: mutedClr, marginBottom: '2rem', lineHeight: 1.6 }}>
            The page you're looking for doesn't exist or has been moved.
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.35 }}>
          <motion.button
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/')}
            style={{
              background: `linear-gradient(135deg, ${accent}, ${accent2})`,
              color: 'white', border: 'none', borderRadius: 8,
              padding: '0.55rem 1.5rem', fontSize: '0.88rem', fontWeight: 600,
              cursor: 'pointer', fontFamily,
            }}
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.97 }}
          >
            <i className="bi bi-house" style={{ marginRight: 6 }} />
            Go to Dashboard
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
}
