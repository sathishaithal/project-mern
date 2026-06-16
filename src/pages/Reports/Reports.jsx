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
        <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: delay + 0.15, duration: 0.4, type: 'spring', stiffness: 220, damping: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, flexShrink: 0,
            background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 8px 20px ${accent}44`,
          }}>
            <i className={`bi ${item.icon}`} style={{ fontSize: '1.45rem', color: 'white' }} />
          </div>
        </motion.div>
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
        <p style={{
          margin: 0, fontSize: '0.77rem', color: isDarkMode ? '#64748b' : '#94a3b8', lineHeight: 1.6,
          display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
          overflow: 'hidden', minHeight: 'calc(3 * 0.77rem * 1.6)',
        }}>
          {item.description}
        </p>
      </div>

      {/* Feature pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, minHeight: 52 }}>
        {item.features.map(f => (
          <span key={f} style={{
            fontSize: '0.65rem', fontWeight: 600, padding: '3px 9px',
            borderRadius: 999, alignSelf: 'flex-start',
            background: isDarkMode ? 'rgba(148,163,184,0.1)' : 'rgba(15,23,42,0.05)',
            color: isDarkMode ? '#94a3b8' : '#475569',
            border: `1px solid ${isDarkMode ? 'rgba(148,163,184,0.15)' : 'rgba(15,23,42,0.08)'}`,
          }}>
            {f}
          </span>
        ))}
      </div>

      {/* CTA — marginTop auto pushes it to card bottom so both cards align */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 14px', borderRadius: 10, marginTop: 'auto',
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
  const { dates, multiYearData, shortSupply, sellingData, prodData, prodLoading } = useSummaryCards();
  const accent  = selectedAccent?.primary   || '#1a237e';
  const accent2 = selectedAccent?.secondary || '#283593';
  const textMut = isDarkMode ? '#94a3b8' : '#64748b';
  const border  = isDarkMode ? '#334155' : '#e2e8f0';

  const curRow = multiYearData?.length ? multiYearData[multiYearData.length - 1] : null;

  // Current month name for Sales Insight card title
  const currentMonthName = new Date().toLocaleString('default', { month: 'long' });

  // Top 5 categories sorted by tonnage desc
  const top5Categories = useMemo(() => {
    if (!sellingData || !sellingData.length) return sellingData === null ? null : [];
    const mapped = sellingData.map(item => ({
      name: item.description || item.catdescription || item.category || 'Unknown',
      tonnage: parseFloat(item.tonnage || item.totaltonnage || item.value || 0),
    }));
    return mapped.sort((a, b) => b.tonnage - a.tonnage).slice(0, 5);
  }, [sellingData]);

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

    // Prior Year stat — only when there are at least 2 year rows
    if (multiYearData && multiYearData.length > 1) {
      const priorRow = multiYearData[multiYearData.length - 2];
      const priorVal = parseFloat(priorRow?.ttltonnage_crntwy || priorRow?.ttltonnage_crnt) || 0;
      if (priorVal > 0) stats.push({ label: 'Prior Year', value: fmt(priorVal) + ' T', icon: 'bi-clock-history', color: accent2 });
    }

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
        <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: textMut }}>
          Comprehensive analytics across sales and production
        </p>
      </div>

      {/* Summary Cards */}
      <SummaryCardsSystem context="reports" accent={accent} accent2={accent2} />

      {/* Quick stats — Performance Overview */}
      {quickStats.length > 0 && <>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, marginTop: 6 }}>
          <i className="bi bi-speedometer2" style={{ color: accent, fontSize: '0.9rem' }} />
          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: isDarkMode ? '#e2e8f0' : '#1e293b' }}>
            Performance Overview
          </span>
        </div>
        <div style={{
          display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 24,
        }}>
          {quickStats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + i * 0.07 }}
              style={{
                flex: '1 1 160px',
                padding: '16px 18px',
                borderRadius: 16,
                background: `linear-gradient(135deg, ${s.color} 0%, ${s.color}bb 100%)`,
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                boxShadow: `0 4px 18px ${s.color}44`,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div style={{
                position: 'absolute', top: 0, right: 0, width: 90, height: 90,
                background: 'radial-gradient(circle at 100% 0%, rgba(255,255,255,0.15) 0%, transparent 70%)',
                pointerEvents: 'none',
              }} />
              <div style={{
                width: 40, height: 40, borderRadius: 11, flexShrink: 0,
                background: 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className={`bi ${s.icon}`} style={{ fontSize: '1.05rem', color: 'white' }} />
              </div>
              <div>
                <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', opacity: 0.85, marginBottom: 3 }}>{s.label}</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, lineHeight: 1 }}>{s.value}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </>}

      {/* Report Insights — Sales by Category + Production Snapshot */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <i className="bi bi-lightbulb-fill" style={{ color: accent, fontSize: '0.9rem' }} />
        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: isDarkMode ? '#e2e8f0' : '#1e293b' }}>
          Report Insights
        </span>
      </div>
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 28 }}>

        {/* Card A — Sales by Category */}
        <div style={{
          flex: '2 1 280px',
          background: isDarkMode ? '#1e293b' : '#ffffff',
          border: `1px solid ${border}`,
          borderRadius: 16,
          padding: '16px 18px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <i className="bi bi-bar-chart-fill" style={{ color: accent, fontSize: '0.9rem' }} />
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: isDarkMode ? '#e2e8f0' : '#1e293b' }}>
              Sales by Category — {currentMonthName}
            </span>
          </div>

          {top5Categories === null ? (
            /* Loading skeletons */
            [0, 1, 2].map(k => (
              <motion.div
                key={k}
                animate={{ opacity: [0.4, 0.9, 0.4] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: k * 0.2 }}
                style={{ height: 24, borderRadius: 6, background: isDarkMode ? '#334155' : '#e2e8f0', marginBottom: 10 }}
              />
            ))
          ) : top5Categories.length === 0 ? (
            <span style={{ fontSize: '0.78rem', color: textMut }}>No category data available</span>
          ) : (() => {
            const maxTon = top5Categories[0]?.tonnage || 1;
            const barOpacities = ['ee', 'cc', 'aa', '88', '66'];
            return top5Categories.map((cat, i) => (
              <div key={cat.name} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                  <span style={{ fontSize: '0.72rem', color: isDarkMode ? '#cbd5e1' : '#475569', fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8 }}>
                    {cat.name}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: accent, fontWeight: 700, flexShrink: 0 }}>
                    {cat.tonnage.toFixed(1)} T
                  </span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: isDarkMode ? '#334155' : '#e2e8f0', overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(cat.tonnage / maxTon) * 100}%` }}
                    transition={{ duration: 0.6, delay: i * 0.06, ease: 'easeOut' }}
                    style={{ height: '100%', borderRadius: 3, background: `${accent}${barOpacities[i]}` }}
                  />
                </div>
              </div>
            ));
          })()}
        </div>

        {/* Card B — Production Snapshot */}
        <div style={{
          flex: '1 1 200px',
          background: isDarkMode ? '#1e293b' : '#ffffff',
          border: `1px solid ${border}`,
          borderRadius: 16,
          padding: '16px 18px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <i className="bi bi-gear-wide-connected" style={{ color: accent2, fontSize: '0.9rem' }} />
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: isDarkMode ? '#e2e8f0' : '#1e293b' }}>
              Production Today
            </span>
          </div>

          {prodLoading ? (
            [0, 1, 2].map(k => (
              <motion.div
                key={k}
                animate={{ opacity: [0.4, 0.9, 0.4] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: k * 0.2 }}
                style={{ height: 28, borderRadius: 6, background: isDarkMode ? '#334155' : '#e2e8f0', marginBottom: 10 }}
              />
            ))
          ) : prodData ? (
            [
              { label: 'FG Net Production', value: `${prodData?.fgnetproduction || prodData?.fg_net || '—'} Kg` },
              { label: 'Raw Material',      value: `${prodData?.rawmaterialused || '—'} Kg` },
              { label: 'Efficiency',        value: `${prodData?.efficiency || prodData?.efficiencypct || '—'} %` },
              { label: 'Bags',              value: prodData?.bags || prodData?.totalbags || '—' },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: '0.7rem', color: textMut }}>{row.label}</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: accent2 }}>{row.value}</span>
              </div>
            ))
          ) : (
            <span style={{ fontSize: '0.78rem', color: textMut }}>No production data for today</span>
          )}
        </div>

      </div>

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
