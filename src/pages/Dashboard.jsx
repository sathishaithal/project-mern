import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useColorMode } from "../theme/ThemeContext";
import SummaryCardsSystem from "../components/SummaryCardsSystem/SummaryCardsSystem";

const Dashboard = () => {
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const { isDarkMode, selectedAccent } = useColorMode();
  const accent  = selectedAccent?.primary   || '#1a237e';
  const accent2 = selectedAccent?.secondary || '#283593';

  const username = user?.username || 'User';

  const reportLinks = [
    {
      title: 'Production Report',
      desc: 'Production output, efficiency metrics and production timelines',
      icon: 'bi-gear-wide-connected',
      path: '/reports/production',
      color: accent,
    },
    {
      title: 'Sales Report',
      desc: 'Month-wise and year-on-year sales performance with drill-down',
      icon: 'bi-graph-up-arrow',
      path: '/reports/sales',
      color: accent2,
    },
  ];

  const cardBg  = isDarkMode ? '#1e293b' : '#ffffff';
  const textMut = isDarkMode ? '#94a3b8' : '#64748b';
  const border  = isDarkMode ? '#334155' : '#e2e8f0';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      style={{ padding: '0 4px' }}
    >
      {/* Welcome */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontWeight: 700, fontSize: '1.35rem', color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
          Welcome back, {username}
        </h2>
        <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: textMut }}>
          Here's your daily snapshot — select cards below to customise what you track.
        </p>
      </div>

      {/* Summary Cards — same as every report page, loaded once from context */}
      <SummaryCardsSystem context="dashboard" accent={accent} accent2={accent2} />

      {/* Quick access */}
      <div style={{ marginTop: 28, marginBottom: 10 }}>
        <h3 style={{ margin: '0 0 14px', fontWeight: 700, fontSize: '1rem', color: isDarkMode ? '#e2e8f0' : '#1e293b' }}>
          Quick Report Access
        </h3>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {reportLinks.map(r => (
            <motion.div
              key={r.path}
              whileHover={{ translateY: -3, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}
              onClick={() => navigate(r.path)}
              style={{
                flex: '1 1 220px', maxWidth: 320, cursor: 'pointer',
                background: cardBg, borderRadius: 12, padding: '1.1rem 1.2rem',
                border: `1px solid ${border}`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                display: 'flex', gap: 14, alignItems: 'flex-start',
                transition: 'box-shadow 0.2s',
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: `linear-gradient(135deg, ${r.color}, ${r.color}bb)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className={`bi ${r.icon}`} style={{ fontSize: '1.2rem', color: 'white' }} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: isDarkMode ? '#f1f5f9' : '#0f172a', marginBottom: 3 }}>
                  {r.title}
                </div>
                <div style={{ fontSize: '0.74rem', color: textMut, lineHeight: 1.5 }}>
                  {r.desc}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
