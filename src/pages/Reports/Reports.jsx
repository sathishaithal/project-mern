import React, { useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useColorMode } from "../../theme/ThemeContext";
import { useSummaryCards } from "../../context/SummaryCardsContext";
import { logActivity } from "../../services/activityLog";
import SummaryCardsSystem from "../../components/SummaryCardsSystem/SummaryCardsSystem";

const fmt = (v) => {
  const n = parseFloat(v);
  if (isNaN(n) || n === 0) return '—';
  if (Math.abs(n) >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toFixed(1);
};

const fmtT = (v) => {
  const n = parseFloat(v);
  if (!n || isNaN(n)) return null;
  if (Math.abs(n) >= 1000) return (n / 1000).toFixed(1) + 'K T';
  return n.toFixed(1) + ' T';
};

const MON_KEYS = ['jantonnage','febtonnage','martonnage','aprtonnage','maytonnage','juntonnage',
                  'jultonnage','augtonnage','septonnage','octtonnage','novtonnage','dectonnage'];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

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
  const { dates, multiYearData, shortSupply, sellingData } = useSummaryCards();
  const accent  = selectedAccent?.primary   || '#1a237e';
  const accent2 = selectedAccent?.secondary || '#283593';

  useEffect(() => { logActivity('Reports', 'Landing', '', 'view'); }, []);
  const textMut = isDarkMode ? '#94a3b8' : '#64748b';
  const border  = isDarkMode ? '#334155' : '#e2e8f0';

  const curRow      = multiYearData?.length ? multiYearData[multiYearData.length - 1] : null;
  const priorYearRow = multiYearData?.length > 1 ? multiYearData[multiYearData.length - 2] : null;

  const currentMonthName = new Date().toLocaleString('default', { month: 'long' });
  const currentMonIdx    = new Date().getMonth();

  const allShortSupply = useMemo(() =>
    (shortSupply ?? [])
      .filter(r => (parseFloat(r.shortsupplytonnage) || 0) > 0 && r.description?.toLowerCase() !== 'total')
      .sort((a, b) => (parseFloat(b.shortsupplytonnage) || 0) - (parseFloat(a.shortsupplytonnage) || 0)),
  [shortSupply]);

  const topCat = useMemo(() => {
    if (!sellingData?.length) return null;
    return [...sellingData].sort((a, b) => (parseFloat(b.tonnage) || 0) - (parseFloat(a.tonnage) || 0))[0] || null;
  }, [sellingData]);

  const ssTonnage = parseFloat(dates?.shortsupplytonnage) || 0;

  // Build quickStats only with real non-zero values
  const quickStats = useMemo(() => {
    const ytd     = parseFloat(curRow?.ttltonnage_crnt)   || 0;
    const curMon  = parseFloat(dates?.currentmonthtonnage
      || (multiYearData ?? []).find(r => parseFloat(r.currentmonthtonnage) > 0)?.currentmonthtonnage) || 0;
    const yoy     = parseFloat(curRow?.ttltonnage_crntwy) || 0;
    const q1      = parseFloat(curRow?.Q1) || 0;
    const q2      = parseFloat(curRow?.Q2) || 0;
    const q3      = parseFloat(curRow?.Q3) || 0;
    const ssCount = allShortSupply.length;
    const topCatTon  = parseFloat(topCat?.tonnage) || 0;
    const topCatName = topCat?.catgroup || topCat?.description || '';
    const priorVal   = parseFloat(priorYearRow?.ttltonnage_crntwy || priorYearRow?.ttltonnage_crnt) || 0;

    const stats = [];
    if (ytd > 0)       stats.push({ label: 'YTD Tonnage',                  value: fmt(ytd) + ' T',           icon: 'bi-bar-chart-fill',       color: accent });
    if (curMon > 0)    stats.push({ label: 'Current Month',                value: fmt(curMon) + ' T',        icon: 'bi-calendar3',            color: accent2 });
    if (q1 > 0)        stats.push({ label: 'Q1 (Jan–Mar)',                 value: fmtT(q1),                  icon: 'bi-bar-chart',            color: accent });
    if (q2 > 0)        stats.push({ label: 'Q2 (Apr–Jun)',                 value: fmtT(q2),                  icon: 'bi-bar-chart',            color: accent2 });
    if (q3 > 0)        stats.push({ label: 'Q3 (Jul–Sep)',                 value: fmtT(q3),                  icon: 'bi-bar-chart',            color: accent });
    if (yoy > 0)       stats.push({ label: 'YOY Comparable',              value: fmt(yoy) + ' T',            icon: 'bi-arrow-left-right',     color: accent });
    if (priorVal > 0)  stats.push({ label: 'Prior Year',                   value: fmt(priorVal) + ' T',      icon: 'bi-clock-history',        color: accent2 });
    if (topCatTon > 0) stats.push({ label: `Top: ${topCatName}`,          value: fmtT(topCatTon),            icon: 'bi-award-fill',           color: accent });
    if (ssCount > 0)   stats.push({ label: `Short Supply — ${currentMonthName}`, value: String(ssCount) + ' items', icon: 'bi-exclamation-triangle', color: '#ef4444' });
    if (ssTonnage > 0) stats.push({ label: 'S.Supply Tonnage',            value: fmtT(ssTonnage),            icon: 'bi-exclamation-circle',   color: '#ef4444' });

    return stats;
  }, [curRow, priorYearRow, dates, multiYearData, allShortSupply, topCat, ssTonnage, accent, accent2, currentMonthName]);

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
          overflow: 'hidden', marginBottom: 24,
          maskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 90%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 90%, transparent 100%)',
        }}>
          <motion.div
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: Math.max(14, quickStats.length * 4), ease: 'linear', repeat: Infinity }}
            style={{ display: 'inline-flex', gap: 14 }}
          >
            {[...quickStats, ...quickStats].map((s, i) => (
              <div
                key={i}
                style={{
                  flexShrink: 0,
                  width: 210,
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
              </div>
            ))}
          </motion.div>
        </div>
      </>}

      {/* Report Insights — Monthly Sales Comparison + Short Supply Detail */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <i className="bi bi-lightbulb-fill" style={{ color: accent, fontSize: '0.9rem' }} />
        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: isDarkMode ? '#e2e8f0' : '#1e293b' }}>
          Report Insights
        </span>
      </div>
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 28 }}>

        {/* Card A — Monthly Sales: current year vs prior year */}
        <div style={{
          flex: '2 1 280px',
          background: isDarkMode ? '#1e293b' : '#ffffff',
          border: `1px solid ${border}`,
          borderRadius: 16,
          padding: '16px 18px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <i className="bi bi-calendar3" style={{ color: accent, fontSize: '0.9rem' }} />
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: isDarkMode ? '#e2e8f0' : '#1e293b' }}>
              Monthly Sales — {curRow?.year || new Date().getFullYear()}
            </span>
          </div>

          {!multiYearData ? (
            [0,1,2,3].map(k => (
              <motion.div key={k} animate={{ opacity: [0.4,0.9,0.4] }} transition={{ duration: 1.2, repeat: Infinity, delay: k*0.15 }}
                style={{ height: 20, borderRadius: 5, background: isDarkMode ? '#334155' : '#e2e8f0', marginBottom: 8 }} />
            ))
          ) : !curRow ? (
            <span style={{ fontSize: '0.78rem', color: textMut }}>No year data available</span>
          ) : (() => {
            const vals = MON_KEYS.map(k => parseFloat(curRow?.[k]) || 0);
            const maxVal = Math.max(...vals, 1);
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 60px', gap: 4, paddingBottom: 5, borderBottom: `1px solid ${border}` }}>
                  <span style={{ fontSize: '0.6rem', fontWeight: 700, color: textMut, textTransform: 'uppercase' }}>Mon</span>
                  <span />
                  <span style={{ fontSize: '0.6rem', fontWeight: 700, color: accent, textAlign: 'right', textTransform: 'uppercase' }}>Tonnage</span>
                </div>
                {MONTHS_SHORT.map((mon, idx) => {
                  const cy = vals[idx];
                  const isCurrent = idx === currentMonIdx;
                  const isFuture  = idx > currentMonIdx && cy === 0;
                  if (isFuture) return null;
                  return (
                    <div key={mon} style={{
                      display: 'grid', gridTemplateColumns: '40px 1fr 60px', gap: 4, alignItems: 'center',
                      padding: isCurrent ? '3px 4px' : '1px 4px',
                      borderRadius: isCurrent ? 6 : 0,
                      background: isCurrent ? `${accent}12` : 'transparent',
                    }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: isCurrent ? 800 : 600, color: isCurrent ? accent : (isDarkMode ? '#94a3b8' : '#64748b') }}>
                        {mon}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        {cy > 0 && (
                          <motion.div initial={{ width: 0 }} animate={{ width: `${(cy / maxVal) * 100}%` }}
                            transition={{ delay: 0.05 + idx * 0.04, duration: 0.5, ease: 'easeOut' }}
                            style={{ height: 5, borderRadius: 2, background: isCurrent ? accent : `${accent}99` }} />
                        )}
                      </div>
                      <span style={{ fontSize: '0.68rem', fontWeight: isCurrent ? 800 : 600, color: cy > 0 ? (isCurrent ? accent : (isDarkMode ? '#e2e8f0' : '#1e293b')) : textMut, textAlign: 'right' }}>
                        {cy > 0 ? fmt(cy) : '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* Card B — Short Supply Detail */}
        <div style={{
          flex: '1 1 200px',
          background: isDarkMode ? '#1e293b' : '#ffffff',
          border: `1px solid ${border}`,
          borderRadius: 16,
          padding: '16px 18px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="bi bi-exclamation-triangle-fill" style={{ color: '#ef4444', fontSize: '0.9rem' }} />
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: isDarkMode ? '#e2e8f0' : '#1e293b' }}>
                Short Supply — {currentMonthName}
              </span>
            </div>
            {allShortSupply.length > 0 && (
              <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#ef4444',
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 999, padding: '2px 8px' }}>
                {allShortSupply.length} items
              </span>
            )}
          </div>

          {shortSupply === null ? (
            [0,1,2,3].map(k => (
              <motion.div key={k} animate={{ opacity: [0.4,0.9,0.4] }} transition={{ duration: 1.2, repeat: Infinity, delay: k*0.15 }}
                style={{ height: 22, borderRadius: 5, background: isDarkMode ? '#334155' : '#e2e8f0', marginBottom: 8 }} />
            ))
          ) : allShortSupply.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 0', gap: 8 }}>
              <i className="bi bi-check-circle-fill" style={{ fontSize: '1.4rem', color: '#22c55e' }} />
              <span style={{ fontSize: '0.75rem', color: textMut }}>No short supply items</span>
            </div>
          ) : (() => {
            const maxTon = parseFloat(allShortSupply[0].shortsupplytonnage) || 1;
            const totalTon = allShortSupply.reduce((s, r) => s + (parseFloat(r.shortsupplytonnage) || 0), 0);
            return (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, paddingBottom: 8, borderBottom: `1px solid ${border}` }}>
                  <span style={{ fontSize: '0.68rem', color: textMut }}>Total deficit</span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#ef4444' }}>{totalTon.toFixed(1)} T</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7, maxHeight: 280, overflowY: 'auto' }}>
                  {allShortSupply.map((item, i) => {
                    const v = parseFloat(item.shortsupplytonnage) || 0;
                    const pct = (v / maxTon) * 100;
                    return (
                      <motion.div key={i} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 + i * 0.04 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                          <span style={{ fontSize: '0.68rem', fontWeight: 600, color: isDarkMode ? '#fca5a5' : '#b91c1c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                            {item.description}
                          </span>
                          <span style={{ fontSize: '0.64rem', color: textMut, flexShrink: 0 }}>{v.toFixed(1)} T</span>
                        </div>
                        <div style={{ height: 4, background: isDarkMode ? '#0f172a' : '#f8fafc', borderRadius: 3, border: `1px solid ${border}`, overflow: 'hidden' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ delay: 0.1 + i * 0.04, duration: 0.5, ease: 'easeOut' }}
                            style={{ height: '100%', background: 'linear-gradient(90deg, #ef4444, #f87171)', borderRadius: 3 }}
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </>
            );
          })()}
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
