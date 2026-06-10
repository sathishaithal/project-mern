import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useColorMode } from "../../theme/ThemeContext";
import { useSummaryCards } from "../../context/SummaryCardsContext";
import SummaryCardsSystem from "../../components/SummaryCardsSystem/SummaryCardsSystem";

const fmt = (v) => {
  const n = parseFloat(v);
  if (isNaN(n) || n === 0) return '—';
  if (Math.abs(n) >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toFixed(1);
};

const REPORT_ITEMS = [
  {
    id: 'production',
    title: 'Production Report',
    description: 'View manufacturing output, efficiency metrics, and production timelines. Track FG production, raw material usage, and processing efficiency.',
    icon: 'bi-gear-wide-connected',
    path: '/reports/production',
    features: ['FG Net Production', 'Raw Material Usage', 'Mill Efficiency', 'Stock Movement'],
    badge: 'Operations',
  },
  {
    id: 'sales',
    title: 'Sales Report',
    description: 'Month-wise and year-on-year sales performance with multi-year drill-down by category, distributor, ASM, and sales officer.',
    icon: 'bi-graph-up-arrow',
    path: '/reports/sales',
    features: ['YoY Summary', 'Distributor Drill-down', 'Category Analysis', 'ASM Performance'],
    badge: 'Sales',
  },
];

const ReportCard = ({ item, accent, isDarkMode, border, delay }) => {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      whileHover={{ y: -5, boxShadow: `0 16px 40px ${accent}22` }}
      whileTap={{ scale: 0.985 }}
      style={{
        background: isDarkMode ? '#1e293b' : '#ffffff',
        border: `1px solid ${border}`,
        borderRadius: 18,
        padding: '1.6rem',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        cursor: 'pointer',
        flex: '1 1 280px',
        maxWidth: 480,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
      }}
      onClick={() => navigate(item.path)}
    >
      {/* Accent glow top-right */}
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: 120, height: 120,
        background: `radial-gradient(circle at 100% 0%, ${accent}28 0%, transparent 65%)`,
        pointerEvents: 'none',
      }} />

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14, flexShrink: 0,
          background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 8px 20px ${accent}44`,
        }}>
          <i className={`bi ${item.icon}`} style={{ fontSize: '1.45rem', color: 'white' }} />
        </div>
        <span style={{
          fontSize: '0.62rem', fontWeight: 800, padding: '4px 10px',
          borderRadius: 999, background: `${accent}18`, color: accent,
          border: `1px solid ${accent}30`, letterSpacing: '0.06em', textTransform: 'uppercase',
          alignSelf: 'flex-start',
        }}>
          {item.badge}
        </span>
      </div>

      {/* Title + desc */}
      <div>
        <h3 style={{ margin: '0 0 6px', fontWeight: 800, fontSize: '1.05rem', color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
          {item.title}
        </h3>
        <p style={{ margin: 0, fontSize: '0.77rem', color: isDarkMode ? '#64748b' : '#94a3b8', lineHeight: 1.6 }}>
          {item.description}
        </p>
      </div>

      {/* Feature pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {item.features.map(f => (
          <span key={f} style={{
            fontSize: '0.65rem', fontWeight: 600, padding: '3px 9px',
            borderRadius: 999,
            background: isDarkMode ? 'rgba(148,163,184,0.1)' : 'rgba(15,23,42,0.05)',
            color: isDarkMode ? '#94a3b8' : '#475569',
            border: `1px solid ${isDarkMode ? 'rgba(148,163,184,0.15)' : 'rgba(15,23,42,0.08)'}`,
          }}>
            {f}
          </span>
        ))}
      </div>

      {/* CTA */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 14px', borderRadius: 10, marginTop: 4,
        background: `linear-gradient(90deg, ${accent}, ${accent}cc)`,
        color: 'white', fontWeight: 700, fontSize: '0.8rem',
        justifyContent: 'space-between',
      }}>
        <span>View Report</span>
        <i className="bi bi-arrow-right" />
      </div>
    </motion.div>
  );
};

const Reports = () => {
  const { isDarkMode, selectedAccent } = useColorMode();
  const { dates, multiYearData, shortSupply } = useSummaryCards();
  const accent  = selectedAccent?.primary   || '#1a237e';
  const accent2 = selectedAccent?.secondary || '#283593';
  const textMut = isDarkMode ? '#94a3b8' : '#64748b';
  const border  = isDarkMode ? '#334155' : '#e2e8f0';

  const curRow = multiYearData?.length ? multiYearData[multiYearData.length - 1] : null;

  // Build quickStats only with real non-zero values
  const quickStats = useMemo(() => {
    const ytd    = parseFloat(curRow?.ttltonnage_crnt)   || 0;
    const curMon = dates?.currentmonthtonnage
      || (multiYearData ?? []).find(r => parseFloat(r.currentmonthtonnage) > 0)?.currentmonthtonnage;
    const yoy    = parseFloat(curRow?.ttltonnage_crntwy) || 0;
    const ssCount = (shortSupply ?? []).filter(r => (parseFloat(r.shortsupplytonnage) || 0) > 0).length;

    const stats = [];
    if (ytd > 0)    stats.push({ label: 'YTD Tonnage',    value: fmt(ytd) + ' T',           icon: 'bi-bar-chart-fill',       color: accent });
    if (curMon)     stats.push({ label: 'Current Month',  value: fmt(curMon) + ' T',         icon: 'bi-calendar3',            color: accent2 });
    if (yoy > 0)    stats.push({ label: 'YOY Comparable', value: fmt(yoy) + ' T',            icon: 'bi-arrow-left-right',     color: accent });
    if (ssCount > 0) stats.push({ label: 'Short Supply',  value: String(ssCount) + ' items', icon: 'bi-exclamation-triangle', color: '#ef4444' });
    return stats;
  }, [curRow, dates, multiYearData, shortSupply, accent, accent2]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      style={{ padding: '0 4px' }}
    >
      {/* Page header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1.4rem', color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
          Reports
        </h2>
        <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: textMut }}>
          Comprehensive analytics across sales and production
        </p>
      </div>

      {/* Summary Cards */}
      <SummaryCardsSystem context="reports" accent={accent} accent2={accent2} />

      {/* Quick stats bar — only when real data exists */}
      {quickStats.length > 0 && <div style={{
        display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 22, marginBottom: 24,
        padding: '14px 16px', borderRadius: 14,
        background: isDarkMode ? 'rgba(30,41,59,0.6)' : 'rgba(248,250,252,0.9)',
        border: `1px solid ${border}`,
      }}>
        {quickStats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 + i * 0.06 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              flex: '1 1 140px', padding: '8px 10px', borderRadius: 10,
              background: isDarkMode ? `${s.color}15` : `${s.color}0c`,
              border: `1px solid ${s.color}28`,
            }}
          >
            <i className={`bi ${s.icon}`} style={{ color: s.color, fontSize: '1rem', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '0.62rem', color: textMut, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: isDarkMode ? '#f1f5f9' : '#0f172a', lineHeight: 1.2 }}>{s.value}</div>
            </div>
          </motion.div>
        ))}
      </div>}

      {/* Report cards */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <i className="bi bi-collection-fill" style={{ color: accent, fontSize: '0.9rem' }} />
        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: isDarkMode ? '#e2e8f0' : '#1e293b' }}>
          Available Reports
        </span>
      </div>
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
        {REPORT_ITEMS.map((item, i) => (
          <ReportCard
            key={item.id}
            item={item}
            accent={i === 0 ? accent : accent2}
            isDarkMode={isDarkMode}
            border={border}
            delay={0.12 + i * 0.1}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default Reports;
